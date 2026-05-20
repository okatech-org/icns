// Types iAsted (côté frontend) — mirroir des tables Convex iasted_appels,
// iasted_contacts, iasted_reunions.

import type { Id } from "@convex/_generated/dataModel";

// ─── Classifications + rôles (importés depuis convex pour cohérence) ────
export type Classification = "DR" | "CD" | "SD" | "TSD";
export type RoleICNS =
    | "officier_traitant"
    | "chef_section"
    | "directeur_service"
    | "analyste_cns"
    | "sg_cns"
    | "auditeur"
    | "rssi"
    | "admin_technique";

// ─── Appels ────────────────────────────────────────────────────────────
export type AppelDirection = "entrant" | "sortant";
export type AppelStatut = "manque" | "repondu" | "en_cours" | "termine";

export interface Appel {
    _id: Id<"iasted_appels">;
    initiateurMatricule: string;
    destinataireMatricule: string;
    direction: AppelDirection;
    statut: AppelStatut;
    dureeSecondes?: number;
    startedAt: number;
    endedAt?: number;
    notesPostAppel?: string;
    sujet?: string;
}

export interface AppelsStats {
    total: number;
    sortants: number;
    entrants: number;
    manques: number;
    dureeTotaleSecondes: number;
}

export interface CreateAppelInput {
    initiateurMatricule: string;
    destinataireMatricule: string;
    direction: AppelDirection;
    statut: AppelStatut;
    sujet?: string;
}

// ─── Contacts ──────────────────────────────────────────────────────────
export interface AnnuaireEntry {
    _id: Id<"utilisateurs">;
    matricule: string;
    serviceId: Id<"services">;
    role: RoleICNS;
}

export interface FavoriContact {
    _id: Id<"iasted_contacts">;
    contactMatricule: string;
    favori: boolean;
    notes?: string;
    addedAt: number;
    serviceId?: Id<"services">;
    role?: RoleICNS;
}

export interface ContactDetail {
    matricule: string;
    serviceId: Id<"services">;
    role: RoleICNS;
    favori: boolean;
    notes?: string;
    contactId?: Id<"iasted_contacts">;
}

// ─── Réunions ─────────────────────────────────────────────────────────
export type ReunionStatut = "planifiee" | "en_cours" | "terminee" | "annulee";

export interface Reunion {
    _id: Id<"iasted_reunions">;
    reference: string;
    titre: string;
    description?: string;
    organisateurMatricule: string;
    participantsMatricules: string[];
    startsAt: number;
    endsAt: number;
    lieu?: string;
    statut: ReunionStatut;
    classification: Classification;
    compteRenduChiffre?: string;
    createdAt: number;
    updatedAt: number;
}

export interface CreateReunionInput {
    titre: string;
    description?: string;
    organisateurMatricule: string;
    participantsMatricules: string[];
    startsAt: number;
    endsAt: number;
    lieu?: string;
    classification: Classification;
}
