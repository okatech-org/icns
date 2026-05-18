// Sheet lateral : detail d un document iDocument

import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Eye, Download, History, Tag, FileText, FolderClosed, Calendar } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "./StatusBadge";
import { HashIndicator } from "@/components/shared/HashIndicator";
import { PreviewModal } from "@/components/shared/PreviewModal";
import { useIDocVersions } from "@/hooks/useIDocument";
import type { IDocDocumentWithRelations } from "@/types/idocument";

interface DocumentDetailSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    document: IDocDocumentWithRelations | null;
}

export function DocumentDetailSheet({ open, onOpenChange, document }: DocumentDetailSheetProps) {
    const [previewOpen, setPreviewOpen] = useState(false);
    const { data: versions } = useIDocVersions(document?.id ?? null);

    if (!document) return null;

    return (
        <>
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent className="w-[500px] sm:max-w-[500px] overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle className="flex items-start gap-2">
                            <FileText className="h-5 w-5 mt-0.5 shrink-0" />
                            <span>{document.title}</span>
                        </SheetTitle>
                        <SheetDescription>
                            {document.description || "Aucune description"}
                        </SheetDescription>
                    </SheetHeader>

                    <div className="space-y-6 mt-6">
                        <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge status={document.status} />
                            {document.document_type && (
                                <Badge variant="outline">{document.document_type.nom}</Badge>
                            )}
                            {document.tags.map((tag) => (
                                <Badge key={tag} variant="secondary">
                                    <Tag className="h-3 w-3 mr-1" />
                                    {tag}
                                </Badge>
                            ))}
                        </div>

                        {document.file_url && (
                            <div className="flex gap-2">
                                <Button onClick={() => setPreviewOpen(true)} className="flex-1">
                                    <Eye className="h-4 w-4 mr-2" />
                                    Apercu
                                </Button>
                                <Button asChild variant="outline">
                                    <a href={document.file_url} download={document.file_name ?? undefined}>
                                        <Download className="h-4 w-4 mr-2" />
                                        Telecharger
                                    </a>
                                </Button>
                            </div>
                        )}

                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                Fichier
                            </h4>
                            <dl className="space-y-2 text-sm">
                                <div className="flex justify-between gap-4">
                                    <dt className="text-muted-foreground">Nom</dt>
                                    <dd className="font-medium truncate">{document.file_name ?? "—"}</dd>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <dt className="text-muted-foreground">Taille</dt>
                                    <dd>{document.file_size ? `${(document.file_size / 1024 / 1024).toFixed(2)} Mo` : "—"}</dd>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <dt className="text-muted-foreground">Type MIME</dt>
                                    <dd className="font-mono text-xs">{document.mime_type ?? "—"}</dd>
                                </div>
                                <div className="flex justify-between gap-4 items-center">
                                    <dt className="text-muted-foreground">Empreinte</dt>
                                    <dd>
                                        <HashIndicator hash={document.content_hash} />
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        <Separator />

                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                Classement
                            </h4>
                            <dl className="space-y-2 text-sm">
                                <div className="flex justify-between gap-4">
                                    <dt className="text-muted-foreground flex items-center gap-1.5">
                                        <FolderClosed className="h-3.5 w-3.5" />
                                        Dossier
                                    </dt>
                                    <dd>{document.folder?.name ?? "Racine"}</dd>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <dt className="text-muted-foreground flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5" />
                                        Cree le
                                    </dt>
                                    <dd>{format(new Date(document.created_at), "d MMM yyyy HH:mm", { locale: fr })}</dd>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <dt className="text-muted-foreground flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5" />
                                        Modifie le
                                    </dt>
                                    <dd>{format(new Date(document.updated_at), "d MMM yyyy HH:mm", { locale: fr })}</dd>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <dt className="text-muted-foreground">Version courante</dt>
                                    <dd>v{document.current_version}</dd>
                                </div>
                            </dl>
                        </div>

                        {versions && versions.length > 0 && (
                            <>
                                <Separator />
                                <div className="space-y-3">
                                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                        <History className="h-4 w-4" />
                                        Historique des versions
                                    </h4>
                                    <ul className="space-y-2">
                                        {versions.map((v) => (
                                            <li
                                                key={v.id}
                                                className="flex items-start justify-between gap-2 text-sm border-l-2 border-primary/30 pl-3"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium">Version {v.version}</p>
                                                    {v.change_description && (
                                                        <p className="text-xs text-muted-foreground">
                                                            {v.change_description}
                                                        </p>
                                                    )}
                                                </div>
                                                <span className="text-xs text-muted-foreground shrink-0">
                                                    {format(new Date(v.created_at), "d MMM", { locale: fr })}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </>
                        )}
                    </div>
                </SheetContent>
            </Sheet>

            <PreviewModal
                open={previewOpen}
                onOpenChange={setPreviewOpen}
                title={document.title}
                fileUrl={document.file_url}
                fileName={document.file_name}
                mimeType={document.mime_type}
            />
        </>
    );
}
