// Sheet de détail d'une réunion iAsted.

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import {
    Loader2,
    Save,
    XCircle,
    PlayCircle,
    CheckCircle2,
    Users,
    Clock,
    MapPin,
    Shield,
} from "lucide-react";

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
    useReunion,
    useUpdateCompteRendu,
    useUpdateReunionStatut,
    useAnnulerReunion,
    REUNION_STATUT_LABELS,
    CLASSIFICATION_LABELS,
} from "@/hooks/useIAsted";
import type { Id } from "@convex/_generated/dataModel";
import type { ReunionStatut } from "@/types/iasted";

interface IReunionDetailSheetProps {
    reunionId: Id<"iasted_reunions"> | null;
    onOpenChange: (open: boolean) => void;
}

export function IReunionDetailSheet({ reunionId, onOpenChange }: IReunionDetailSheetProps) {
    const reunion = useReunion(reunionId);
    const updateCompteRendu = useUpdateCompteRendu();
    const updateStatut = useUpdateReunionStatut();
    const annulerReunion = useAnnulerReunion();
    const [compteRendu, setCompteRendu] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (reunion?.compteRenduChiffre !== undefined) {
            setCompteRendu(reunion.compteRenduChiffre ?? "");
        }
    }, [reunion]);

    async function handleSaveCR() {
        if (!reunionId) return;
        try {
            setSaving(true);
            await updateCompteRendu({ reunionId, compteRenduChiffre: compteRendu });
            toast.success("Compte rendu enregistré");
        } catch (err) {
            toast.error("Erreur d'enregistrement", {
                description: err instanceof Error ? err.message : String(err),
            });
        } finally {
            setSaving(false);
        }
    }

    async function handleStatutChange(statut: ReunionStatut) {
        if (!reunionId) return;
        try {
            if (statut === "annulee") {
                await annulerReunion({ reunionId });
            } else {
                await updateStatut({ reunionId, statut });
            }
            toast.success(`Statut → ${REUNION_STATUT_LABELS[statut]}`);
        } catch (err) {
            toast.error("Erreur", {
                description: err instanceof Error ? err.message : String(err),
            });
        }
    }

    return (
        <Sheet open={reunionId !== null} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-lg w-full overflow-y-auto">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        {reunion?.titre ?? "Réunion"}
                    </SheetTitle>
                    {reunion?.reference && (
                        <SheetDescription className="font-mono">
                            {reunion.reference}
                        </SheetDescription>
                    )}
                </SheetHeader>

                {!reunion ? (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                ) : (
                    <div className="space-y-5 py-4">
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="outline">{REUNION_STATUT_LABELS[reunion.statut]}</Badge>
                            <Badge variant="secondary" className="gap-1">
                                <Shield className="h-3 w-3" />
                                {reunion.classification} — {CLASSIFICATION_LABELS[reunion.classification]}
                            </Badge>
                        </div>

                        {reunion.description && (
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">Description</p>
                                <p className="text-sm whitespace-pre-wrap">{reunion.description}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-3 text-sm">
                            <DetailRow
                                icon={<Clock className="h-4 w-4" />}
                                label="Début"
                                value={format(reunion.startsAt, "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}
                            />
                            <DetailRow
                                icon={<Clock className="h-4 w-4" />}
                                label="Fin"
                                value={format(reunion.endsAt, "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}
                            />
                            {reunion.lieu && (
                                <DetailRow
                                    icon={<MapPin className="h-4 w-4" />}
                                    label="Lieu"
                                    value={reunion.lieu}
                                />
                            )}
                            <DetailRow
                                icon={<Users className="h-4 w-4" />}
                                label="Organisateur"
                                value={
                                    <span className="font-mono text-xs">
                                        {reunion.organisateurMatricule}
                                    </span>
                                }
                            />
                            <DetailRow
                                icon={<Users className="h-4 w-4" />}
                                label={`Participants (${reunion.participantsMatricules.length})`}
                                value={
                                    <div className="flex flex-wrap gap-1">
                                        {reunion.participantsMatricules.map((m) => (
                                            <Badge key={m} variant="outline" className="font-mono text-xs">
                                                {m}
                                            </Badge>
                                        ))}
                                    </div>
                                }
                            />
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <p className="text-sm font-medium">Compte rendu</p>
                            <p className="text-xs text-muted-foreground">
                                Saisir manuellement après la réunion. Sera chiffré côté application
                                en Phase 2 (HSM).
                            </p>
                            <Textarea
                                value={compteRendu}
                                onChange={(e) => setCompteRendu(e.target.value)}
                                rows={8}
                                placeholder="Décisions prises, points abordés, suites…"
                            />
                            <Button size="sm" onClick={handleSaveCR} disabled={saving}>
                                {saving ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4 mr-2" />
                                )}
                                Enregistrer le compte rendu
                            </Button>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <p className="text-sm font-medium">Changer le statut</p>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleStatutChange("en_cours")}
                                    disabled={reunion.statut !== "planifiee"}
                                >
                                    <PlayCircle className="h-4 w-4 mr-2" />
                                    Démarrer
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleStatutChange("terminee")}
                                    disabled={reunion.statut === "terminee" || reunion.statut === "annulee"}
                                >
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Terminer
                                </Button>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleStatutChange("annulee")}
                                    disabled={reunion.statut === "annulee" || reunion.statut === "terminee"}
                                >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Annuler
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                <SheetFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Fermer
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}

function DetailRow({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: React.ReactNode;
}) {
    return (
        <div className="flex items-start gap-2">
            <div className="text-muted-foreground pt-0.5 shrink-0">{icon}</div>
            <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">{label}</p>
                <div className="text-sm break-words">{value}</div>
            </div>
        </div>
    );
}

export default IReunionDetailSheet;
