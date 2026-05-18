// Dialogue d ajout de document : upload de fichier + metadonnees

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadZone } from "@/components/shared/UploadZone";
import { useIDocDocumentTypes, useIDocFolders, useCreateIDocDocument } from "@/hooks/useIDocument";
import type { IDocUploadResult } from "@/types/idocument";
import { toast } from "sonner";

interface DocumentUploadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultFolderId?: string | null;
}

export function DocumentUploadDialog({ open, onOpenChange, defaultFolderId = null }: DocumentUploadDialogProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [folderId, setFolderId] = useState<string | null>(defaultFolderId);
    const [typeId, setTypeId] = useState<string | null>(null);
    const [tags, setTags] = useState("");
    const [uploaded, setUploaded] = useState<IDocUploadResult | null>(null);

    const { data: types } = useIDocDocumentTypes();
    const { data: folders } = useIDocFolders();
    const createDocument = useCreateIDocDocument();

    const reset = () => {
        setTitle("");
        setDescription("");
        setFolderId(defaultFolderId);
        setTypeId(null);
        setTags("");
        setUploaded(null);
    };

    const handleClose = (next: boolean) => {
        if (!next) reset();
        onOpenChange(next);
    };

    const handleSubmit = async () => {
        if (!uploaded) {
            toast.error("Veuillez televerser un fichier");
            return;
        }
        if (!title.trim()) {
            toast.error("Veuillez saisir un titre");
            return;
        }
        try {
            await createDocument.mutateAsync({
                title: title.trim(),
                description: description.trim() || undefined,
                folder_id: folderId,
                document_type_id: typeId,
                tags: tags
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                storage_path: uploaded.storage_path,
                file_url: uploaded.file_url,
                file_name: uploaded.file_name,
                file_size: uploaded.file_size,
                mime_type: uploaded.mime_type,
                content_hash: uploaded.content_hash,
                status: "draft",
            });
            toast.success("Document cree");
            handleClose(false);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Echec creation document");
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Ajouter un document</DialogTitle>
                    <DialogDescription>
                        Televersez un fichier puis renseignez les informations associees.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <UploadZone
                        bucket="idoc-files"
                        onUploadComplete={setUploaded}
                    />

                    <div className="grid gap-2">
                        <Label htmlFor="title">Titre *</Label>
                        <Input
                            id="title"
                            placeholder="Ex. Rapport mensuel decembre"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="desc">Description</Label>
                        <Textarea
                            id="desc"
                            rows={2}
                            placeholder="Resume, contexte..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Type</Label>
                            <Select value={typeId ?? "none"} onValueChange={(v) => setTypeId(v === "none" ? null : v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selectionner" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Sans type</SelectItem>
                                    {(types ?? []).map((t) => (
                                        <SelectItem key={t.id} value={t.id}>
                                            {t.nom}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label>Dossier</Label>
                            <Select value={folderId ?? "root"} onValueChange={(v) => setFolderId(v === "root" ? null : v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Racine" />
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

                    <div className="grid gap-2">
                        <Label htmlFor="tags">Etiquettes (separees par des virgules)</Label>
                        <Input
                            id="tags"
                            placeholder="Ex. urgent, finance, 2026"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => handleClose(false)}>
                        Annuler
                    </Button>
                    <Button onClick={handleSubmit} disabled={!uploaded || !title.trim() || createDocument.isPending}>
                        {createDocument.isPending ? "Enregistrement..." : "Enregistrer"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
