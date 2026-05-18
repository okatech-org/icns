import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Printer, Check, Loader2, FileText, Scan } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Components
import { DocumentUploadZone } from '@/components/iasted/DocumentUploadZone';

interface ServiceReceptionProps {
    embedded?: boolean;
}

export default function ServiceReception({ embedded = false }: ServiceReceptionProps) {
    const { toast } = useToast();
    const [isScanning, setIsScanning] = useState(false);
    const [scannedFile, setScannedFile] = useState<File | null>(null);
    const [analysisResult, setAnalysisResult] = useState<any>(null);
    const [trackingNumber, setTrackingNumber] = useState<string | null>(null);

    const handleFileUpload = async (file: File) => {
        setScannedFile(file);
        setIsScanning(true);

        try {
            // 1. Upload file to Supabase Storage
            const fileName = `envelopes/${Date.now()}_${file.name}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('mail-scans')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            // 2. Create initial mail record
            const { data: mailData, error: mailError } = await supabase
                .from('mails')
                .insert({
                    status: 'scanning',
                    created_by: (await supabase.auth.getUser()).data.user?.id
                })
                .select()
                .single();

            if (mailError) throw mailError;

            const mailId = mailData.id;
            setTrackingNumber(mailData.tracking_number);

            // 3. Link attachment
            const { error: attachError } = await supabase
                .from('mail_attachments')
                .insert({
                    mail_id: mailId,
                    file_path: fileName,
                    file_name: file.name,
                    file_type: file.type,
                    attachment_type: 'envelope'
                });

            if (attachError) throw attachError;

            // 4. Trigger AI Analysis (Level 1 - Envelope)
            const { data: analysisData, error: analysisError } = await supabase.functions.invoke('mail-analysis', {
                body: { mailId, analysisType: 'envelope' }
            });

            if (analysisError) throw analysisError;

            setAnalysisResult(analysisData.data);

            toast({
                title: "Analyse terminée",
                description: "L'enveloppe a été traitée avec succès.",
            });

        } catch (error: any) {
            console.error('Error processing mail:', error);
            toast({
                title: "Erreur",
                description: "Impossible de traiter le courrier: " + error.message,
                variant: "destructive"
            });
        } finally {
            setIsScanning(false);
        }
    };

    const handlePrintReceipt = () => {
        window.print();
        toast({
            title: "Impression",
            description: "Récépissé envoyé à l'imprimante.",
        });
    };

    const handleReset = () => {
        setScannedFile(null);
        setAnalysisResult(null);
        setTrackingNumber(null);
    };

    const content = (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Ingestion */}
            <section className="space-y-6">
                <div className="neu-card p-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Scan className="w-5 h-5 text-primary" />
                        Nouveau Pli
                    </h2>

                    {!scannedFile ? (
                        <DocumentUploadZone
                            onFileSelect={handleFileUpload}
                            isProcessing={isScanning}
                        />
                    ) : (
                        <div className="space-y-4">
                            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                                <p className="text-sm text-muted-foreground">Aperçu du scan (Enveloppe)</p>
                                {/* In real app, show image preview here */}
                            </div>

                            {isScanning && (
                                <div className="flex items-center justify-center gap-2 text-primary animate-pulse">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Analyse IA en cours...</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* Right Column: Results & Receipt */}
            <section className="space-y-6">
                {analysisResult && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="neu-card p-6 border-l-4 border-primary"
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-foreground">Récépissé de Dépôt</h2>
                                <p className="text-sm text-muted-foreground">République Gabonaise - Présidence</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-muted-foreground">N° de Suivi</p>
                                <p className="text-xl font-mono font-bold text-primary">{trackingNumber || 'GA-2025-XXXX'}</p>
                            </div>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-background/50 rounded-lg">
                                    <p className="text-xs text-muted-foreground">Expéditeur Détecté</p>
                                    <p className="font-medium">{analysisResult.sender_name || 'Non identifié'}</p>
                                </div>
                                <div className="p-3 bg-background/50 rounded-lg">
                                    <p className="text-xs text-muted-foreground">Organisation</p>
                                    <p className="font-medium">{analysisResult.sender_organization || 'Non identifié'}</p>
                                </div>
                                <div className="p-3 bg-background/50 rounded-lg">
                                    <p className="text-xs text-muted-foreground">Date de Réception</p>
                                    <p className="font-medium">{new Date().toLocaleDateString()}</p>
                                </div>
                                <div className="p-3 bg-background/50 rounded-lg">
                                    <p className="text-xs text-muted-foreground">Confidentialité</p>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${analysisResult.confidentiality_level === 'secret' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                        }`}>
                                        {analysisResult.confidentiality_level?.toUpperCase() || 'PUBLIC'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 print:hidden">
                            <button
                                onClick={handlePrintReceipt}
                                className="flex-1 neu-button flex items-center justify-center gap-2 py-3"
                            >
                                <Printer className="w-4 h-4" />
                                Imprimer Récépissé
                            </button>
                            <button
                                onClick={handleReset}
                                className="px-4 neu-button bg-secondary text-secondary-foreground hover:bg-secondary/80"
                            >
                                Nouveau
                            </button>
                        </div>
                    </motion.div>
                )}

                {!analysisResult && !isScanning && (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-12 border-2 border-dashed border-border rounded-xl bg-background/50">
                        <FileText className="w-12 h-12 mb-4 opacity-20" />
                        <p>En attente de scan...</p>
                    </div>
                )}
            </section>
        </div>
    );

    if (embedded) {
        return content;
    }

    return (
        <div className="min-h-screen bg-background p-8 space-y-8">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Service Réception</h1>
                    <p className="text-muted-foreground">Ingestion et numérisation du courrier entrant</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                        Poste: Accueil Central
                    </div>
                </div>
            </header>

            <main>
                {content}
            </main>
        </div>
    );
}
