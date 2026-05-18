// Actions d approbation/rejet pour un dossier en attente

import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useApproveICorr, useRejectICorr } from "@/hooks/useICorrespondance";
import type { ICorrFolder } from "@/types/icorrespondance";
import { toast } from "sonner";

interface ApprovalActionsProps {
    folder: ICorrFolder;
    onActionComplete?: () => void;
}

export function ApprovalActions({ folder, onActionComplete }: ApprovalActionsProps) {
    const [approveOpen, setApproveOpen] = useState(false);
    const [rejectOpen, setRejectOpen] = useState(false);
    const [comment, setComment] = useState("");
    const [reason, setReason] = useState("");

    const approve = useApproveICorr();
    const reject = useRejectICorr();

    const handleApprove = async () => {
        try {
            await approve.mutateAsync({ id: folder.id, comment: comment.trim() || undefined });
            toast.success("Dossier approuve");
            setApproveOpen(false);
            setComment("");
            onActionComplete?.();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Echec");
        }
    };

    const handleReject = async () => {
        if (!reason.trim()) {
            toast.error("Motif de rejet obligatoire");
            return;
        }
        try {
            await reject.mutateAsync({ id: folder.id, reason: reason.trim() });
            toast.success("Dossier rejete");
            setRejectOpen(false);
            setReason("");
            onActionComplete?.();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Echec");
        }
    };

    if (folder.status !== "PENDING_APPROVAL") {
        return null;
    }

    return (
        <>
            <div className="flex gap-2">
                <Button onClick={() => setApproveOpen(true)} className="flex-1">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Approuver
                </Button>
                <Button variant="destructive" onClick={() => setRejectOpen(true)} className="flex-1">
                    <XCircle className="h-4 w-4 mr-2" />
                    Rejeter
                </Button>
            </div>

            <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Approuver le dossier</DialogTitle>
                        <DialogDescription>
                            Le dossier sera approuve et retourne a l auteur pour remise.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-2">
                        <Label htmlFor="approve-comment">Commentaire (facultatif)</Label>
                        <Textarea
                            id="approve-comment"
                            rows={3}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setApproveOpen(false)}>
                            Annuler
                        </Button>
                        <Button onClick={handleApprove} disabled={approve.isPending}>
                            {approve.isPending ? "Approbation..." : "Confirmer"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rejeter le dossier</DialogTitle>
                        <DialogDescription>
                            Le dossier sera retourne a l auteur avec votre motif.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-2">
                        <Label htmlFor="reject-reason">Motif du rejet *</Label>
                        <Textarea
                            id="reject-reason"
                            rows={3}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Explication necessaire pour la modification..."
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectOpen(false)}>
                            Annuler
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleReject}
                            disabled={!reason.trim() || reject.isPending}
                        >
                            {reject.isPending ? "Rejet..." : "Confirmer le rejet"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
