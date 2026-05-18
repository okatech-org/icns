import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Inbox, Folder, Star, AlertCircle, FileText,
    ChevronRight, Search, Filter
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MailItem {
    id: string;
    tracking_number: string;
    sender_name: string | null;
    sender_organization: string | null;
    reception_date: string;
    confidentiality_level?: 'public' | 'restricted' | 'secret';
    urgency?: 'normal' | 'high' | 'critical';
    status: string;
    content?: string | null;
    subject?: string | null;
    created_at?: string;
    updated_at?: string;
    ai_analysis?: {
        summary: string;
        suggested_folder: string;
        sentiment: string;
    };
}

export function MailInbox({ role = 'president' }: { role?: string }) {
    const [mails, setMails] = useState<MailItem[]>([]);
    const [selectedFolder, setSelectedFolder] = useState<string>('Tous');
    const [folders, setFolders] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchMails();
    }, [role]);

    const fetchMails = async () => {
        setIsLoading(true);

        try {
            // Fetch mails assigned to this role
            // @ts-expect-error - Type instantiation depth issue with Supabase types
            const { data: mailsData, error } = await supabase
                .from('mails')
                .select('*')
                .eq('current_owner_role', role)
                .order('reception_date', { ascending: false });

            if (error) {
                console.error('Error fetching inbox:', error);
            } else {
                const processedMails = (mailsData || []) as MailItem[];
                setMails(processedMails);

                // Calculate folder counts
                const folderCounts: Record<string, number> = { 'Tous': processedMails.length };
                processedMails.forEach((mail: MailItem) => {
                    const folder = mail.ai_analysis?.suggested_folder || 'Non classé';
                    folderCounts[folder] = (folderCounts[folder] || 0) + 1;

                    // Special folders
                    if (mail.confidentiality_level === 'secret') {
                        folderCounts['Affaires Réservées'] = (folderCounts['Affaires Réservées'] || 0) + 1;
                    }
                    if (mail.urgency === 'critical') {
                        folderCounts['Urgences'] = (folderCounts['Urgences'] || 0) + 1;
                    }
                });
                setFolders(folderCounts);
            }
        } catch (err) {
            console.error('Unexpected error:', err);
        }
        setIsLoading(false);
    };

    const filteredMails = mails.filter(mail => {
        if (selectedFolder === 'Tous') return true;
        if (selectedFolder === 'Affaires Réservées') return mail.confidentiality_level === 'secret';
        if (selectedFolder === 'Urgences') return mail.urgency === 'critical';
        return mail.ai_analysis?.suggested_folder === selectedFolder;
    });

    return (
        <div className="h-full grid grid-cols-12 gap-6">
            {/* Folders Sidebar */}
            <div className="col-span-3 neu-card p-4 flex flex-col gap-2">
                <h3 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wider px-2">Dossiers</h3>

                {Object.entries(folders).map(([folder, count]) => (
                    <button
                        key={folder}
                        onClick={() => setSelectedFolder(folder)}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${selectedFolder === folder
                                ? 'bg-primary/10 text-primary font-medium'
                                : 'hover:bg-accent text-foreground/80'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            {folder === 'Affaires Réservées' ? <AlertCircle className="w-4 h-4 text-red-500" /> :
                                folder === 'Urgences' ? <Star className="w-4 h-4 text-yellow-500" /> :
                                    <Folder className="w-4 h-4 opacity-70" />}
                            <span className="truncate">{folder}</span>
                        </div>
                        <span className="text-xs bg-background/50 px-1.5 py-0.5 rounded-full border border-border/50">{count}</span>
                    </button>
                ))}
            </div>

            {/* Mail List */}
            <div className="col-span-9 neu-card flex flex-col overflow-hidden">
                <div className="p-4 border-b border-border/50 flex justify-between items-center bg-muted/10">
                    <h2 className="font-semibold flex items-center gap-2">
                        <Inbox className="w-5 h-5 text-primary" />
                        {selectedFolder}
                    </h2>
                    <div className="flex gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Rechercher..."
                                className="pl-8 pr-4 py-1.5 text-sm rounded-md bg-background border border-border focus:ring-1 focus:ring-primary outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {isLoading ? (
                        <div className="p-12 text-center text-muted-foreground">Chargement de la boîte aux lettres...</div>
                    ) : filteredMails.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-4">
                            <Inbox className="w-12 h-12 opacity-20" />
                            <p>Aucun courrier dans ce dossier</p>
                        </div>
                    ) : (
                        filteredMails.map(mail => (
                            <motion.div
                                key={mail.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="group p-4 rounded-lg border border-transparent hover:border-border/50 hover:bg-accent/30 transition-all cursor-pointer bg-card"
                            >
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            {mail.urgency === 'critical' && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Urgent" />}
                                            <span className="font-semibold text-foreground truncate">{mail.sender_name}</span>
                                            <span className="text-xs text-muted-foreground">via {mail.sender_organization}</span>
                                        </div>
                                        <h4 className="text-sm font-medium text-primary/90 mb-1 truncate">
                                            {mail.ai_analysis?.summary || "Pas de résumé disponible"}
                                        </h4>
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                            {mail.ai_analysis?.sentiment && (
                                                <span className={`inline-block mr-2 px-1.5 rounded-sm capitalize ${mail.ai_analysis.sentiment === 'negative' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {mail.ai_analysis.sentiment}
                                                </span>
                                            )}
                                            Réf: {mail.tracking_number}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                                            {new Date(mail.reception_date).toLocaleDateString()}
                                        </span>
                                        {mail.confidentiality_level === 'secret' && (
                                            <span className="text-[10px] font-bold text-red-600 border border-red-200 bg-red-50 px-1.5 py-0.5 rounded">
                                                CONFIDENTIEL
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
