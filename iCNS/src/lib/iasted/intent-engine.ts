/**
 * iAstedIntentEngine — Moteur d'intentions enrichi.
 *
 * Trois familles d'intentions, traitées dans cet ordre :
 *
 *   1. **Commande** : navigation, contrôle UI, génération de document, etc.
 *      → renvoie un `tool` à exécuter via `onToolCall(name, args)`.
 *
 *   2. **Question (Q/A)** : « qu'est-ce que iCNS », « explique iDocument »,
 *      « où suis-je », « que peux-tu faire ici ».
 *      → renvoie une réponse vocale (`say`), pas de tool.
 *
 *   3. **Conversationnel** : salutations, remerciements, demandes d'aide.
 *      → renvoie une réponse courte contextuelle.
 *
 * S'inspire du `IntentProcessor.ts` du backoffice-web, mais intègre
 * la base de connaissances et le spatial awareness pour produire des
 * réponses contextuelles plutôt que de simples commandes.
 */

import { lookupKnowledge } from './knowledge';
import { iAstedSoul } from './soul';
import { findActionByVoice, getCurrentPageContext } from './page-context-store';
import { describePageContextForSpeech, listPageActionTriggers } from './format-page-context';

export type IntentKind = 'tool' | 'answer' | 'unknown';

export interface ToolIntent {
    kind: 'tool';
    tool: string;
    args: Record<string, any>;
    say: string;
}

export interface AnswerIntent {
    kind: 'answer';
    say: string;
    /** Réponse longue optionnelle (pour le chat texte). */
    detail?: string;
}

export interface UnknownIntent {
    kind: 'unknown';
    say: string;
}

export type Intent = ToolIntent | AnswerIntent | UnknownIntent;

// ─── Helpers ──────────────────────────────────────────────────────────
function tool(t: string, args: Record<string, any>, say: string): ToolIntent {
    return { kind: 'tool', tool: t, args, say };
}
function answer(say: string, detail?: string): AnswerIntent {
    return { kind: 'answer', say, detail };
}

