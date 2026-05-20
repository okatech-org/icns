// Hooks Convex-react pour iAsted modern (appels, contacts, réunions).
// Le `matricule` est dérivé de userId Firebase (Phase 0). En Phase 2,
// utilisera l'identifiant carte agent émis par le HSM.

import { useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useUserContext } from "@/hooks/useUserContext";
import { useICNSAuth } from "@/auth/useICNSAuth";
import type {
    AppelStatut,
    AppelDirection,
    Classification,
    ReunionStatut,
} from "@/types/iasted";
import type { Id } from "@convex/_generated/dataModel";

/**
 * Matricule courant pour les queries personnelles.
 *
 * Priorité : matricule iCNS extrait du JWT (espace de travail iCNS sécurisé)
 * puis Firebase userId (espaces utilisateur hérités d'executif.ga).
 */
function useCurrentMatricule(): string | null {
    const { userId } = useUserContext();
    const jwt = useICNSAuth((s) => s.jwt);

    return useMemo(() => {
        if (jwt) {
            try {
                const payload = JSON.parse(
                    atob(jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
                );
                if (typeof payload.sub === "string") return payload.sub;
            } catch {
                // fall through
            }
        }
        return userId;
    }, [jwt, userId]);
}

// ─── Appels ────────────────────────────────────────────────────────────

export function useAppelsList(limit?: number) {
    const matricule = useCurrentMatricule();
    return useQuery(
        api.iasted.appels.listAppelsByMatricule,
        matricule ? { matricule, limit } : "skip",
    );
}

export function useAppelsStats() {
    const matricule = useCurrentMatricule();
    return useQuery(
        api.iasted.appels.getAppelsStats,
        matricule ? { matricule } : "skip",
    );
}

export function useAppel(appelId: Id<"iasted_appels"> | null) {
    return useQuery(
        api.iasted.appels.getAppel,
        appelId ? { appelId } : "skip",
    );
}

export function useCreateAppel() {
    return useMutation(api.iasted.appels.createAppel);
}

export function useTerminerAppel() {
    return useMutation(api.iasted.appels.terminerAppel);
}

export function useAjouterNotesAppel() {
    return useMutation(api.iasted.appels.ajouterNotes);
}

export function useSupprimerAppel() {
    return useMutation(api.iasted.appels.supprimerAppel);
}

// ─── Contacts ──────────────────────────────────────────────────────────

export function useAnnuaire(searchTerm?: string, serviceFilter?: string) {
    return useQuery(api.iasted.contacts.listAnnuaire, {
        searchTerm,
        serviceFilter,
    });
}

export function useFavoris() {
    const matricule = useCurrentMatricule();
    return useQuery(
        api.iasted.contacts.listFavoris,
        matricule ? { ownerMatricule: matricule } : "skip",
    );
}

export function useContact(contactMatricule: string | null) {
    const matricule = useCurrentMatricule();
    return useQuery(
        api.iasted.contacts.getContact,
        matricule && contactMatricule
            ? { ownerMatricule: matricule, contactMatricule }
            : "skip",
    );
}

export function useToggleFavori() {
    return useMutation(api.iasted.contacts.toggleFavori);
}

export function useUpdateContactNotes() {
    return useMutation(api.iasted.contacts.updateNotes);
}

// ─── Réunions ──────────────────────────────────────────────────────────

export function useReunionsList(statutFilter?: ReunionStatut, limit?: number) {
    const matricule = useCurrentMatricule();
    return useQuery(
        api.iasted.reunions.listReunionsByMatricule,
        matricule ? { matricule, statutFilter, limit } : "skip",
    );
}

export function useReunionsUpcoming(daysAhead?: number) {
    const matricule = useCurrentMatricule();
    return useQuery(
        api.iasted.reunions.listReunionsUpcoming,
        matricule ? { matricule, daysAhead } : "skip",
    );
}

export function useReunion(reunionId: Id<"iasted_reunions"> | null) {
    return useQuery(
        api.iasted.reunions.getReunion,
        reunionId ? { reunionId } : "skip",
    );
}

export function useCreateReunion() {
    return useMutation(api.iasted.reunions.createReunion);
}

export function useUpdateReunionStatut() {
    return useMutation(api.iasted.reunions.updateStatut);
}

export function useUpdateCompteRendu() {
    return useMutation(api.iasted.reunions.updateCompteRendu);
}

export function useAnnulerReunion() {
    return useMutation(api.iasted.reunions.annulerReunion);
}

export function useUpdateReunion() {
    return useMutation(api.iasted.reunions.updateReunion);
}

// ─── Helpers ─────────────────────────────────────────────────────────

export function formatAppelDuration(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m < 60) return `${m}m ${s}s`;
    const h = Math.floor(m / 60);
    const mm = m % 60;
    return `${h}h ${mm}m`;
}

export const APPEL_STATUT_LABELS: Record<AppelStatut, string> = {
    manque: "Manqué",
    repondu: "Répondu",
    en_cours: "En cours",
    termine: "Terminé",
};

export const APPEL_DIRECTION_LABELS: Record<AppelDirection, string> = {
    entrant: "Entrant",
    sortant: "Sortant",
};

export const REUNION_STATUT_LABELS: Record<ReunionStatut, string> = {
    planifiee: "Planifiée",
    en_cours: "En cours",
    terminee: "Terminée",
    annulee: "Annulée",
};

export const CLASSIFICATION_LABELS: Record<Classification, string> = {
    DR: "Diffusion Restreinte",
    CD: "Confidentiel Défense",
    SD: "Secret Défense",
    TSD: "Très Secret Défense",
};

export { useCurrentMatricule };
