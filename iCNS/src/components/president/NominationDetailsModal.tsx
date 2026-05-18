import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User, Briefcase, GraduationCap, Calendar, CheckCircle, XCircle, FileText } from "lucide-react";

interface NominationDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    nominationId: string | null;
    onDecided?: () => void;
}

export function NominationDetailsModal({ isOpen, onClose, nominationId, onDecided }: NominationDetailsModalProps) {
    const { toast } = useToast();
    const [nomination, setNomination] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [notes, setNotes] = useState("");

    useEffect(() => {
        if (isOpen && nominationId) {
            loadNomination();
        } else {
            setNomination(null);
            setNotes("");
        }
    }, [isOpen, nominationId]);

    const loadNomination = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("nominations")
                .select("*")
                .eq("id", nominationId)
                .single();

            if (error) throw error;
            setNomination(data);
        } catch (error: any) {
            console.error("Error loading nomination:", error);
            toast({
                title: "Erreur",
                description: "Impossible de charger la nomination",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDecision = async (status: 'approved' | 'rejected') => {
        if (!nominationId) return;

        setProcessing(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not authenticated");

            // Update nomination status
            const { error } = await supabase
                .from("nominations")
                .update({
                    status,
                    decided_at: new Date().toISOString(),
                    decided_by: user.id,
                    decision_notes: notes
                })
                .eq("id", nominationId);

            if (error) throw error;

            // If approved, we could automatically generate a decree draft here
            // For now, we just notify
            if (status === 'approved') {
                toast({
                    title: "Nomination approuvée",
                    description: "Le décret de nomination sera généré automatiquement",
                });
            } else {
                toast({
                    title: "Nomination rejetée",
                    description: "La proposition a été rejetée",
                });
            }

            if (onDecided) onDecided();
            onClose();
        } catch (error: any) {
            toast({
                title: "Erreur",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setProcessing(false);
        }
    };

    if (!nomination && !loading) return null;

    const candidateInfo = nomination?.candidate_info || {};

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-xl">Détails de la Nomination</DialogTitle>
                            <DialogDescription>
                                Proposition de nomination pour validation
                            </DialogDescription>
                        </div>
                        <Badge variant={
                            nomination?.status === 'approved' ? 'default' :
                                nomination?.status === 'pending' ? 'secondary' :
                                    'destructive'
                        }>
                            {nomination?.status === 'approved' ? 'Approuvé' :
                                nomination?.status === 'pending' ? 'En attente' :
                                    nomination?.status === 'rejected' ? 'Rejeté' :
                                        nomination?.status}
                        </Badge>
                    </div>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Header Info */}
                    <div className="bg-muted/30 p-4 rounded-lg border grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-sm text-muted-foreground mb-1">Poste</div>
                            <div className="font-semibold">{nomination?.poste}</div>
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground mb-1">Ministère / Institution</div>
                            <div className="font-semibold">{nomination?.ministere}</div>
                        </div>
                    </div>

                    {/* Candidate Profile */}
                    <div>
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <User className="w-5 h-5" />
                            Profil du Candidat
                        </h3>
                        <div className="bg-card border rounded-lg p-4 space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center text-2xl font-bold text-muted-foreground">
                                    {nomination?.candidate_name?.charAt(0)}
                                </div>
                                <div>
                                    <div className="text-xl font-bold">{nomination?.candidate_name}</div>
                                    <div className="text-muted-foreground">{candidateInfo.age ? `${candidateInfo.age} ans` : 'Âge non spécifié'}</div>
                                </div>
                            </div>

                            <div className="grid gap-3">
                                <div className="flex gap-3">
                                    <GraduationCap className="w-5 h-5 text-muted-foreground shrink-0" />
                                    <div>
                                        <div className="font-medium">Qualifications</div>
                                        <div className="text-sm text-muted-foreground">
                                            {Array.isArray(candidateInfo.qualifications)
                                                ? candidateInfo.qualifications.join(", ")
                                                : candidateInfo.qualifications || "Non spécifié"}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Briefcase className="w-5 h-5 text-muted-foreground shrink-0" />
                                    <div>
                                        <div className="font-medium">Expérience</div>
                                        <div className="text-sm text-muted-foreground">
                                            {candidateInfo.experience || "Non spécifié"}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Decision Section */}
                    {nomination?.status === 'pending' && (
                        <div className="space-y-4 pt-4 border-t">
                            <h3 className="font-semibold">Note de décision</h3>
                            <Textarea
                                placeholder="Ajouter une note ou un commentaire pour la décision..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="min-h-[100px]"
                            />
                        </div>
                    )}

                    {nomination?.decision_notes && (
                        <div className="bg-muted p-4 rounded-lg">
                            <div className="text-sm font-semibold mb-1">Note de décision</div>
                            <p className="text-sm text-muted-foreground">{nomination.decision_notes}</p>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={onClose}>
                        Fermer
                    </Button>

                    {nomination?.status === 'pending' && (
                        <div className="flex gap-2 w-full sm:w-auto">
                            <Button
                                variant="destructive"
                                onClick={() => handleDecision('rejected')}
                                disabled={processing}
                                className="flex-1 sm:flex-none"
                            >
                                <XCircle className="w-4 h-4 mr-2" />
                                Rejeter
                            </Button>
                            <Button
                                onClick={() => handleDecision('approved')}
                                disabled={processing}
                                className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700"
                            >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approuver
                            </Button>
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
