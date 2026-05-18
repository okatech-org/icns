// Liste des documents iDocument (tableau filtrable)

import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { FileText, Eye, Trash2, RotateCcw, MoreHorizontal, Download } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "./StatusBadge";
import { DocumentDetailSheet } from "./DocumentDetailSheet";
import { useIDocDocuments, useTrashIDocDocument, useRestoreIDocDocument, useDeleteIDocDocument } from "@/hooks/useIDocument";
import type { IDocDocumentWithRelations } from "@/types/idocument";
import { toast } from "sonner";

interface DocumentListProps {
    folderId: string | null;
    showTrashOnly?: boolean;
}

export function DocumentList({ folderId, showTrashOnly = false }: DocumentListProps) {
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<IDocDocumentWithRelations | null>(null);

    const filters = showTrashOnly
        ? { status: "trashed" as const }
        : folderId
        ? { folderId, search: search || undefined }
        : { search: search || undefined };

    const { data: documents, isLoading } = useIDocDocuments(filters);
    const trash = useTrashIDocDocument();
    const restore = useRestoreIDocDocument();
    const deleteDoc = useDeleteIDocDocument();

    const handleTrash = async (id: string) => {
        try {
            await trash.mutateAsync(id);
            toast.success("Document mis a la corbeille");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Echec");
        }
    };

    const handleRestore = async (id: string) => {
        try {
            await restore.mutateAsync(id);
            toast.success("Document restaure");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Echec");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Supprimer definitivement ce document ?")) return;
        try {
            await deleteDoc.mutateAsync(id);
            toast.success("Document supprime");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Echec");
        }
    };

    return (
        <>
            <div className="flex items-center justify-between gap-4 mb-4">
                <Input
                    placeholder="Rechercher par titre..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-md"
                />
                <span className="text-sm text-muted-foreground">
                    {documents ? `${documents.length} document(s)` : ""}
                </span>
            </div>

            <div className="rounded-2xl border bg-card overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Titre</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead>Mise a jour</TableHead>
                            <TableHead className="w-12"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                                    Chargement...
                                </TableCell>
                            </TableRow>
                        ) : !documents || documents.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                                    Aucun document {showTrashOnly ? "dans la corbeille" : ""}
                                </TableCell>
                            </TableRow>
                        ) : (
                            documents.map((doc) => (
                                <TableRow
                                    key={doc.id}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => setSelected(doc)}
                                >
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                                            <div className="min-w-0">
                                                <p className="font-medium truncate">{doc.title}</p>
                                                {doc.file_name && (
                                                    <p className="text-xs text-muted-foreground truncate">
                                                        {doc.file_name}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {doc.document_type ? (
                                            <span className="text-sm">{doc.document_type.nom}</span>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge status={doc.status} />
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm text-muted-foreground">
                                            {format(new Date(doc.updated_at), "d MMM yyyy HH:mm", { locale: fr })}
                                        </span>
                                    </TableCell>
                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => setSelected(doc)}>
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    Ouvrir
                                                </DropdownMenuItem>
                                                {doc.file_url && (
                                                    <DropdownMenuItem asChild>
                                                        <a href={doc.file_url} download={doc.file_name ?? undefined}>
                                                            <Download className="h-4 w-4 mr-2" />
                                                            Telecharger
                                                        </a>
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuSeparator />
                                                {doc.status === "trashed" ? (
                                                    <>
                                                        <DropdownMenuItem onClick={() => handleRestore(doc.id)}>
                                                            <RotateCcw className="h-4 w-4 mr-2" />
                                                            Restaurer
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleDelete(doc.id)}
                                                            className="text-destructive"
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Supprimer definitivement
                                                        </DropdownMenuItem>
                                                    </>
                                                ) : (
                                                    <DropdownMenuItem
                                                        onClick={() => handleTrash(doc.id)}
                                                        className="text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Mettre a la corbeille
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <DocumentDetailSheet
                open={!!selected}
                onOpenChange={(o) => !o && setSelected(null)}
                document={selected}
            />
        </>
    );
}