// ─── Parser principal ─────────────────────────────────────────────────
export function classifyIntent(transcript: string): Intent {
    const t = transcript.toLowerCase().trim();
    if (!t) return { kind: 'unknown', say: '' };

    // ── 0. ACTION DÉCLARÉE PAR LA PAGE COURANTE (priorité maximale) ────
    //   Une page iCNS peut publier ses propres actions via `usePublishPageContext`.
    //   Si un voiceTrigger matche, on déclenche `execute_page_action` immédiatement.
    //
    //   EXCEPTION : si la phrase commence par un verbe explicitement explicatif
    //   ("explique", "présente", "c'est quoi", "à quoi sert"), on laisse passer
    //   pour favoriser une réponse Q/A plutôt qu'une exécution d'action.
    const isExplanatory = /^(explique|pr[ée]sente|c'est quoi|qu'est[- ]ce que|[aà] quoi sert|d[ée]finis|d[ée]finition)/.test(t);
    if (!isExplanatory) {
        const pageAction = findActionByVoice(transcript);
        if (pageAction) {
            return tool(
                'execute_page_action',
                { actionId: pageAction.id, label: pageAction.label, requiresConfirmation: pageAction.requiresConfirmation === true },
                pageAction.requiresConfirmation
                    ? `Confirmation requise pour ${pageAction.label.toLowerCase()}. Voulez-vous continuer ?`
                    : `${pageAction.label}.`,
            );
        }
    }

    // ── 1. CONTRÔLE / ARRÊT ────────────────────────────────────────────
    if (/(arr[êe]te[- ]?toi|stop|ferme[- ]?toi|d[ée]sactive[- ]?toi|au revoir|bye|coupe)/.test(t)) {
        return tool('stop_conversation', {}, 'Très bien, à votre disposition.');
    }
    if (/(d[ée]connecte|d[ée]connexion|logout|sors[- ]moi|quitte la session)/.test(t)) {
        return tool('logout_user', {}, 'Déconnexion en cours.');
    }

    // ── 2. CHAT (ouvrir / fermer) ──────────────────────────────────────
    if (/(ouvre|affiche|montre).*(chat|conversation|fen[êe]tre|historique)/.test(t)) {
        return tool('open_chat', {}, 'Chat ouvert.');
    }
    if (/(ferme|cache|masque).*(chat|conversation|fen[êe]tre)/.test(t)) {
        return tool('close_chat', {}, 'Chat fermé.');
    }

    // ── 3. THÈME ───────────────────────────────────────────────────────
    if (/(mode|th[èe]me|passe en|active).*(sombre|noir|nuit|dark)/.test(t)) {
        return tool('control_ui', { action: 'set_theme_dark' }, 'Mode sombre activé.');
    }
    if (/(mode|th[èe]me|passe en|active).*(clair|jour|light|blanc)/.test(t)) {
        return tool('control_ui', { action: 'set_theme_light' }, 'Mode clair activé.');
    }
    if (/(bascule|change|inverse).*(th[èe]me|mode)/.test(t)) {
        return tool('control_ui', { action: 'toggle_theme' }, 'Thème basculé.');
    }
    if (/(d[ée]plie|cache|masque|affiche|bascule).*(menu|sidebar|barre lat[ée]rale)/.test(t)) {
        return tool('control_ui', { action: 'toggle_sidebar' }, 'Menu basculé.');
    }

    // ── 4. VITESSE DE PAROLE ───────────────────────────────────────────
    if (/(parle plus vite|acc[ée]l[èe]re|plus rapide|plus rapidement)/.test(t)) {
        return tool('control_ui', { action: 'set_speech_rate', value: '1.3' }, 'Vitesse accélérée.');
    }
    if (/(parle plus lentement|ralenti[se]?|moins vite|plus lent)/.test(t)) {
        return tool('control_ui', { action: 'set_speech_rate', value: '0.8' }, 'Vitesse ralentie.');
    }
    if (/(vitesse normale|tempo normal|reprends ta vitesse)/.test(t)) {
        return tool('control_ui', { action: 'set_speech_rate', value: '1.0' }, 'Vitesse normale.');
    }

    // ── 5. VOIX ────────────────────────────────────────────────────────
    if (/(change de voix|change ta voix|autre voix|voix (homme|femme))/.test(t)) {
        let voiceId: string | undefined;
        if (/voix femme|voix f[ée]minine/.test(t)) voiceId = 'shimmer';
        else if (/voix homme|voix masculine/.test(t)) voiceId = 'ash';
        return tool('change_voice', voiceId ? { voice_id: voiceId } : {}, 'Voix changée.');
    }

    // ── 6. NAVIGATION GLOBALE ──────────────────────────────────────────
    const globalNavPatterns: Array<{ re: RegExp; query: string }> = [
        { re: /(accueil|home|page d'accueil|tableau de bord principal|d[ée]marrage)/, query: 'accueil' },
        { re: /(espace pr[ée]sident|page pr[ée]sident|chez le pr[ée]sident|pr[ée]sidence)/, query: 'president' },
        { re: /(espace admin|administration|god mode|page admin)/, query: 'admin' },
        { re: /(d[ée]mo|d[ée]monstration|page demo)/, query: 'demo' },
        { re: /(secr[ée]tariat g[ée]n[ée]ral|sec gen|secr[ée]taire g[ée]n[ée]ral)/, query: 'secretariat' },
        { re: /(dgss|renseignement|contre[- ]espionnage)/, query: 'dgss' },
        { re: /(service r[ée]ception|espace r[ée]ception|service accueil)/, query: 'reception' },
        { re: /(service courriers?|messagerie|correspondance)/, query: 'courriers' },
        { re: /(connexion|page de connexion|authentification|login)/, query: 'auth' },
        { re: /(workspace icns|espace icns)/, query: '/icns/workspace' },
    ];
    for (const { re, query } of globalNavPatterns) {
        if (re.test(t) && /(va|aller|ouvre|ouvrir|navigue|navigation|montre|affiche|am[èe]ne|emm[èe]ne|passe|bascule)/.test(t)) {
            return tool('global_navigate', { query }, `Navigation vers ${query}.`);
        }
    }

    // ── 7. NAVIGATION LOCALE (sections) ────────────────────────────────
    const localSectionsMap: Record<string, string[]> = {
        dashboard: ['dashboard', 'tableau de bord'],
        documents: ['documents'],
        courriers: ['courriers', 'courrier'],
        iasted: ['iasted', 'assistant'],
        'conseil-ministres': ['conseil des ministres', 'conseil ministres'],
        ministeres: ['ministères', 'ministeres'],
        decrets: ['décrets', 'decrets'],
        nominations: ['nominations'],
        budget: ['budget'],
        indicateurs: ['indicateurs'],
        investissements: ['investissements'],
        education: ['éducation', 'education'],
        sante: ['santé', 'sante'],
        emploi: ['emploi'],
        chantiers: ['chantiers'],
        users: ['utilisateurs', 'users'],
        config: ['configuration', 'config'],
        audit: ['audit'],
        ai: ['intelligence artificielle', 'ia'],
        knowledge: ['base de connaissances', 'knowledge'],
        feedbacks: ['feedback', 'retours'],
    };
    if (/(va|ouvre|montre|affiche|d[ée]plie|navigue vers|section)/.test(t)) {
        for (const [sectionId, keywords] of Object.entries(localSectionsMap)) {
            if (keywords.some(k => t.includes(k))) {
                return tool('navigate_to_section', { section_id: sectionId }, `Section ${sectionId} ouverte.`);
            }
        }
    }

    // ── 8. GÉNÉRATION DE DOCUMENT ──────────────────────────────────────
    const docMatch = t.match(/(g[ée]n[èe]re|cr[ée]e|r[ée]dige|pr[ée]pare).{0,30}?(lettre|d[ée]cret|note|nomination|rapport)/);
    if (docMatch) {
        const typeMap: Record<string, string> = {
            'lettre': 'lettre',
            'décret': 'decret',
            'decret': 'decret',
            'note': 'note',
            'nomination': 'nomination',
            'rapport': 'note',
        };
        const docType = typeMap[docMatch[2]] ?? 'note';
        const isDocx = /word|docx/.test(t);
        return tool(
            'generate_document',
            { type: docType, recipient: 'À préciser', subject: transcript, format: isDocx ? 'docx' : 'pdf' },
            `Génération d'un ${docType} en cours.`,
        );
    }

    // ── 9. HISTORIQUE ──────────────────────────────────────────────────
    if (/(efface|vide|nettoie|supprime).*(historique|conversation|chat)/.test(t)) {
        return tool('manage_history', { action: 'clear' }, 'Historique effacé.');
    }

    // ── 10. INFO PERSONNELLE (rôle, habilitation, service) ─────────────
    if (/(quel est mon r[oô]le|qui suis[- ]je|mon r[oô]le|tu sais qui je suis)/.test(t)) {
        const p = iAstedSoul.getState().persona;
        return answer(`Vous êtes ${p.honorificFull}. Habilitation maximale : ${p.clearance}.`);
    }
    if (/(habilitation|mon niveau|niveau d'habilitation|j'ai acc[èe]s [aà] quoi|jusqu'o[uù] j'ai acc[èe]s)/.test(t)) {
        const p = iAstedSoul.getState().persona;
        const labelMap: Record<string, string> = {
            DR: 'Diffusion Restreinte', CD: 'Confidentiel Défense',
            SD: 'Secret Défense', TSD: 'Très Secret Défense',
        };
        return answer(`Votre habilitation maximale est ${labelMap[p.clearance]} (${p.clearance}).`);
    }

    // ── 11. SPATIAL : où suis-je / que vois-tu / résumé ────────────────
    if (/(o[uù] (suis|sommes)[- ]je|sur quelle page|quelle page|c'est quelle page|je suis o[uù])/.test(t)) {
        const liveCtx = getCurrentPageContext();
        if (liveCtx) {
            return answer(`Vous êtes sur ${liveCtx.title}. Module ${liveCtx.module}.`);
        }
        const page = iAstedSoul.getState().spatial.page;
        return answer(`Vous êtes sur ${page.label}. Module ${page.module}.`);
    }
    if (/(que vois[- ]tu|que peux[- ]tu faire|tu peux faire quoi|que sais[- ]tu faire|tes capacit[ée]s|que (peut|peux)[- ]on faire|donne[- ]moi (un\s+)?r[ée]sum[ée]|fais[- ]moi (un\s+)?r[ée]sum[ée]|r[ée]sume\s+(moi\s+)?la\s+situation|que\s+se\s+passe[- ]t[- ]il)/.test(t)) {
        const liveCtx = getCurrentPageContext();
        if (liveCtx) {
            return answer(describePageContextForSpeech());
        }
        const page = iAstedSoul.getState().spatial.page;
        if (page.capabilities.length === 0) {
            return answer("Ici, je peux vous orienter dans la plateforme. Demandez-moi ce dont vous avez besoin.");
        }
        const list = page.capabilities.join(', ');
        return answer(`Sur ${page.label}, je peux ${list}.`);
    }
    if (/(des suggestions|que sugg[èe]res[- ]tu|propose[- ]moi|donne[- ]moi des id[ée]es|propose une action)/.test(t)) {
        const triggers = listPageActionTriggers();
        if (triggers.length > 0) {
            const sug = triggers.slice(0, 3).map(s => `« ${s} »`).join(', ');
            return answer(`Vous pouvez par exemple dire : ${sug}.`);
        }
        const page = iAstedSoul.getState().spatial.page;
        const sug = page.suggestions.slice(0, 3).map(s => `« ${s} »`).join(', ');
        return answer(`Vous pouvez essayer : ${sug}.`);
    }

    // ── 12. LISTE DES MODULES ──────────────────────────────────────────
    //   Détection en deux temps : présence du mot « modules » + un connecteur
    //   d'énumération (quels, liste, combien, tous, énumère, disponibles...).
    const mentionsModules = /\bmodules?\b/.test(t);
    const asksList = /\b(quels?|quelles?|liste[rz]?|combien|tous|enum[ée]r[ez]|disponibles?|accessibles?|montre)\b/.test(t);
    if (mentionsModules && asksList) {
        const ctx = getCurrentPageContext();
        if (ctx && ctx.visibleEntities.length > 0) {
            const labels = ctx.visibleEntities.map(e => e.label).join(', ');
            return answer(`Modules accessibles depuis cette page : ${labels}.`);
        }
        return answer(
            "iCNS comprend les modules iDocument, iCorrespondance, iCom, iArchive, iAgenda, "
            + "ainsi que le cockpit SG-CNS, la Cellule CNS, l'audit RSSI et l'administration.",
        );
    }

    // ── 13. CONNAISSANCES (Q/A sur la plateforme) ──────────────────────
    const k = lookupKnowledge(t);
    if (k) {
        return answer(k.answer, k.detail);
    }

    // ── 14. CONVERSATIONNEL (poli, social) ─────────────────────────────
    if (/^(bonjour|salut|hello|coucou|bonsoir|hey)\b/.test(t)) {
        const persona = iAstedSoul.getState().persona;
        return answer(`Bonjour ${persona.honorificShort}, en quoi puis-je vous aider ?`);
    }
    if (/(merci|je te remercie|c'est gentil)/.test(t)) {
        return answer('Avec plaisir.');
    }
    if (/(ça va|comment vas[- ]tu|tu vas bien)/.test(t)) {
        return answer("Je suis opérationnel et à votre écoute.");
    }
    if (/^(aide|au secours|help)\b|aide[- ]moi|j'ai besoin d'aide|tu peux m'aider/.test(t)) {
        const liveCtx = getCurrentPageContext();
        if (liveCtx) {
            return answer(describePageContextForSpeech());
        }
        const page = iAstedSoul.getState().spatial.page;
        const sug = page.suggestions[0] ?? 'Présente-moi iCNS';
        return answer(`Je peux vous orienter sur ${page.label}. Essayez par exemple : « ${sug} ».`);
    }

    // ── 15. FALLBACK CONTEXTUEL ────────────────────────────────────────
    //   On évite « je n'ai pas saisi » nu : on liste plutôt ce qui est faisable
    //   sur la page courante. C'est ce que ferait un agent LLM en dernier recours.
    const liveCtx = getCurrentPageContext();
    if (liveCtx && liveCtx.availableActions.length > 0) {
        const triggers = liveCtx.availableActions
            .slice(0, 4)
            .map((a) => a.voiceTriggers?.[0] ?? a.label.toLowerCase());
        return {
            kind: 'unknown',
            say:
                `Je n'ai pas tout saisi. Ici je peux par exemple : ${triggers.join(', ')}. `
                + `Vous pouvez aussi me demander « où suis-je » ou « présente-moi iCNS ».`,
        };
    }
    const page = iAstedSoul.getState().spatial.page;
    if (page.suggestions.length > 0) {
        return {
            kind: 'unknown',
            say:
                `Je n'ai pas tout saisi. Essayez par exemple : `
                + page.suggestions.slice(0, 3).map((s) => `« ${s} »`).join(', ')
                + ".",
        };
    }
    return {
        kind: 'unknown',
        say:
            "Je n'ai pas saisi votre demande. Vous pouvez me demander « présente-moi iCNS », "
            + "« où suis-je », ou « que peux-tu faire ».",
    };
}
