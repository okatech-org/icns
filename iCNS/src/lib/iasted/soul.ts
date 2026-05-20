/**
 * iAstedSoul — Conscience singleton de l'agent iAsted iCNS.
 *
 * Port simplifié de `packages/iasted/src/consciousness/iAstedSoul.ts`
 * (backoffice-web), adapté aux 8 rôles iCNS (officier_traitant, chef_section,
 * directeur_service, analyste_cns, sg_cns, rssi, auditeur, admin_technique).
 *
 *   - Persona dérivé du rôle iCNS effectif
 *   - Spatial awareness (route + module visible)
 *   - Context memory (intentions, actions pending/completed, salutation faite)
 *   - Lifecycle states (synchronisés avec le hook vocal)
 *
 * Pattern observer : les composants React s'abonnent via `subscribe`.
 */

import { getPageContext, type PageContext } from './spatial-awareness';

// ─── Types ─────────────────────────────────────────────────────────────

/**
 * Rôles iCNS — alignés sur `MODULES_PAR_ROLE` de ICNSWorkspace.tsx.
 * Les rôles "legacy_*" couvrent les espaces hérités du fork executif.ga
 * (le temps de la migration) pour conserver des salutations propres.
 */
export type IAstedRole =
    | 'sg_cns'
    | 'directeur_service'
    | 'analyste_cns'
    | 'officier_traitant'
    | 'chef_section'
    | 'rssi'
    | 'auditeur'
    | 'admin_technique'
    // Espaces hérités (executif.ga) — à migrer
    | 'legacy_president'
    | 'legacy_minister'
    | 'legacy_director'
    | 'legacy_admin'
    | 'legacy_courrier'
    | 'legacy_reception'
    | 'anonymous';

/** Niveaux de formalité : 1=Technique, 2=Cordial, 3=Protocolaire. */
export type FormalityLevel = 1 | 2 | 3;

/** Habilitation maximale en lecture (selon ROLE_CLASSIFICATION de ICNSWorkspace.tsx). */
export type ClassificationLevel = 'DR' | 'CD' | 'SD' | 'TSD';

export interface Persona {
    role: IAstedRole;
    /** Apostrophe formelle complète, ex: "Monsieur le Secrétaire Général". */
    honorificFull: string;
    /** Apostrophe courte, ex: "Monsieur le Secrétaire Général". */
    honorificShort: string;
    formalityLevel: FormalityLevel;
    /** Habilitation maximale (utile pour l'agent qui ne doit pas évoquer des dossiers au-delà). */
    clearance: ClassificationLevel;
}

export interface SpatialAwareness {
    currentUrl: string;
    pathname: string;
    page: PageContext;
}

export interface ConversationContext {
    sessionId: string;
    startedAt: number;
    messageCount: number;
    lastIntent: string | null;
    pendingActions: string[];
    completedActions: string[];
    /** Évite de saluer deux fois dans la même session. */
    hasGreeted: boolean;
}

export interface SoulState {
    persona: Persona;
    spatial: SpatialAwareness;
    context: ConversationContext;
    isAwake: boolean;
    isListening: boolean;
    isSpeaking: boolean;
    isProcessing: boolean;
}

// ─── Personae par rôle iCNS ────────────────────────────────────────────

