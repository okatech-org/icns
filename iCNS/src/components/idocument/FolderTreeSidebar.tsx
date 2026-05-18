// Sidebar : arbre des dossiers iDocument + actions

import { useMemo, useState } from "react";
import { ChevronRight, FolderClosed, FolderOpen, FolderPlus, Inbox, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIDocFolders, useCreateIDocFolder, useDeleteIDocFolder } from "@/hooks/useIDocument";
import { foldersService } from "@/services/idocument";
import type { IDocFolder, IDocFolderWithChildren } from "@/types/idocument";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface FolderTreeSidebarProps {
    selectedFolderId: string | null;
    onSelect: (folderId: string | null) => void;
    showTrash?: boolean;
}

export function FolderTreeSidebar({ selectedFolderId, onSelect, showTrash = true }: FolderTreeSidebarProps) {
    const { data: folders, isLoading } = useIDocFolders();
    const createFolder = useCreateIDocFolder();
    const deleteFolder = useDeleteIDocFolder();

    const tree = useMemo(
        () => (folders ? foldersService.buildTree(folders) : []),
        [folders]
    );

    const [createOpen, setCreateOpen] = useState(false);
    const [newName, setNewName] = useState("");
    const [parentId, setParentId] = useState<string | null>(null);

    const handleCreate = async () => {
        if (!newName.trim()) return;
        try {
            await createFolder.mutateAsync({ name: newName.trim(), parent_folder_id: parentId });
            toast.success("Dossier cree");
            setNewName("");
            setCreateOpen(false);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Echec creation dossier");
        }
    };

    const handleDelete = async (folder: IDocFolder) => {
        if (folder.document_count > 0) {
            toast.error("Le dossier contient encore des documents");
            return;
        }
        if (!confirm(`Supprimer le dossier "${folder.name}" ?`)) return;
        try {
            await deleteFolder.mutateAsync(folder.id);
            toast.success("Dossier supprime");
            if (selectedFolderId === folder.id) onSelect(null);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Echec suppression");
        }
    };

    return (
        <div className="flex flex-col gap-1 p-2">
            <div className="flex items-center justify-between px-2 py-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Dossiers
                </span>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                        setParentId(null);
                        setCreateOpen(true);
                    }}
                >
                    <FolderPlus className="h-4 w-4" />
                </Button>
            </div>

            <button
                onClick={() => onSelect(null)}
                className={cn(
                    "flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition-colors",
                    selectedFolderId === null
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-muted"
                )}
            >
                <Inbox className="h-4 w-4" />
                Tous les documents
            </button>

            <div className="space-y-0.5">
                {isLoading ? (
                    <div className="px-2 py-2 text-xs text-muted-foreground">Chargement...</div>
                ) : tree.length === 0 ? (
                    <div className="px-2 py-2 text-xs text-muted-foreground">Aucun dossier</div>
                ) : (
                    tree.map((node) => (
                        <FolderNode
                            key={node.id}
                            node={node}
                            selectedId={selectedFolderId}
                            onSelect={onSelect}
                            onAddChild={(pid) => {
                                setParentId(pid);
                                setCreateOpen(true);
                            }}
                            onDelete={handleDelete}
                            depth={0}
                        />
                    ))
                )}
            </div>

            {showTrash && (
                <button
                    onClick={() => onSelect("__trash__")}
                    className={cn(
                        "flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition-colors mt-2",
                        selectedFolderId === "__trash__"
                            ? "bg-primary/10 text-primary font-medium"
                            : "hover:bg-muted"
                    )}
                >
                    <Trash2 className="h-4 w-4" />
                    Corbeille
                </button>
            )}

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nouveau dossier</DialogTitle>
                        <DialogDescription>Choisissez un nom et un emplacement.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label>Nom</Label>
                            <Input
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="Ex. Conseil des ministres 2026"
                                autoFocus
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Dossier parent</Label>
                            <Select
                                value={parentId ?? "root"}
                                onValueChange={(v) => setParentId(v === "root" ? null : v)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="root">Racine</SelectItem>
                                    {(folders ?? []).map((f) => (
                                        <SelectItem key={f.id} value={f.id}>
                                            {f.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateOpen(false)}>
                            Annuler
                        </Button>
                        <Button onClick={handleCreate} disabled={!newName.trim() || createFolder.isPending}>
                            Creer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function FolderNode({
    node,
    selectedId,
    onSelect,
    onAddChild,
    onDelete,
    depth,
}: {
    node: IDocFolderWithChildren;
    selectedId: string | null;
    onSelect: (id: string | null) => void;
    onAddChild: (parentId: string) => void;
    onDelete: (folder: IDocFolder) => void;
    depth: number;
}) {
    const [open, setOpen] = useState(true);
    const isSelected = selectedId === node.id;
    const hasChildren = node.children.length > 0;

    return (
        <div>
            <div
                className={cn(
                    "group flex items-center gap-1 rounded-lg px-1 py-1 transition-colors",
                    isSelected ? "bg-primary/10" : "hover:bg-muted"
                )}
                style={{ paddingLeft: `${depth * 12 + 4}px` }}
            >
                <button
                    onClick={() => setOpen((o) => !o)}
                    className="h-5 w-5 flex items-center justify-center shrink-0"
                >
                    {hasChildren ? (
                        <ChevronRight
                            className={cn("h-3 w-3 transition-transform", open && "rotate-90")}
                        />
                    ) : null}
                </button>
                <button
                    onClick={() => onSelect(node.id)}
                    className={cn(
                        "flex items-center gap-2 flex-1 text-left text-sm py-1 px-1 rounded",
                        isSelected ? "text-primary font-medium" : ""
                    )}
                >
                    {open && hasChildren ? (
                        <FolderOpen className="h-4 w-4 text-amber-600 shrink-0" />
                    ) : (
                        <FolderClosed className="h-4 w-4 text-amber-600 shrink-0" />
                    )}
                    <span className="truncate">{node.name}</span>
                    {node.document_count > 0 && (
                        <span className="ml-auto text-xs text-muted-foreground">
                            {node.document_count}
                        </span>
                    )}
                </button>
                <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => onAddChild(node.id)}
                    >
                        <FolderPlus className="h-3 w-3" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => onDelete(node)}
                    >
                        <Trash2 className="h-3 w-3" />
                    </Button>
                </div>
            </div>
            {open && hasChildren && (
                <div>
                    {node.children.map((child) => (
                        <FolderNode
                            key={child.id}
                            node={child}
                            selectedId={selectedId}
                            onSelect={onSelect}
                            onAddChild={onAddChild}
                            onDelete={onDelete}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
