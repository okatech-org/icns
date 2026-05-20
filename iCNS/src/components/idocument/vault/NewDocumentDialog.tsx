// Dialog d'import d'un document dans le coffre iDocument.
//
// Champs : titre, classification (DR/CD/SD/TSD), dossier cible, tags
// + zone d'upload (UploadZone réutilisée — bypassée vers blob URL en
// mode démo via uploadService).
//
// À la validation : crée un `VaultDocument` dans le store, lié au dossier
// sélectionné, owned par le persona courant. Visibility hérite du dossier
// si le dossier est partagé (`service`/`shared`/`cns_wide`), sinon privé.

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { UploadZone } from "@/components/shared/UploadZone";
import type { Classification, Persona } from "@/data/icns-personas";
import type { IDocUploadResult } from "@/types/idocument";
import { useIDocVaultStore } from "@/stores/iDocVaultStore";

const CLASSIFICATIONS: Array<{ value: Classification; label: string }> = [
    { value: "DR", label: "DR — Diffusion Restreinte" },
    { value: "CD", label: "CD — Confidentiel Défense" },
    { value: "SD", label: "SD — Secret Défense" },
    { value: "TSD", label: "TSD — Très Secret Défense" },
];

const CLASSIFICATION_RANK: Record<Classification, number> = {
    DR: 1,
    CD: 2,
    SD: 3,
    TSD: 4,
};

const schema = z.object({
    title: z.string().min(2, "Au moins 2 caractères").max(120),
    classification: z.enum(["DR", "CD", "SD", "TSD"]),
    folderId: z.string().min(1, "Choisir un dossier de destination"),
    tagsCsv: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface NewDocumentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    persona: Persona;
    /** Dossier pré-sélectionné (le contexte de la grille). */
    defaultFolderId?: string | null;
}

export function NewDocumentDialog({
    open,
    onOpenChange,
    persona,
    defaultFolderId,
}: NewDocumentDialogProps) {
    const folders = useIDocVaultStore((s) => s.folders);
    const createDocument = useIDocVaultStore((s) => s.createDocument);
    const [uploadResult, setUploadResult] = useState<IDocUploadResult | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Dossiers où on peut déposer : non-système, accessibles avec la
    // classification choisie. On limite aux dossiers où le persona a le
    // droit d'écriture (owner OU canShare).
    const writableFolders = useMemo(() => {
        return folders
            .filter((f) => f.status !== "trashed")
            .filter((f) => !f.isSystem || f.id === "sys-mes-documents" || f.id === "sys-brouillons")
            .filter((f) => CLASSIFICATION_RANK[persona.classificationMax] >= CLASSIFICATION_RANK[f.classification]);
    }, [folders, persona.classificationMax]);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            title: "",
            classification: "DR",
            folderId: defaultFolderId ?? "sys-brouillons",
            tagsCsv: "",
        },
    });

    const classification = watch("classification");
    const folderId = watch("folderId");

    const onSubmit = (values: FormValues) => {
        if (!uploadResult) {
            toast.error("Veuillez d'abord téléverser un fichier.");
            return;
        }
        const targetFolder = folders.find((f) => f.id === values.folderId);
        if (!targetFolder) {
            toast.error("Dossier introuvable.");
            return;
        }
        if (
            CLASSIFICATION_RANK[values.classification] >
            CLASSIFICATION_RANK[persona.classificationMax]
        ) {
            toast.error(
                `Votre habilitation (${persona.classificationMax}) ne permet pas une classification ${values.classification}.`,
            );
            return;
        }

        setSubmitting(true);
        try {
            const tags = (values.tagsCsv ?? "")
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean);

            const doc = createDocument({
                title: values.title,
                folderId: targetFolder.id,
                ownerMatricule: persona.matricule,
                classification: values.classification,
                // Hérite de la visibilité du dossier pour rester cohérent
                // avec le besoin-d'en-connaître du contenant.
                visibility: targetFolder.visibility,
                tags,
                source: "upload",
                size: uploadResult.file_size,
                mimeType: uploadResult.mime_type,
                fileUrl: uploadResult.file_url,
                storagePath: uploadResult.storage_path,
            });
            toast.success(`Document « ${doc.title} » importé dans ${targetFolder.name}.`);
            reset();
            setUploadResult(null);
            onOpenChange(false);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Nouveau document</DialogTitle>
                    <DialogDescription>
                        Importez un fichier dans un dossier du coffre. La classification
                        et la visibilité sont héritées du dossier choisi.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="doc-title">Titre du document</Label>
                        <Input id="doc-title" autoFocus {...register("title")} />
                        {errors.title && (
                            <p className="text-xs text-destructive">{errors.title.message}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="doc-classification">Classification</Label>
                            <Select
                                value={classification}
                                onValueChange={(v) => setValue("classification", v as Classification, { shouldValidate: true })}
                            >
                                <SelectTrigger id="doc-classification">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {CLASSIFICATIONS.map((c) => {
                                        const disabled = CLASSIFICATION_RANK[c.value] > CLASSIFICATION_RANK[persona.classificationMax];
                                        return (
                                            <SelectItem key={c.value} value={c.value} disabled={disabled}>
                                                {c.label}
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="doc-folder">Dossier de destination</Label>
                            <Select
                                value={folderId}
                                onValueChange={(v) => setValue("folderId", v, { shouldValidate: true })}
                            >
                                <SelectTrigger id="doc-folder">
                                    <SelectValue placeholder="Choisir un dossier" />
                                </SelectTrigger>
                                <SelectContent>
                                    {writableFolders.map((f) => (
                                        <SelectItem key={f.id} value={f.id}>
                                            {f.name} {f.classification !== "DR" && `· ${f.classification}`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.folderId && (
                                <p className="text-xs text-destructive">{errors.folderId.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="doc-tags">Tags (séparés par des virgules)</Label>
                        <Input
                            id="doc-tags"
                            placeholder="ex. note, urgent, frontière"
                            {...register("tagsCsv")}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label>Fichier à importer</Label>
                        <UploadZone
                            bucket="idoc-files"
                            onUploadComplete={setUploadResult}
                            label="Glissez un fichier ou cliquez pour parcourir"
                            sublabel="PDF, Word, Excel, image — 50 Mo maximum"
                        />
                    </div>

                    {!uploadResult && (
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <FileText className="h-3 w-3" />
                            Le hash SHA-256 sera calculé localement pour preuve d'intégrité.
                        </p>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Annuler
                        </Button>
                        <Button type="submit" disabled={submitting || !uploadResult}>
                            {submitting ? "Import…" : "Importer le document"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