export function derivePersona(role: IAstedRole): Persona {
    switch (role) {
        case 'sg_cns':
            return {
                role,
                honorificFull: 'Monsieur le Secrétaire Général',
                honorificShort: 'Monsieur le Secrétaire Général',
                formalityLevel: 3,
                clearance: 'TSD',
            };
        case 'directeur_service':
            return {
                role,
                honorificFull: 'Monsieur le Directeur de service',
                honorificShort: 'Monsieur le Directeur',
                formalityLevel: 3,
                clearance: 'TSD',
            };
        case 'analyste_cns':
            return {
                role,
                honorificFull: "Monsieur l'Analyste",
                honorificShort: 'Cher analyste',
                formalityLevel: 2,
                clearance: 'TSD',
            };
        case 'rssi':
            return {
                role,
                honorificFull: 'Monsieur le RSSI',
                honorificShort: 'Monsieur le RSSI',
                formalityLevel: 2,
                clearance: 'TSD',
            };
        case 'chef_section':
            return {
                role,
                honorificFull: 'Monsieur le Chef de section',
                honorificShort: 'Monsieur le Chef',
                formalityLevel: 2,
                clearance: 'SD',
            };
        case 'officier_traitant':
            return {
                role,
                honorificFull: "Monsieur l'Officier traitant",
                honorificShort: 'Cher collègue',
                formalityLevel: 2,
                clearance: 'SD',
            };
        case 'auditeur':
            return {
                role,
                honorificFull: "Monsieur l'Auditeur",
                honorificShort: 'Monsieur',
                formalityLevel: 2,
                clearance: 'SD',
            };
        case 'admin_technique':
            return {
                role,
                honorificFull: 'Monsieur l\'Administrateur technique',
                honorificShort: 'Administrateur',
                formalityLevel: 1,
                clearance: 'CD',
            };

        // Espaces hérités du fork executif.ga
        case 'legacy_president':
            return {
                role,
                honorificFull: 'Excellence Monsieur le Président',
                honorificShort: 'Excellence',
                formalityLevel: 3,
                clearance: 'TSD',
            };
        case 'legacy_minister':
            return {
                role,
                honorificFull: 'Excellence Monsieur le Ministre',
                honorificShort: 'Monsieur le Ministre',
                formalityLevel: 3,
                clearance: 'TSD',
            };
        case 'legacy_director':
            return {
                role,
                honorificFull: 'Monsieur le Directeur',
                honorificShort: 'Directeur',
                formalityLevel: 2,
                clearance: 'CD',
            };
        case 'legacy_admin':
            return {
                role,
                honorificFull: 'Administrateur',
                honorificShort: 'Administrateur',
                formalityLevel: 1,
                clearance: 'CD',
            };
        case 'legacy_courrier':
            return {
                role,
                honorificFull: 'Monsieur le Responsable Courrier',
                honorificShort: 'Monsieur',
                formalityLevel: 2,
                clearance: 'DR',
            };
        case 'legacy_reception':
            return {
                role,
                honorificFull: 'Monsieur le Responsable Réception',
                honorificShort: 'Monsieur',
                formalityLevel: 2,
                clearance: 'DR',
            };

        default:
            return {
                role: 'anonymous',
                honorificFull: 'Monsieur',
                honorificShort: 'Monsieur',
                formalityLevel: 2,
                clearance: 'DR',
            };
    }
}

// ─── Singleton ─────────────────────────────────────────────────────────

const initialPathname = typeof window !== 'undefined' ? window.location.pathname : '/';

class IAstedSoulImpl {
    private state: SoulState;
    private listeners: Set<(s: SoulState) => void> = new Set();

    constructor() {
        this.state = {
            persona: derivePersona('anonymous'),
            spatial: {
                currentUrl: typeof window !== 'undefined' ? window.location.href : '',
                pathname: initialPathname,
                page: getPageContext(initialPathname),
            },
            context: this.newContext(),
            isAwake: false,
            isListening: false,
            isSpeaking: false,
            isProcessing: false,
        };
    }

    private newContext(): ConversationContext {
        return {
            sessionId: `soul-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            startedAt: Date.now(),
            messageCount: 0,
            lastIntent: null,
            pendingActions: [],
            completedActions: [],
            hasGreeted: false,
        };
    }

    setRole(role: IAstedRole): void {
        if (this.state.persona.role === role) return;
        this.state.persona = derivePersona(role);
        this.notify();
    }

    setPathname(pathname: string): void {
        if (this.state.spatial.pathname === pathname) return;
        this.state.spatial = {
            currentUrl: typeof window !== 'undefined' ? window.location.href : pathname,
            pathname,
            page: getPageContext(pathname),
        };
        this.notify();
    }

    recordIntent(intent: string): void {
        this.state.context.lastIntent = intent;
        this.state.context.messageCount += 1;
        this.notify();
    }

    markGreeted(): void {
        if (this.state.context.hasGreeted) return;
        this.state.context.hasGreeted = true;
        this.notify();
    }

    queueAction(action: string): void {
        this.state.context.pendingActions.push(action);
        this.notify();
    }

    completeAction(action: string): void {
        const i = this.state.context.pendingActions.indexOf(action);
        if (i > -1) this.state.context.pendingActions.splice(i, 1);
        this.state.context.completedActions.push(action);
        this.notify();
    }

    awaken(): void {
        if (this.state.isAwake) return;
        this.state.isAwake = true;
        this.notify();
    }

    sleep(): void {
        if (!this.state.isAwake) return;
        this.state.isAwake = false;
        this.state.isListening = false;
        this.state.isSpeaking = false;
        this.state.context = this.newContext();
        this.notify();
    }

    setLifecycle(partial: Partial<Pick<SoulState, 'isListening' | 'isSpeaking' | 'isProcessing'>>): void {
        let changed = false;
        for (const k of ['isListening', 'isSpeaking', 'isProcessing'] as const) {
            if (partial[k] !== undefined && partial[k] !== this.state[k]) {
                (this.state as any)[k] = partial[k];
                changed = true;
            }
        }
        if (changed) this.notify();
    }

    getState(): Readonly<SoulState> {
        return this.state;
    }

    subscribe(listener: (s: SoulState) => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notify(): void {
        const snapshot = { ...this.state };
        this.listeners.forEach(l => l(snapshot));
    }
}

export const iAstedSoul = new IAstedSoulImpl();
