import { FileText, Lock, Calendar, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Document = Database['public']['Tables']['documents']['Row'];

interface DocumentListProps {
    documents?: Document[];
    folderId?: string;
    isLoading?: boolean;
    onDocumentSelect: (document: Document) => void;
    emptyMessage?: string;
}

export function DocumentList({
    documents: propDocuments,
    folderId,
    isLoading: propLoading,
    onDocumentSelect,
    emptyMessage = 'Aucun document'
}: DocumentListProps) {
    // If folderId is provided, fetch documents in that folder
    const { data: folderDocuments, isLoading: folderLoading } = useQuery({
        queryKey: ['folder_documents', folderId],
        queryFn: async () => {
            if (!folderId) return [];

            const { data, error } = await supabase
                .from('document_folder_items')
                .select('document_id, documents(*)')
                .eq('folder_id', folderId);

            if (error) throw error;
            return data.map(item => item.documents).filter(Boolean) as Document[];
        },
        enabled: !!folderId
    });

    const documents = propDocuments || folderDocuments || [];
    const isLoading = propLoading || folderLoading;

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { label: string; className: string }> = {
            deposited: { label: 'Déposé', className: 'bg-blue-100 text-blue-700' },
            scanned_envelope: { label: 'Scanné', className: 'bg-yellow-100 text-yellow-700' },
            opened: { label: 'Ouvert', className: 'bg-green-100 text-green-700' },
            confidential_routed: { label: 'Confidentiel', className: 'bg-red-100 text-red-700' },
            read: { label: 'Lu', className: 'bg-gray-100 text-gray-700' },
            archived: { label: 'Archivé', className: 'bg-slate-100 text-slate-700' },
        };

        const config = variants[status] || { label: status, className: '' };
        return (
            <Badge variant="outline" className={config.className}>
                {config.label}
            </Badge>
        );
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    if (documents.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
                <div className="text-center">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>{emptyMessage}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-2 overflow-y-auto h-full pr-2">
            {documents.map((doc) => (
                <div
                    key={doc.id}
                    onClick={() => onDocumentSelect(doc)}
                    className="neu-card p-4 hover:shadow-neo-md transition-all cursor-pointer"
                >
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            {/* Title and Number */}
                            <div className="flex items-center gap-2 mb-2">
                                {doc.is_confidential && (
                                    <Lock className="w-4 h-4 text-destructive" />
                                )}
                                <h4 className="font-semibold text-sm truncate">
                                    {doc.title || `Document ${doc.document_number}`}
                                </h4>
                            </div>

                            {/* Metadata */}
                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <span className="font-mono">{doc.document_number}</span>
                                </div>
                                {doc.sender_name && (
                                    <div className="flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        <span>{doc.sender_name}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>
                                        {new Date(doc.deposited_at).toLocaleDateString('fr-FR', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric'
                                        })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Status Badge */}
                        <div>
                            {getStatusBadge(doc.status)}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
