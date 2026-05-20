// Types iAgenda (côté frontend) — mirroir de agenda_evenements + vue agrégée.

import type { Id } from "@convex/_generated/dataModel";
import type { Classification } from "./iasted";

export type AgendaEventType =
    | "seance_cns"
    | "audience"
    | "conseil_securite"
    | "ceremonie"
    | "autre";

export type AgendaEventStatut = "planifie" | "confirme" | "annule";

export type AgendaSource = "evenement" | "reunion" | "dossier_flash";

export interface AgendaEvenement {
    _id: Id<"agenda_evenements">;
    reference: string;
    type: AgendaEventType;
    titre: string;
    description?: string;
    startsAt: number;
    endsAt?: number;
    lieu?: string;
    organisateurMatricule: string;
    participantsMatricules?: string[];
    servicesInvites?: string[];
    classification: Classification;
    statut: AgendaEventStatut;
    reunionId?: Id<"iasted_reunions">;
    dossierId?: Id<"dossiers_renseignement">;
    createdAt: number;
    updatedAt: number;
}

export interface AggregatedAgendaItem {
    _id: string;
    source: AgendaSource;
    titre: string;
    startsAt: number;
    endsAt?: number;
    type?: AgendaEventType | string;
    lieu?: string;
    classification?: Classification | string;
    statut?: string;
    reference?: string;
}

export interface CreateAgendaEventInput {
    type: AgendaEventType;
    titre: string;
    description?: string;
    startsAt: number;
    endsAt?: number;
    lieu?: string;
    organisateurMatricule: string;
    participantsMatricules?: string[];
    classification: Classification;
}

// Métadonnées d'affichage par type d'événement
export const AGENDA_TYPE_LABELS: Record<AgendaEventType, string> = {
    seance_cns: "Séance CNS",
    audience: "Audience",
    conseil_securite: "Conseil de Sécurité",
    ceremonie: "Cérémonie",
    autre: "Autre",
};

export const AGENDA_TYPE_COLORS: Record<AgendaEventType, string> = {
    seance_cns: "bg-red-500/10 text-red-700 border-red-500/30",
    audience: "bg-blue-500/10 text-blue-700 border-blue-500/30",
    conseil_securite: "bg-amber-500/10 text-amber-700 border-amber-500/30",
    ceremonie: "bg-purple-500/10 text-purple-700 border-purple-500/30",
    autre: "bg-gray-500/10 text-gray-700 border-gray-500/30",
};
