/**
 * pageContextStore — Store Zustand où chaque page iCNS peut publier dynamiquement
 *
 *   - ses **entités visibles** (dossiers, pièces, agents, synthèses...)
 *   - ses **actions disponibles** (créer un dossier, transmettre, signer...)
 *
 * Inspiré de `packages/agent-features/stores/page-context-store` du
 * monorepo gabon-diplomatie, mais simplifié pour iCNS :
 *   - pas de panel overlay
 *   - pas de shell global séparé
 *   - pas de scopedToolNames (l'engine consomme directement les actions)
 *
 * Une page appelle `usePublishPageContext(snapshot)` au mount ; l'agent
 * iAsted lit le snapshot via `useIAstedPageContext()` ou via le getter
 * pur `pageContextStore.getState()`.
 */

import { create } from 'zustand';
import { useEffect } from 'react';

export interface PageEntity {
    /** ID stable (Convex Id<...> sérialisé ou identifiant métier). */
    id: string;
    /** Type métier : 'dossier' | 'piece' | 'synthese' | 'agent' | 'correspondance' | ... */
    type: string;
    /** Libellé humain affiché à l'utilisateur. */
    label: string;
    /** Champs optionnels pour aider l'agent (classification, statut, etc.). */
    data?: Record<string, unknown>;
}

export interface PageAction {
    /** ID stable d'action (kebab-case), unique dans la page. */
    id: string;
    /** Libellé humain ("Créer un dossier"). */
    label: string;
    /** Description orientée agent : quand l'utiliser. */
    description: string;
    /** Demande de confirmation avant exécution (action destructrice / signature / transmission). */
    requiresConfirmation?: boolean;
    /** Mots-clés vocaux qui doivent matcher pour déclencher cette action. */
    voiceTriggers?: string[];
    /** Handler invoqué quand l'agent (ou un autre composant) demande l'exécution. */
    run: (args?: Record<string, unknown>) => void | Promise<void>;
}

export interface PageContextSnapshot {
    /** Nom court du module (ex: "iDocument", "Workspace iCNS", "iCorrespondance"). */
    module: string;
    /** Chemin courant — sert juste à invalider si la route change avant un unmount. */
    pathname: string;
    /** Titre humain (ex: "Tableau de bord SG-CNS"). */
    title: string;
    /** Description courte de l'état (ex: "12 dossiers en cours, 3 synthèses à valider"). */
    summary?: string;
    visibleEntities: PageEntity[];
    availableActions: PageAction[];
}

interface PageContextStore {
    current: PageContextSnapshot | null;
    setSnapshot: (s: PageContextSnapshot | null) => void;
    clear: () => void;
}

export const pageContextStore = create<PageContextStore>((set) => ({
    current: null,
    setSnapshot: (s) => set({ current: s }),
    clear: () => set({ current: null }),
}));

/**
 * Hook que les pages utilisent pour DÉCLARER leur contexte au store.
 * Le snapshot est publié au mount, mis à jour quand il change, et effacé
 * au unmount (sauf si une autre page a déjà pris le relais).
 *
 * Convention : passe `null` pour suspendre la déclaration sans démonter.
 */
export function usePublishPageContext(snapshot: PageContextSnapshot | null): void {
    useEffect(() => {
        if (snapshot) {
            pageContextStore.getState().setSnapshot(snapshot);
        }
        return () => {
            // À l'unmount, on n'efface que si NOTRE snapshot est encore le snapshot courant.
            const cur = pageContextStore.getState().current;
            if (cur && snapshot && cur === snapshot) {
                pageContextStore.getState().clear();
            }
        };
    }, [snapshot]);
}

/** Hook qui s'abonne au snapshot courant (réactif). */
export function useIAstedPageContext(): PageContextSnapshot | null {
    return pageContextStore((s) => s.current);
}

/** Accès sans abonnement (utile pour l'engine d'intentions). */
export function getCurrentPageContext(): PageContextSnapshot | null {
    return pageContextStore.getState().current;
}

/**
 * Exécute une action déclarée par la page courante via son `id`.
 * Retourne `{ success, message }` que l'agent peut prononcer à l'oral.
 */
export async function executePageAction(
    actionId: string,
    args?: Record<string, unknown>,
): Promise<{ success: boolean; message: string }> {
    const ctx = getCurrentPageContext();
    if (!ctx) {
        return { success: false, message: 'Aucune action contextuelle disponible.' };
    }
    const action = ctx.availableActions.find((a) => a.id === actionId);
    if (!action) {
        return { success: false, message: `Action « ${actionId} » introuvable sur cette page.` };
    }
    try {
        await action.run(args);
        return { success: true, message: `${action.label} : effectué.` };
    } catch (e) {
        console.error('[iAsted] Erreur execute_page_action:', e);
        return { success: false, message: `Impossible d'exécuter ${action.label}.` };
    }
}

/** Normalisation : lowercase + suppression accents + ponctuation → comparaisons robustes. */
function normalizeForMatch(s: string): string {
    return s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[?!.,;:'"()]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Recherche une action par mot-clé vocal. Compare en mode normalisé (accents
 * ignorés) pour que "synthèses" matche "synthese", "rdv" matche "rendez-vous"
 * via les triggers déclarés par la page. Privilégie le trigger LE PLUS LONG
 * pour éviter qu'un trigger générique ne capture une intention plus précise.
 */
export function findActionByVoice(transcript: string): PageAction | null {
    const ctx = getCurrentPageContext();
    if (!ctx) return null;
    const q = normalizeForMatch(transcript);
    if (!q) return null;

    let best: { action: PageAction; triggerLen: number } | null = null;
    for (const a of ctx.availableActions) {
        const candidates = [
            ...(a.voiceTriggers ?? []),
            a.label, // fallback : le label lui-même
        ];
        for (const trig of candidates) {
            const nt = normalizeForMatch(trig);
            if (nt.length >= 3 && q.includes(nt)) {
                if (!best || nt.length > best.triggerLen) {
                    best = { action: a, triggerLen: nt.length };
                }
            }
        }
    }
    return best?.action ?? null;
}
