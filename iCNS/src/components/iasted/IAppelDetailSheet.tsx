// Sheet de détail d'un appel iAsted — affichage + édition des notes post-appel.

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { Loader2, Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, Save, Trash2 } from "lucide-react";

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

import {
    useAppel,
    useAjouterNotesAppel,
    useSupprimerAppel,
    formatAppelDuration,
    APPEL_STATUT_LABELS,
    APPEL_DIRECTION_LABELS,
} from "@/hooks/useIAsted";
import type { Id } from "@convex/_generated/dataModel";

interface IAppelDetailSheetProps {
    appelId: Id<"iasted_appels"> | null;
    onOpenChange: (open: boolean) => void;
}

export function IAppelDetailSheet({ appelId, onOpenChange }: IAppelDetailSheetProps) {
    const appel = useAppel(appelId);
    const ajouterNotes = useAjouterNotesAppel();
    const supprimerAppel = useSupprimerAppel();
    const [notes, setNotes] = useState("");
    const [savingNotes, setSavingNotes] = useState(false);

    useEffect(() => {
        if (appel?.notesPostAppel !== undefined) {
            setNotes(appel.notesPostAppel ?? "");
        }
    }, [appel]);

    async function handleSaveNotes() {
        if (!appelId) return;
        try {
            setSavingNotes(true);
            await ajouterNotes({ appelId, notesPostAppel: notes });
            toast.success("Notes enregistrées");
        } catch (err) {
            toast.error("Erreur d'enregistrement", {
                description: err instanceof Error ? err.message : String(err),
            });
        } finally {
            setSavingNotes(false);
        }
    }

    async function handleDelete() {
        if (!appelId) return;
        try {
            await supprimerAppel({ appelId });
            toast.success("Appel supprimé");
            onOpenChange(false);
        } catch (err) {
            toast.error("Erreur de suppression", {
                description: err instanceof Error ? err.message : String(err),
            });
        }
    }

    const directionIcon = appel?.statut === "manque" ? (
        <PhoneMissed className="h-5 w-5 text-red-600" />
    ) : appel?.direction === "entrant" ? (
        <PhoneIncoming className="h-5 w-5 text-blue-600" />
    ) : (
        <PhoneOutgoing className="h-5 w-5 text-green-600" />
    );

    return (
        <Sheet open={appelId !== null} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-md">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        {directionIcon}
                        Détail de l'appel
                    </SheetTitle>
                    <SheetDescription>
                        {appel?.sujet ?? "Aucun sujet renseigné"}
                    </SheetDescription>
                </SheetHeader>

                {!appel ? (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                ) : (
                    <div className="space-y-5 py-4">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <p className="text-xs text-muted-foreground">Direction</p>
                                <p className="font-medium">{APPEL_DIRECTION_LABELS[appel.direction]}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Statut</p>
                                <Badge variant="secondary">{APPEL_STATUT_LABELS[appel.statut]}</Badge>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Initiateur</p>
                                <p className="font-mono text-xs">{appel.initiateurMatricule}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Destinataire</p>
                                <p className="font-mono text-xs">{appel.destinataireMatricule}</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-xs text-muted-foreground">Début</p>
                                <p>{format(appel.startedAt, "dd MMM yyyy HH:mm:ss", { locale: fr })}</p>
                            </div>
                            {appel.endedAt && (
                                <div className="col-span-2">
                                    <p className="text-xs text-muted-foreground">Fin</p>
                                    <p>{format(appel.endedAt, "dd MMM yyyy HH:mm:ss", { locale: fr })}</p>
                                </div>
                            )}
                            {appel.dureeSecondes !== undefined && (
                                <div className="col-span-2">
                                    <p className="text-xs text-muted-foreground">Durée</p>
                                    <p className="font-mono">{formatAppelDuration(appel.dureeSecondes)}</p>
                                </div>
                            )}
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <p className="text-sm font-medium flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                Notes post-appel
                            </p>
                            <Textarea
                                placeholder="Compte-rendu, points abordés, suites à donner…"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={6}
                            />
                        </div>
                    </div>
                )}

                <SheetFooter className="flex-row justify-between">
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDelete}
                        disabled={!appel}
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                    </Button>
                    <Button onClick={handleSaveNotes} disabled={!appel || savingNotes}>
                        {savingNotes ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4 mr-2" />
                        )}
                        Enregistrer les notes
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}

export default IAppelDetailSheet;
