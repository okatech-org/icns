/**
 * formatPageContextForVoice — Sérialise le snapshot courant en bloc texte
 * exploitable par l'engine d'intentions (et, à terme, par un LLM si on
 * branche un modèle réel).
 *
 * Variante iCNS du `format-page-context.ts` du package `@workspace/iasted`
 * du backoffice-web. Sans LLM côté front, on l'expose principalement à des
 * fins de debug (DevTools), pour les réponses Q/A "que vois-tu sur cette
 * page", et pour l'éventuel futur branchement à un modèle distant.
 */

import {
    getCurrentPageContext,
    type PageContextSnapshot,
    type PageEntity,
    type PageAction,
} from './page-context-store';

const NO_CONTEXT = `## CONTEXTE PAGE COURANT
Aucune page n'a déclaré son contexte. L'agent peut toujours répondre aux
questions générales et exécuter les commandes globales (navigation, thème,
contrôle UI).`;

export function formatPageContextForVoice(snapshot?: PageContextSnapshot | null): string {
    const ctx = snapshot ?? getCurrentPageContext();
    if (!ctx) return NO_CONTEXT;

    const lines: string[] = [];
    lines.push('## CONTEXTE PAGE COURANT');
    lines.push(`Page : ${ctx.title} (${ctx.pathname})`);
    lines.push(`Module : ${ctx.module}`);
    if (ctx.summary) lines.push(`État : ${ctx.summary}`);

    if (ctx.visibleEntities.length > 0) {
        lines.push('');
        lines.push(`Entités visibles (${ctx.visibleEntities.length}) :`);
        for (const e of ctx.visibleEntities.slice(0, 30)) {
            lines.push(`- [${e.type}] ${e.label} (id: ${e.id})${formatEntityData(e.data)}`);
        }
        if (ctx.visibleEntities.length > 30) {
            lines.push(`- ...et ${ctx.visibleEntities.length - 30} autres entités`);
        }
    }

    if (ctx.availableActions.length > 0) {
        lines.push('');
        lines.push(`Actions disponibles sur cette page (à exécuter via execute_page_action) :`);
        for (const a of ctx.availableActions) {
            const confirm = a.requiresConfirmation ? ' — CONFIRMATION REQUISE' : '';
            const triggers = a.voiceTriggers && a.voiceTriggers.length > 0
                ? ` — déclencheurs : "${a.voiceTriggers.join('", "')}"`
                : '';
            lines.push(`- ${a.id} : ${a.description}${confirm}${triggers}`);
        }
    } else {
        lines.push('');
        lines.push("Aucune action exécutable n'est déclarée par cette page.");
    }

    return lines.join('\n');
}

function formatEntityData(data: Record<string, unknown> | undefined): string {
    if (!data) return '';
    const keys = Object.keys(data);
    if (keys.length === 0) return '';
    const parts: string[] = [];
    for (const k of keys.slice(0, 5)) {
        const v = data[k];
        if (v == null) continue;
        if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
            parts.push(`${k}=${v}`);
        }
    }
    return parts.length > 0 ? ` { ${parts.join(', ')} }` : '';
}

/** Réponse vocale courte qui décrit ce que la page expose. */
export function describePageContextForSpeech(): string {
    const ctx = getCurrentPageContext();
    if (!ctx) return "Cette page n'a pas déclaré de contexte particulier.";
    const entityCount = ctx.visibleEntities.length;
    const actionCount = ctx.availableActions.length;
    const parts: string[] = [];
    parts.push(`Vous êtes sur ${ctx.title}.`);
    if (ctx.summary) parts.push(ctx.summary + '.');
    if (entityCount > 0) {
        parts.push(`Je vois ${entityCount} ${entityCount === 1 ? 'entité' : 'entités'} sur cette page.`);
    }
    if (actionCount > 0) {
        const first = ctx.availableActions.slice(0, 3).map(a => a.label.toLowerCase()).join(', ');
        parts.push(`Je peux par exemple : ${first}.`);
    }
    return parts.join(' ');
}

/** Liste les voiceTriggers connus pour fournir des suggestions. */
export function listPageActionTriggers(): string[] {
    const ctx = getCurrentPageContext();
    if (!ctx) return [];
    const triggers: string[] = [];
    for (const a of ctx.availableActions) {
        if (a.voiceTriggers && a.voiceTriggers[0]) triggers.push(a.voiceTriggers[0]);
        else triggers.push(a.label);
    }
    return triggers;
}
