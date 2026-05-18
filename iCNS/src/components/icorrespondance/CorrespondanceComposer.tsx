// Compositeur de correspondance officielle

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { UploadZone } from "@/components/shared/UploadZone";
import { useCreateICorrFolder, useAttachICorrDocument } from "@/hooks/useICorrespondance";
import { CORRESPONDENCE_TYPES } from "@/types/icorrespondance";
import { toast } from "sonner";

interface CorrespondanceComposerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CorrespondanceComposer({ open, onOpenChange }: CorrespondanceComposerProps) {
    const [name, setName] = useState("");
    const [correspondenceType, setCorrespondenceType] = useState("lettre");
    const [recipientName, setRecipientName] = useState("");
    const [recipientOrg, setRecipientOrg] = useState("");
    const [recipientEmail, setRecipientEmail] = useState("");
    const [comment, setComment] = useState("");
    const [isUrgent, setIsUrgent] = useState(false);
    const [requiresApproval, setRequiresApproval] = useState(true);
    const [pendingFile, setPendingFile] = useState<{
        storage_path: string;
        file_url: string;
        file_name: string;
        file_size: number;
        mime_type: string;
        content_hash: string;
    } | null>(null);

    const createFolder = useCreateICorrFolder();
    const attachDocument = useAttachICorrDocument();

    const reset = () => {
        setName("");
        setCorrespondenceType("lettre");
        setRecipientName("");
        setRecipientOrg("");
        setRecipientEmail("");
        setComment("");
        setIsUrgent(false);
        setRequiresApproval(true);
        setPendingFile(null);
    };

    const handleClose = (next: boolean) => {
        if (!next) reset();
        onOpenChange(next);
    };

    const handleSubmit = async () => {
        if (!name.trim()) {
            toast.error("Veuillez saisir un objet");
            return;
        }
        try {
            const folder = await createFolder.mutateAsync({
                name: name.trim(),
                correspondence_type: correspondenceType,
                recipient_name: recipientName.trim() || undefined,
                recipient_organization: recipientOrg.trim() || undefined,
                recipient_email: recipientEmail.trim() || undefined,
                comment: comment.trim() || undefined,
                is_urgent: isUrgent,
                requires_approval: requiresApproval,
            });

            if (pendingFile) {
                await attachDocument.mutateAsync({
                    folder_id: folder.id,
                    name: pendingFile.file_name,
                    storage_path: pendingFile.storage_path,
                    file_url: pendingFile.file_url,
                    file_size: pendingFile.file_size,
                    mime_type: pendingFile.mime_type,
                    content_hash: pendingFile.content_hash,
                });
            }

            toast.success(`Dossier ${folder.reference_number} cree`);
            handleClose(false);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Echec creation");
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Nouvelle correspondance</DialogTitle>
                    <DialogDescription>
                        Creez un dossier de correspondance officielle. Une reference unique sera attribuee.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="grid gap-2">
                        <Label htmlFor="corr-name">Objet *</Label>
                        <Input
                            id="corr-name"
                            placeholder="Ex. Reponse a la note du Premier Ministre"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Type de correspondance</Label>
                        <Select value={correspondenceType} onValueChange={setCorrespondenceType}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {CORRESPONDENCE_TYPES.map((t) => (
                                    <SelectItem key={t.code} value={t.code}>
                                        {t.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="rec-name">Destinataire</Label>
                            <Input
                                id="rec-name"
                                placeholder="Nom"
                                value={recipientName}
                                onChange={(e) => setRecipientName(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="rec-org">Organisation</Label>
                            <Input
                                id="rec-org"
                                placeholder="Ministere, institution..."
                                value={recipientOrg}
                                onChange={(e) => setRecipientOrg(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="rec-email">Email du destinataire (pour envoi externe)</Label>
                        <Input
                            id="rec-email"
                            type="email"
                            placeholder="exemple@domaine.ga"
                            value={recipientEmail}
                            onChange={(e) => setRecipientEmail(e.target.value)}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="corr-comment">Contenu / commentaire</Label>
                        <Textarea
                            id="corr-comment"
                            rows={4}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Texte du courrier ou note d accompagnement..."
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Piece jointe (facultatif)</Label>
                        <UploadZone
                            bucket="icorr-files"
                            onUploadComplete={setPendingFile}
                            label="Glissez la piece jointe ou cliquez"
                            sublabel="PDF, Word, Excel, image — 50 Mo maximum"
                        />
                    </div>

                    <div className="flex items-center gap-6 pt-2">
                        <label className="flex items-center gap-2 text-sm">
                            <Checkbox
                                checked={isUrgent}
                                onCheckedChange={(c) => setIsUrgent(!!c)}
                            />
                            Urgent
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                            <Checkbox
                                checked={requiresApproval}
                                onCheckedChange={(c) => setRequiresApproval(!!c)}
                            />
                            Requiert approbation
                        </label>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => handleClose(false)}>
                        Annuler
                    </Button>
                    <Button onClick={handleSubmit} disabled={!name.trim() || createFolder.isPending}>
                        {createFolder.isPending ? "Creation..." : "Creer le dossier"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
