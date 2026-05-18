// Page principale iDocument : GED executive

import { useState, useMemo } from "react";
import { Plus, FileText, FolderClosed, ArchiveIcon, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { FolderTreeSidebar } from "@/components/idocument/FolderTreeSidebar";
import { DocumentList } from "@/components/idocument/DocumentList";
import { DocumentUploadDialog } from "@/components/idocument/DocumentUploadDialog";
import { useIDocFolders, useIDocStats } from "@/hooks/useIDocument";
import { foldersService } from "@/services/idocument";

export default function IDocumentPage() {
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [uploadOpen, setUploadOpen] = useState(false);

    const { data: folders } = useIDocFolders();
    const { data: stats } = useIDocStats();

    const isTrashView = selectedFolderId === "__trash__";

    const breadcrumb = useMemo(() => {
        if (!folders || isTrashView) return [];
        return foldersService.breadcrumb(folders, selectedFolderId);
    }, [folders, selectedFolderId, isTrashView]);

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-20">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary/10">
                            <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">iDocument</h1>
                            <p className="text-sm text-muted-foreground">
                                Gestion electronique des documents executifs
                            </p>
                        </div>
                    </div>
                    <Button onClick={() => setUploadOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nouveau document
                    </Button>
                </div>
            </header>

            <div className="container mx-auto px-6 py-6">
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <StatCard icon={<Inbox className="h-5 w-5" />} label="Total" value={stats.total} />
                        <StatCard icon={<FileText className="h-5 w-5" />} label="Brouillons" value={stats.draft} />
                        <StatCard icon={<FolderClosed className="h-5 w-5" />} label="Publies" value={stats.published} />
                        <StatCard icon={<ArchiveIcon className="h-5 w-5" />} label="Archives" value={stats.archived} />
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
                    <Card className="lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)]">
                        <ScrollArea className="lg:max-h-[calc(100vh-7rem)]">
                            <FolderTreeSidebar
                                selectedFolderId={selectedFolderId}
                                onSelect={setSelectedFolderId}
                            />
                        </ScrollArea>
                    </Card>

                    <div className="space-y-4">
                        {!isTrashView && (
                            <Breadcrumb>
                                <BreadcrumbList>
                                    <BreadcrumbItem>
                                        <BreadcrumbLink asChild>
                                            <button onClick={() => setSelectedFolderId(null)}>
                                                Racine
                                            </button>
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                    {breadcrumb.map((f, idx) => (
                                        <BreadcrumbItem key={f.id}>
                                            <BreadcrumbSeparator />
                                            {idx === breadcrumb.length - 1 ? (
                                                <BreadcrumbPage>{f.name}</BreadcrumbPage>
                                            ) : (
                                                <BreadcrumbLink asChild>
                                                    <button onClick={() => setSelectedFolderId(f.id)}>
                                                        {f.name}
                                                    </button>
                                                </BreadcrumbLink>
                                            )}
                                        </BreadcrumbItem>
                                    ))}
                                </BreadcrumbList>
                            </Breadcrumb>
                        )}

                        <DocumentList
                            folderId={isTrashView ? null : selectedFolderId}
                            showTrashOnly={isTrashView}
                        />
                    </div>
                </div>
            </div>

            <DocumentUploadDialog
                open={uploadOpen}
                onOpenChange={setUploadOpen}
                defaultFolderId={isTrashView ? null : selectedFolderId}
            />
        </div>
    );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
    return (
        <Card>
            <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted shrink-0 text-muted-foreground">{icon}</div>
                <div>
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                </div>
            </CardContent>
        </Card>
    );
}
