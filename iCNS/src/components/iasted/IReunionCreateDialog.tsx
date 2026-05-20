// Dialog de création d'une réunion iAsted (RHF + Zod).

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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

import { useCreateReunion, useCurrentMatricule } from "@/hooks/useIAsted";
import type { Classification } from "@/types/iasted";

const FormSchema = z
    .object({
        titre: z.string().min(3, "Titre trop court"),
        description: z.string().optional(),
        startsAt: z.string().min(1, "Date de début requise"),
        endsAt: z.string().min(1, "Date de fin requise"),
        lieu: z.string().optional(),
        classification: z.enum(["DR", "CD", "SD", "TSD"]),
        participantsCsv: z
            .string()
            .min(0)
            .transform((v) => v.trim()),
    })
    .refine(
        (data) => new Date(data.endsAt) > new Date(data.startsAt),
        { message: "La fin doit être après le début", path: ["endsAt"] },
    );

type FormValues = z.input<typeof FormSchema>;

interface IReunionCreateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function IReunionCreateDialog({ open, onOpenChange }: IReunionCreateDialogProps) {
    const matricule = useCurrentMatricule();
    const createReunion = useCreateReunion();
    const [submitting, setSubmitting] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            titre: "",
            description: "",
            startsAt: "",
            endsAt: "",
            lieu: "",
            classification: "DR",
            participantsCsv: "",
        },
    });

    async function onSubmit(values: FormValues) {
        if (!matricule) {
            toast.error("Utilisateur non identifié");
            return;
        }
        try {
            setSubmitting(true);
            const participants = values.participantsCsv
                .split(",")
                .map((p) => p.trim())
                .filter(Boolean);

            await createReunion({
                titre: values.titre,
                description: values.description || undefined,
                organisateurMatricule: matricule,
                participantsMatricules: participants,
                startsAt: new Date(values.startsAt).getTime(),
                endsAt: new Date(values.endsAt).getTime(),
                lieu: values.lieu || undefined,
                classification: values.classification as Classification,
            });
            toast.success("Réunion créée");
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
                    <DialogTitle>Nouvelle réunion</DialogTitle>
                    <DialogDescription>
                        Planifier une réunion iAsted avec un ou plusieurs participants.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label>Titre</Label>
                        <Input
                            {...form.register("titre")}
                            placeholder="Ex. Brief sécurité opérationnelle"
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
                            placeholder="Ordre du jour, contexte…"
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
                            <Label>Fin</Label>
                            <Input type="datetime-local" {...form.register("endsAt")} />
                            {form.formState.errors.endsAt && (
                                <p className="text-xs text-red-500">
                                    {form.formState.errors.endsAt.message}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label>Lieu (optionnel)</Label>
                        <Input
                            {...form.register("lieu")}
                            placeholder="Salle CNS / URL visio"
                        />
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

                    <div className="space-y-1.5">
                        <Label>Participants (matricules séparés par virgule)</Label>
                        <Input
                            {...form.register("participantsCsv")}
                            placeholder="MAT001, MAT002, MAT003"
                        />
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
                            Créer la réunion
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default IReunionCreateDialog;
