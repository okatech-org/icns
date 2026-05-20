// Hooks Convex-react pour iAgenda.

import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useCurrentMatricule } from "@/hooks/useIAsted";
import type { AgendaEventType } from "@/types/iagenda";
import type { Id } from "@convex/_generated/dataModel";

/** Liste les événements officiels dans une fenêtre temporelle. */
export function useEvenementsInRange(
    fromMs: number,
    toMs: number,
    typeFilter?: AgendaEventType,
) {
    return useQuery(api.agenda.evenements.listEvenementsInRange, {
        fromMs,
        toMs,
        typeFilter,
    });
}

/** Liste les événements à venir (par défaut 30 jours). */
export function useUpcomingEvenements(daysAhead?: number, scopedToMe = true) {
    const matricule = useCurrentMatricule();
    return useQuery(api.agenda.evenements.listUpcoming, {
        daysAhead,
        matriculeFilter: scopedToMe ? matricule ?? undefined : undefined,
    });
}

/** Vue agrégée (événements + réunions + dossiers flash) pour iAgenda. */
export function useAgendaAggregated(fromMs: number, toMs: number) {
    const matricule = useCurrentMatricule();
    return useQuery(
        api.agenda.evenements.listAgendaAggregated,
        matricule ? { matricule, fromMs, toMs } : "skip",
    );
}

/** Récupère un événement par ID. */
export function useEvenement(evenementId: Id<"agenda_evenements"> | null) {
    return useQuery(
        api.agenda.evenements.getEvenement,
        evenementId ? { evenementId } : "skip",
    );
}

export function useCreateEvenement() {
    return useMutation(api.agenda.evenements.createEvenement);
}

export function useUpdateEvenementStatut() {
    return useMutation(api.agenda.evenements.updateStatut);
}

export function useUpdateEvenement() {
    return useMutation(api.agenda.evenements.updateEvenement);
}

export function useDeleteEvenement() {
    return useMutation(api.agenda.evenements.deleteEvenement);
}
