import { useState } from 'react';
import { X, Download, Archive, FolderInput, History, FileText } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Document = Database['public']['Tables']['documents']['Row'];
type Folder = Database['public']['Tables']['document_folders']['Row'];
type DocumentHistory = Database['public']['Tables']['document_history']['Row'];

interface DocumentViewerProps {
    document: Document;
    folders: Folder[];
    onClose: () => void;
    onUpdate: () => void;
}

export function DocumentViewer({ document, folders, onClose, onUpdate }: DocumentViewerProps) {
    const [selectedFolderId, setSelectedFolderId] = useState<string>('');
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Fetch document history
    const { data: history = [] } = useQuery({
        queryKey: ['document_history', document.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('document_history')
                .select('*')
                .eq('document_id', document.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as DocumentHistory[];
        },
    });

    // Add to folder mutation
    const addToFolderMutation = useMutation({
        mutationFn: async (folderId: string) => {
            const { error } = await supabase
                .from('document_folder_items')
                .insert({
                    folder_id: folderId,
                    document_id: document.id,
                });

            if (error) throw error;
        },
        onSuccess: () => {
            toast({ title: 'Document classé', description: 'Le document a été ajouté au dossier' });
            queryClient.invalidateQueries({ queryKey: ['folder_documents'] });
            setSelectedFolderId('');
            onUpdate();
        },
    });

    // Mark as read mutation
    const markAsReadMutation = useMutation({
        mutationFn: async () => {
            const { error } = await supabase
                .from('documents')
                .update({ status: 'read' })
                .eq('id', document.id);

            if (error) throw error;
        },
        onSuccess: () => {
            toast({ title: 'Document marqué comme lu' });
            queryClient.invalidateQueries({ queryKey: ['documents'] });
            onUpdate();
        },
    });

    // Archive mutation
    const archiveMutation = useMutation({
        mutationFn: async () => {
            const { error } = await supabase
                .from('documents')
                .update({ status: 'archived' })
                .eq('id', document.id);

            if (error) throw error;
        },
        onSuccess: () => {
            toast({ title: 'Document archivé' });
            queryClient.invalidateQueries({ queryKey: ['documents'] });
            onClose();
        },
    });

    const handleClassify = () => {
        if (selectedFolderId) {
            addToFolderMutation.mutate(selectedFolderId);
        }
    };

    // Parse scan URLs from JSONB
    const envelopeScans = Array.isArray(document.envelope_scan_urls)
        ? document.envelope_scan_urls
        : [];
    const contentScans = Array.isArray(document.content_scan_urls)
        ? document.content_scan_urls
        : [];

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl h-[90vh] p-0">
                <div className="flex h-full">
                    {/* Left - Document Preview */}
                    <div className="flex-1 bg-slate-50 dark:bg-slate-900 p-6 overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-bold">
                                {document.title || `Document ${document.document_number}`}
                            </h2>
                            <Button variant="ghost" size="icon" onClick={onClose}>
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Document Scans */}
                        <div className="space-y-4">
                            {envelopeScans.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold mb-2">Enveloppe</h3>
                                    <div className="grid gap-2">
                                        {envelopeScans.map((url, idx) => (
                                            <img
                                                key={idx}
                                                src={url as string}
                                                alt={`Enveloppe ${idx + 1}`}
                                                className="w-full rounded-lg border"
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {contentScans.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold mb-2">Contenu</h3>
                                    <div className="grid gap-2">
                                        {contentScans.map((url, idx) => (
                                            <img
                                                key={idx}
                                                src={url as string}
                                                alt={`Page ${idx + 1}`}
                                                className="w-full rounded-lg border"
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {envelopeScans.length === 0 && contentScans.length === 0 && (
                                <div className="flex items-center justify-center h-64 text-muted-foreground">
                                    <div className="text-center">
                                        <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                        <p>Aucune numérisation disponible</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right - Metadata & Actions */}
                    <div className="w-96 border-l border-border flex flex-col">
                        <div className="p-6 border-b border-border">
                            <h3 className="font-semibold mb-4">Informations</h3>

                            <div className="space-y-3 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Numéro:</span>
                                    <p className="font-mono">{document.document_number}</p>
                                </div>

                                <div>
                                    <span className="text-muted-foreground">Statut:</span>
                                    <div className="mt-1">
                                        <Badge>{document.status}</Badge>
                                        {document.is_confidential && (
                                            <Badge variant="destructive" className="ml-2">Confidentiel</Badge>
                                        )}
                                    </div>
                                </div>

                                {document.sender_name && (
                                    <div>
                                        <span className="text-muted-foreground">Expéditeur:</span>
                                        <p>{document.sender_name}</p>
                                        {document.sender_organization && (
                                            <p className="text-xs text-muted-foreground">{document.sender_organization}</p>
                                        )}
                                    </div>
                                )}

                                <div>
                                    <span className="text-muted-foreground">Déposé le:</span>
                                    <p>
                                        {new Date(document.deposited_at).toLocaleDateString('fr-FR', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Classification */}
                        <div className="p-6 border-b border-border">
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                                <FolderInput className="w-4 h-4" />
                                Classer dans un dossier
                            </h3>

                            <div className="flex gap-2">
                                <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choisir un dossier..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {folders.map((folder) => (
                                            <SelectItem key={folder.id} value={folder.id}>
                                                <span className="flex items-center gap-2">
                                                    <span>{folder.icon}</span>
                                                    <span>{folder.name}</span>
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button
                                    onClick={handleClassify}
                                    disabled={!selectedFolderId || addToFolderMutation.isPending}
                                >
                                    Classer
                                </Button>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="p-6 border-b border-border space-y-2">
                            <h3 className="font-semibold mb-3">Actions</h3>

                            {document.status !== 'read' && (
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => markAsReadMutation.mutate()}
                                    disabled={markAsReadMutation.isPending}
                                >
                                    <FileText className="w-4 h-4 mr-2" />
                                    Marquer comme lu
                                </Button>
                            )}

                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => archiveMutation.mutate()}
                                disabled={archiveMutation.isPending}
                            >
                                <Archive className="w-4 h-4 mr-2" />
                                Archiver
                            </Button>

                            <Button variant="outline" className="w-full justify-start">
                                <Download className="w-4 h-4 mr-2" />
                                Télécharger
                            </Button>
                        </div>

                        {/* History */}
                        <div className="flex-1 p-6 overflow-hidden flex flex-col">
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                                <History className="w-4 h-4" />
                                Historique
                            </h3>

                            <ScrollArea className="flex-1">
                                <div className="space-y-3">
                                    {history.map((entry) => (
                                        <div key={entry.id} className="text-sm">
                                            <div className="flex items-start gap-2">
                                                <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                                                <div className="flex-1">
                                                    <p className="font-medium">{entry.action}</p>
                                                    {entry.notes && (
                                                        <p className="text-xs text-muted-foreground">{entry.notes}</p>
                                                    )}
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {new Date(entry.created_at).toLocaleString('fr-FR')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
