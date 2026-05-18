import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Inbox, FileText, CheckCircle, AlertCircle,
    ChevronRight, Search, Filter, Eye, Send, Upload
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DocumentUploadZone } from '@/components/iasted/DocumentUploadZone';

// Types
interface MailItem {
    id: string;
    tracking_number: string;
    sender_name: string | null;
    sender_organization: string | null;
    reception_date: string;
    confidentiality_level?: 'public' | 'restricted' | 'secret';
    status: string;
    urgency?: 'normal' | 'high' | 'critical';
    envelope_ocr_text?: string;
    content?: string | null;
    subject?: string | null;
    created_at?: string;
    updated_at?: string;
}

interface MailAnalysis {
    id?: string;
    mail_id?: string;
    summary?: string | null;
    urgency?: string | null;
    confidentiality_level?: string | null;
    suggested_routing?: string | null;
    key_points?: any;
    created_at?: string;
}

export default function ServiceCourrier() {
    const { toast } = useToast();
    const [mails, setMails] = useState<MailItem[]>([]);
    const [selectedMail, setSelectedMail] = useState<MailItem | null>(null);
    const [analysis, setAnalysis] = useState<MailAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');

    // Fetch pending mails
    useEffect(() => {
        fetchMails();
    }, []);

    const fetchMails = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('mails')
            .select('*')
            .in('status', ['received', 'scanning', 'analyzing', 'pending_validation'])
            .order('reception_date', { ascending: false });

        if (error) {
            console.error('Error fetching mails:', error);
            toast({ title: "Erreur", description: "Impossible de charger les courriers", variant: "destructive" });
        } else {
            setMails(data || []);
        }
        setIsLoading(false);
    };

    const handleSelectMail = async (mail: MailItem) => {
        setSelectedMail(mail);
        setViewMode('detail');

        // Fetch existing analysis if any
        const { data, error } = await supabase
            .from('mail_ai_analysis')
            .select('*')
            .eq('mail_id', mail.id)
            .single();

        if (data) {
            setAnalysis(data);
        } else {
            setAnalysis(null);
        }
    };

    const handleContentUpload = async (file: File) => {
        if (!selectedMail) return;
        setIsAnalyzing(true);

        try {
            // 1. Upload content
            const fileName = `content/${selectedMail.id}/${Date.now()}_${file.name}`;
            const { error: uploadError } = await supabase.storage
                .from('mail-scans')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            // 2. Link attachment
            await supabase
                .from('mail_attachments')
                .insert({
                    mail_id: selectedMail.id,
                    file_path: fileName,
                    file_name: file.name,
                    attachment_type: 'content'
                });

            // 3. Trigger Level 2 Analysis
            const { data: analysisData, error: analysisError } = await supabase.functions.invoke('mail-analysis', {
                body: { mailId: selectedMail.id, analysisType: 'content' }
            });

            if (analysisError) throw analysisError;

            setAnalysis(analysisData.data);
            toast({ title: "Analyse terminée", description: "Le contenu a été analysé par l'IA." });

            // Refresh mail status
            fetchMails();

        } catch (error: any) {
            console.error('Error analyzing content:', error);
            toast({ title: "Erreur", description: error.message, variant: "destructive" });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleValidate = async () => {
        if (!selectedMail) return;

        try {
            // Update status and routing
            const { error } = await supabase
                .from('mails')
                .update({
                    status: 'validated',
                    current_owner_role: analysis?.suggested_routing || 'president' // Default fallback
                })
                .eq('id', selectedMail.id);

            if (error) throw error;

            // Log routing
            await supabase.from('mail_routing').insert({
                mail_id: selectedMail.id,
                from_service: 'service_courrier',
                to_service: analysis?.suggested_routing || 'president',
                comments: 'Validé par le service courrier'
            });

            toast({ title: "Validé", description: "Courrier transmis au destinataire." });
            setViewMode('list');
            fetchMails();
            setSelectedMail(null);

        } catch (error: any) {
            toast({ title: "Erreur", description: error.message, variant: "destructive" });
        }
    };

    return (
        <div className="min-h-screen bg-background p-6 space-y-6">
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold">Service Courrier</h1>
                    <p className="text-muted-foreground">Validation et Dispatching Intelligent</p>
                </div>
            </header>

            <div className="grid grid-cols-12 gap-6 h-[calc(100vh-12rem)]">
                {/* Sidebar List */}
                <div className={`col-span-12 lg:col-span-4 neu-card flex flex-col overflow-hidden ${viewMode === 'detail' ? 'hidden lg:flex' : ''}`}>
                    <div className="p-4 border-b border-border/50 bg-muted/30">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Rechercher un pli..."
                                className="w-full pl-9 pr-4 py-2 rounded-md bg-background border border-border focus:ring-2 focus:ring-primary/20 outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {isLoading ? (
                            <div className="p-8 text-center text-muted-foreground">Chargement...</div>
                        ) : mails.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">Aucun courrier en attente</div>
                        ) : (
                            mails.map(mail => (
                                <div
                                    key={mail.id}
                                    onClick={() => handleSelectMail(mail)}
                                    className={`p-4 rounded-lg cursor-pointer transition-all hover:bg-accent/50 border border-transparent ${selectedMail?.id === mail.id ? 'bg-accent border-primary/20 shadow-sm' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-mono text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded">{mail.tracking_number}</span>
                                        <span className="text-xs text-muted-foreground">{new Date(mail.reception_date).toLocaleDateString()}</span>
                                    </div>
                                    <h3 className="font-medium truncate">{mail.sender_name || 'Expéditeur Inconnu'}</h3>
                                    <p className="text-sm text-muted-foreground truncate">{mail.sender_organization}</p>
                                    <div className="mt-2 flex gap-2">
                                        {mail.confidentiality_level === 'secret' && (
                                            <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded border border-red-200">SECRET</span>
                                        )}
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${mail.status === 'pending_validation' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 'bg-gray-100 text-gray-600 border-gray-200'
                                            }`}>
                                            {mail.status === 'pending_validation' ? 'À Valider' : 'En Traitement'}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Main Content Area (Split View) */}
                <div className={`col-span-12 lg:col-span-8 flex flex-col ${viewMode === 'list' ? 'hidden lg:flex' : ''}`}>
                    {selectedMail ? (
                        <div className="h-full flex flex-col gap-4">
                            {/* Toolbar */}
                            <div className="flex items-center justify-between bg-card p-2 rounded-lg border border-border shadow-sm">
                                <button onClick={() => setViewMode('list')} className="lg:hidden p-2 hover:bg-accent rounded-md">
                                    <ChevronRight className="w-5 h-5 rotate-180" />
                                </button>
                                <div className="flex items-center gap-4 px-2">
                                    <span className="font-semibold">{selectedMail.tracking_number}</span>
                                    <span className="text-sm text-muted-foreground">| {selectedMail.sender_name}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleValidate}
                                        disabled={!analysis && selectedMail.confidentiality_level === 'public'}
                                        className="neu-button bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 px-4 py-2 text-sm"
                                    >
                                        <Send className="w-4 h-4" />
                                        Valider & Transmettre
                                    </button>
                                </div>
                            </div>

                            {/* Split View Content */}
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden">
                                {/* Left: Document Viewer */}
                                <div className="neu-card bg-muted/30 flex flex-col overflow-hidden relative">
                                    <div className="p-2 border-b border-border/50 bg-background/50 flex justify-between items-center">
                                        <span className="text-xs font-medium flex items-center gap-1"><Eye className="w-3 h-3" /> Aperçu</span>
                                        {selectedMail.confidentiality_level === 'secret' && (
                                            <span className="text-xs text-red-600 font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3" /> PLI FERMÉ</span>
                                        )}
                                    </div>

                                    <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
                                        {/* Placeholder for PDF/Image Viewer */}
                                        <div className="text-center space-y-4">
                                            <FileText className="w-16 h-16 text-muted-foreground/30 mx-auto" />
                                            <p className="text-sm text-muted-foreground">
                                                {selectedMail.confidentiality_level === 'secret'
                                                    ? "Visualisation du contenu impossible (Confidentiel)"
                                                    : "Aperçu du document numérisé"}
                                            </p>

                                            {selectedMail.confidentiality_level !== 'secret' && !analysis && (
                                                <div className="max-w-xs mx-auto">
                                                    <DocumentUploadZone
                                                        onFileSelect={handleContentUpload}
                                                        isProcessing={isAnalyzing}
                                                        label="Scanner le contenu pour analyse"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right: AI Analysis & Form */}
                                <div className="neu-card flex flex-col overflow-hidden bg-background">
                                    <div className="p-2 border-b border-border/50 bg-primary/5 flex justify-between items-center">
                                        <span className="text-xs font-medium text-primary flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3" /> Analyse IA
                                        </span>
                                        {analysis && (
                                            <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                                                Analyse complète
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                        {analysis ? (
                                            <>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-medium text-muted-foreground uppercase">Résumé</label>
                                                    <p className="text-sm leading-relaxed bg-muted/30 p-3 rounded-md border border-border/50">
                                                        {analysis.summary}
                                                    </p>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-medium text-muted-foreground uppercase">Confidentialité</label>
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-2 h-2 rounded-full ${analysis.confidentiality_level === 'secret' ? 'bg-red-500' :
                                                                    analysis.confidentiality_level === 'restricted' ? 'bg-yellow-500' : 'bg-green-500'
                                                                }`} />
                                                            <span className="text-sm capitalize">{analysis.confidentiality_level || 'public'}</span>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-medium text-muted-foreground uppercase">Urgence</label>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm capitalize">{analysis.urgency || 'normal'}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-4 pt-4 border-t border-border/50">
                                                    <h3 className="text-sm font-semibold flex items-center gap-2">
                                                        <Send className="w-4 h-4 text-primary" /> Routage Suggéré
                                                    </h3>

                                                    <div className="grid grid-cols-1 gap-4">
                                                        <div className="space-y-1.5">
                                                            <label className="text-xs text-muted-foreground">Destinataire</label>
                                                            <select
                                                                className="w-full p-2 rounded-md border border-border bg-background text-sm"
                                                                defaultValue={analysis.suggested_routing}
                                                            >
                                                                <option value="president">Président de la République</option>
                                                                <option value="dir_cabinet">Directeur de Cabinet</option>
                                                                <option value="sec_general">Secrétaire Général</option>
                                                                <option value="ministre_sante">Ministère de la Santé</option>
                                                                {/* Add other roles */}
                                                            </select>
                                                        </div>

                                                        <div className="space-y-1.5">
                                                            <label className="text-xs text-muted-foreground">Dossier de Classement</label>
                                                            <input
                                                                type="text"
                                                                className="w-full p-2 rounded-md border border-border bg-background text-sm"
                                                                placeholder="Classement suggéré"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4">
                                                <p className="text-center text-sm max-w-[200px]">
                                                    {selectedMail.confidentiality_level === 'secret'
                                                        ? "Validation manuelle requise pour pli confidentiel."
                                                        : "Veuillez scanner le contenu pour obtenir l'analyse IA."}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                            <div className="text-center">
                                <Inbox className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                <p>Sélectionnez un courrier à traiter</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
