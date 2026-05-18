import { useState } from 'react';
import { FileText, FolderPlus, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FolderManager } from './FolderManager';
import { DocumentList } from './DocumentList';
import { DocumentViewer } from './DocumentViewer';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Document = Database['public']['Tables']['documents']['Row'];
type Folder = Database['public']['Tables']['document_folders']['Row'];

interface DocumentsSectionProps {
    userRole: string; // 'president', 'dgr', etc.
    className?: string;
}

export function DocumentsSection({ userRole, className = '' }: DocumentsSectionProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
    const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'unread' | 'read' | 'folders'>('unread');

    // Fetch folders for this role
    const { data: folders = [], isLoading: foldersLoading } = useQuery({
        queryKey: ['document_folders', userRole],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('document_folders')
                .select('*')
                .or(`service_role.eq.${userRole},service_role.is.null,created_by.eq.${(await supabase.auth.getUser()).data.user?.id}`)
                .order('sort_order', { ascending: true });

            if (error) throw error;
            return data as Folder[];
        },
    });

    // Fetch unread documents
    const { data: unreadDocuments = [], isLoading: unreadLoading } = useQuery({
        queryKey: ['documents', 'unread', userRole],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('documents')
                .select('*')
                .eq('current_holder_service', userRole)
                .in('status', ['scanned_envelope', 'opened', 'confidential_routed'])
                .order('deposited_at', { ascending: false });

            if (error) throw error;
            return data as Document[];
        },
    });

    // Fetch read documents
    const { data: readDocuments = [], isLoading: readLoading } = useQuery({
        queryKey: ['documents', 'read', userRole],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('documents')
                .select('*')
                .eq('current_holder_service', userRole)
                .in('status', ['read', 'archived'])
                .order('updated_at', { ascending: false });

            if (error) throw error;
            return data as Document[];
        },
    });

    // Filter documents by search query
    const filterDocuments = (docs: Document[]) => {
        if (!searchQuery) return docs;
        return docs.filter(doc =>
            doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.sender_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.document_number.toLowerCase().includes(searchQuery.toLowerCase())
        );
    };

    const filteredUnread = filterDocuments(unreadDocuments);
    const filteredRead = filterDocuments(readDocuments);

    // System folders (always shown)
    const unreadFolder = folders.find(f => f.name === 'Courriers Non Lus');
    const readFolder = folders.find(f => f.name === 'Courriers Lus');
    const customFolders = folders.filter(f =>
        f.folder_type === 'custom' ||
        (f.folder_type === 'system' && f.name !== 'Courriers Non Lus' && f.name !== 'Courriers Lus')
    );

    return (
        <div className={`flex flex-col h-full ${className}`}>
            {/* Header */}
            <div className="border-b border-border pb-4 mb-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <FileText className="w-6 h-6 text-primary" />
                        <h2 className="text-2xl font-bold">Documents</h2>
                    </div>
                    <Button
                        onClick={() => {/* TODO: Open create folder dialog */ }}
                        className="neu-raised"
                    >
                        <FolderPlus className="w-4 h-4 mr-2" />
                        Nouveau Dossier
                    </Button>
                </div>

                {/* Search */}
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher un document..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Button variant="outline" size="icon">
                        <Filter className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex gap-4 overflow-hidden">
                {/* Sidebar - Folders */}
                <div className="w-64 flex-shrink-0 overflow-y-auto">
                    <FolderManager
                        folders={customFolders}
                        onFolderSelect={setSelectedFolder}
                        selectedFolderId={selectedFolder}
                        userRole={userRole}
                    />
                </div>

                {/* Main Content - Documents */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
                        <TabsList className="grid w-full grid-cols-3 mb-4">
                            <TabsTrigger value="unread" className="relative">
                                Non Lus
                                {filteredUnread.length > 0 && (
                                    <span className="ml-2 px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                                        {filteredUnread.length}
                                    </span>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="read">
                                Lus
                            </TabsTrigger>
                            <TabsTrigger value="folders">
                                Mes Dossiers
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="unread" className="flex-1 overflow-hidden">
                            <DocumentList
                                documents={filteredUnread}
                                isLoading={unreadLoading}
                                onDocumentSelect={setSelectedDocument}
                                emptyMessage="Aucun courrier non lu"
                            />
                        </TabsContent>

                        <TabsContent value="read" className="flex-1 overflow-hidden">
                            <DocumentList
                                documents={filteredRead}
                                isLoading={readLoading}
                                onDocumentSelect={setSelectedDocument}
                                emptyMessage="Aucun courrier lu"
                            />
                        </TabsContent>

                        <TabsContent value="folders" className="flex-1 overflow-hidden">
                            {selectedFolder ? (
                                <DocumentList
                                    folderId={selectedFolder}
                                    onDocumentSelect={setSelectedDocument}
                                    emptyMessage="Ce dossier est vide"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                    <div className="text-center">
                                        <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                        <p>Sélectionnez un dossier pour voir son contenu</p>
                                    </div>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Document Viewer Modal */}
            {selectedDocument && (
                <DocumentViewer
                    document={selectedDocument}
                    folders={folders}
                    onClose={() => setSelectedDocument(null)}
                    onUpdate={() => {
                        // Refetch documents
                        // TODO: Implement optimistic updates
                    }}
                />
            )}
        </div>
    );
}
