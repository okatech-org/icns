// Liste des archives avec filtres par categorie et statut

import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { FileText, Eye, Download, MoreHorizontal } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RetentionBadge } from "./RetentionBadge";
import { ArchiveDetailSheet } from "./ArchiveDetailSheet";
import { HashIndicator } from "@/components/shared/HashIndicator";
import { useArchives } from "@/hooks/useIArchive";
import type { IArchArchiveWithRelations } from "@/types/iarchive";

interface ArchiveListProps {
    categorySlug?: string;
    isVault?: boolean;
}

export function ArchiveList({ categorySlug, isVault }: ArchiveListProps) {
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<IArchArchiveWithRelations | null>(null);

    const { data: archives, isLoading } = useArchives({
        categorySlug,
        isVault,
        search: search || undefined,
    });

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
                    {archives ? `${archives.length} archive(s)` : ""}
                </span>
            </div>

            <div className="rounded-2xl border bg-card overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Titre</TableHead>
                            <TableHead>Categorie</TableHead>
                            <TableHead>Etat</TableHead>
                            <TableHead>Empreinte</TableHead>
                            <TableHead>Archivee le</TableHead>
                            <TableHead className="w-12"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                                    Chargement...
                                </TableCell>
                            </TableRow>
                        ) : !archives || archives.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                                    Aucune archive
                                </TableCell>
                            </TableRow>
                        ) : (
                            archives.map((arch) => (
                                <TableRow
                                    key={arch.id}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => setSelected(arch)}
                                >
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                                            <div className="min-w-0">
                                                <p className="font-medium truncate">{arch.title}</p>
                                                {arch.file_name && (
                                                    <p className="text-xs text-muted-foreground truncate">
                                                        {arch.file_name}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {arch.category ? (
                                            <span
                                                className="inline-flex items-center gap-1.5 text-sm"
                                                style={{ color: arch.category.color ?? undefined }}
                                            >
                                                {arch.category.name}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <RetentionBadge archive={arch} />
                                    </TableCell>
                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                        <HashIndicator hash={arch.sha256_hash} />
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm text-muted-foreground">
                                            {format(new Date(arch.archived_at), "d MMM yyyy", { locale: fr })}
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
                                                <DropdownMenuItem onClick={() => setSelected(arch)}>
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    Detail
                                                </DropdownMenuItem>
                                                {arch.file_url && (
                                                    <DropdownMenuItem asChild>
                                                        <a href={arch.file_url} download={arch.file_name ?? undefined}>
                                                            <Download className="h-4 w-4 mr-2" />
                                                            Telecharger
                                                        </a>
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

            <ArchiveDetailSheet
                open={!!selected}
                onOpenChange={(o) => !o && setSelected(null)}
                archive={selected}
            />
        </>
    );
}
