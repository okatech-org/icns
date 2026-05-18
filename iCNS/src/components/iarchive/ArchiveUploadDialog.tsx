// Dialogue de creation d archive (upload direct)

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadZone } from "@/components/shared/UploadZone";
import { useArchiveCategories, useCreateArchive, useGenerateCertificate } from "@/hooks/useIArchive";
import type { IDocUploadResult } from "@/types/idocument";
import { toast } from "sonner";

interface ArchiveUploadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultCategoryId?: string;
}

export function ArchiveUploadDialog({ open, onOpenChange, defaultCategoryId }: ArchiveUploadDialogProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [categoryId, setCategoryId] = useState<string | null>(defaultCategoryId ?? null);
    const [originalDate, setOriginalDate] = useState("");
    const [uploaded, setUploaded] = useState<IDocUploadResult | null>(null);

    const { data: categories } = useArchiveCategories();
    const createArchive = useCreateArchive();
    const generateCert = useGenerateCertificate();

    const reset = () => {
        setTitle("");
        setDescription("");
        setCategoryId(defaultCategoryId ?? null);
        setOriginalDate("");
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
        if (!title.trim() || !categoryId) {
            toast.error("Titre et categorie requis");
            return;
        }
        try {
            const archive = await createArchive.mutateAsync({
                title: title.trim(),
                description: description.trim() || undefined,
                category_id: categoryId,
                source_type: "manual_upload",
                storage_path: uploaded.storage_path,
                file_url: uploaded.file_url,
                file_name: uploaded.file_name,
                file_size: uploaded.file_size,
                mime_type: uploaded.mime_type,
                sha256_hash: uploaded.content_hash,
                original_creation_date: originalDate || undefined,
            });
            // Genere automatiquement un certificat
            try {
                await generateCert.mutateAsync({
                    archiveId: archive.id,
                    sha256Hash: uploaded.content_hash,
                });
                toast.success("Archive creee avec certificat");
            } catch (certErr) {
                toast.warning("Archive creee, certificat differe");
                console.warn(certErr);
            }
            handleClose(false);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Echec creation archive");
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Archiver un document</DialogTitle>
                    <DialogDescription>
                        Le fichier sera scelle (SHA-256) et un certificat d archivage sera emis automatiquement.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <UploadZone bucket="iarch-files" onUploadComplete={setUploaded} />

                    <div className="grid gap-2">
                        <Label htmlFor="iarch-title">Titre *</Label>
                        <Input
                            id="iarch-title"
                            placeholder="Ex. Rapport annuel 2025"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="iarch-desc">Description</Label>
                        <Textarea
                            id="iarch-desc"
                            rows={2}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Categorie *</Label>
                            <Select value={categoryId ?? ""} onValueChange={setCategoryId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selectionner" />
                                </SelectTrigger>
                                <SelectContent>
                                    {(categories ?? []).map((c) => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.name}
                                            {c.retention_years && (
                                                <span className="text-xs text-muted-foreground ml-2">
                                                    ({c.retention_years} ans)
                                                </span>
                                            )}
                                            {c.is_perpetual && (
                                                <span className="text-xs text-muted-foreground ml-2">
                                                    (perpetuel)
                                                </span>
                                            )}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label>Date de creation originale</Label>
                            <Input
                                type="date"
                                value={originalDate}
                                onChange={(e) => setOriginalDate(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => handleClose(false)}>
                        Annuler
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!uploaded || !title.trim() || !categoryId || createArchive.isPending}
                    >
                        {createArchive.isPending ? "Archivage..." : "Archiver"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
