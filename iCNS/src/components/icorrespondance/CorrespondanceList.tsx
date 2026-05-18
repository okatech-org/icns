// Liste des dossiers iCorrespondance

import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Mail, AlertCircle, Eye, MoreHorizontal, Send, Archive } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "./StatusBadge";
import { CorrespondanceDetailSheet } from "./CorrespondanceDetailSheet";
import { useICorrFolders } from "@/hooks/useICorrespondance";
import type { ICorrFolder } from "@/types/icorrespondance";

interface CorrespondanceListProps {
    statusFilter?: string;
    urgentOnly?: boolean;
}

export function CorrespondanceList({ statusFilter, urgentOnly }: CorrespondanceListProps) {
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<ICorrFolder | null>(null);

    const { data: folders, isLoading } = useICorrFolders({
        status: statusFilter,
        isUrgent: urgentOnly,
    });

    const filtered = folders?.filter((f) =>
        search ? f.name.toLowerCase().includes(search.toLowerCase()) || f.reference_number?.includes(search) : true
    );

    return (
        <>
            <div className="flex items-center justify-between gap-4 mb-4">
                <Input
                    placeholder="Rechercher par objet ou reference..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-md"
                />
                <span className="text-sm text-muted-foreground">
                    {filtered ? `${filtered.length} dossier(s)` : ""}
                </span>
            </div>

            <div className="rounded-2xl border bg-card overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Reference / Objet</TableHead>
                            <TableHead>Destinataire</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead>Cree le</TableHead>
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
                        ) : !filtered || filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                                    Aucune correspondance
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((folder) => (
                                <TableRow
                                    key={folder.id}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => setSelected(folder)}
                                >
                                    <TableCell>
                                        <div className="flex items-start gap-2">
                                            {folder.is_urgent && (
                                                <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                                            )}
                                            <Mail className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                            <div className="min-w-0">
                                                <p className="font-medium truncate">{folder.name}</p>
                                                {folder.reference_number && (
                                                    <p className="text-xs font-mono text-muted-foreground">
                                                        {folder.reference_number}
                                                    </p>
                                                )}
                                                {folder.correspondence_type && (
                                                    <Badge variant="outline" className="mt-1 text-xs">
                                                        {folder.correspondence_type}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {folder.recipient_name ? (
                                            <div className="text-sm">
                                                <p className="font-medium truncate">{folder.recipient_name}</p>
                                                {folder.recipient_organization && (
                                                    <p className="text-xs text-muted-foreground truncate">
                                                        {folder.recipient_organization}
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge status={folder.status} />
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm text-muted-foreground">
                                            {format(new Date(folder.created_at), "d MMM yyyy", { locale: fr })}
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
                                                <DropdownMenuItem onClick={() => setSelected(folder)}>
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    Detail
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <CorrespondanceDetailSheet
                open={!!selected}
                onOpenChange={(o) => !o && setSelected(null)}
                folderId={selected?.id ?? null}
            />
        </>
    );
}
