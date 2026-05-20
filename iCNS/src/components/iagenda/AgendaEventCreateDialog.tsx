// Dialog de création d'un événement iAgenda (RHF + Zod).

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useCreateEvenement } from "@/hooks/useIAgenda";
import { useCurrentMatricule } from "@/hooks/useIAsted";
import { AGENDA_TYPE_LABELS, type AgendaEventType } from "@/types/iagenda";
import type { Classification } from "@/types/iasted";

const FormSchema = z.object({
    type: z.enum(["seance_cns", "audience", "conseil_securite", "ceremonie", "autre"]),
    titre: z.string().min(3, "Titre trop court"),
    description: z.string().optional(),
    startsAt: z.string().min(1, "Date de début requise"),
    endsAt: z.string().optional(),
    lieu: z.string().optional(),
    classification: z.enum(["DR", "CD", "SD", "TSD"]),
});

type FormValues = z.infer<typeof FormSchema>;

interface AgendaEventCreateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AgendaEventCreateDialog({ open, onOpenChange }: AgendaEventCreateDialogProps) {
    const matricule = useCurrentMatricule();
    const createEvenement = useCreateEvenement();
    const [submitting, setSubmitting] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            type: "audience",
            titre: "",
            description: "",
            startsAt: "",
            endsAt: "",
            lieu: "",
            classification: "DR",
        },
    });

    async function onSubmit(values: FormValues) {
        if (!matricule) {
            toast.error("Utilisateur non identifié.");
            return;
        }
        try {
            setSubmitting(true);
            await createEvenement({
                type: values.type as AgendaEventType,
                titre: values.titre,
                description: values.description || undefined,
                startsAt: new Date(values.startsAt).getTime(),
                endsAt: values.endsAt ? new Date(values.endsAt).getTime() : undefined,
                lieu: values.lieu || undefined,
                organisateurMatricule: matricule,
                classification: values.classification as Classification,
            });
            toast.success("Événement créé.");
            onOpenChange(false);
            form.reset();
        } catch (err) {
            toast.error("Erreur lors de la création", {
                description: err instanceof Error ? err.message : String(err),
            });
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Nouvel événement</DialogTitle>
                    <DialogDescription>
                        Planifier un événement officiel iCNS.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label>Type</Label>
                            <Select
                                value={form.watch("type")}
                                onValueChange={(v) => form.setValue("type", v as FormValues["type"])}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {(Object.keys(AGENDA_TYPE_LABELS) as AgendaEventType[]).map((t) => (
                                        <SelectItem key={t} value={t}>
                                            {AGENDA_TYPE_LABELS[t]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label>Classification</Label>
                            <Select
                                value={form.watch("classification")}
                                onValueChange={(v) =>
                                    form.setValue("classification", v as FormValues["classification"])
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="DR">DR — Diffusion Restreinte</SelectItem>
                                    <SelectItem value="CD">CD — Confidentiel Défense</SelectItem>
                                    <SelectItem value="SD">SD — Secret Défense</SelectItem>
                                    <SelectItem value="TSD">TSD — Très Secret Défense</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label>Titre</Label>
                        <Input
                            {...form.register("titre")}
                            placeholder="Ex. Audience SG-CNS / Procureur"
                        />
                        {form.formState.errors.titre && (
                            <p className="text-xs text-red-500">
                                {form.formState.errors.titre.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label>Description</Label>
                        <Textarea
                            {...form.register("description")}
                            placeholder="Contexte, ordre du jour…"
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label>Début</Label>
                            <Input type="datetime-local" {...form.register("startsAt")} />
                            {form.formState.errors.startsAt && (
                                <p className="text-xs text-red-500">
                                    {form.formState.errors.startsAt.message}
                                </p>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label>Fin (optionnel)</Label>
                            <Input type="datetime-local" {...form.register("endsAt")} />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label>Lieu (optionnel)</Label>
                        <Input {...form.register("lieu")} placeholder="Salle CNS / URL visio" />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={submitting}
                        >
                            Annuler
                        </Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Créer l'événement
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default AgendaEventCreateDialog;
