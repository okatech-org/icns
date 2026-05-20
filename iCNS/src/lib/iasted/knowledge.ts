/**
 * iCNSKnowledge — Base de connaissances iAsted, recentrée iCNS.
 *
 * Source : README.md (NTSAGUI/CNS/2026) + ICNSWorkspace.tsx (rôles + modules)
 * + cahier des charges iCNS.
 *
 * Lookup par mots-clés normalisés — pas de RAG / embeddings côté front.
 */

export interface KnowledgeEntry {
    id: string;
    aliases: string[];
    answer: string;
    detail?: string;
}

// ─── Présentation d'iAsted ─────────────────────────────────────────────
const SELF_INTRO: KnowledgeEntry = {
    id: 'self_intro',
    aliases: [
        'qui es-tu', "qui es tu", 'tu es qui', "c'est qui iasted", "c'est quoi iasted",
        'présente-toi', 'présente toi', 'qui êtes-vous', 'tu fais quoi',
        'iasted', 'que sais tu faire', 'que peux tu faire en général',
    ],
    answer:
        "Je suis iAsted, l'agent intelligent intégré à la plateforme iCNS, "
        + "le Conseil National de Sécurité du Gabon. Je vous accompagne dans la navigation, "
        + "la gestion des dossiers de renseignement, les communications inter-services et la consultation des synthèses.",
};

// ─── Plateforme iCNS ───────────────────────────────────────────────────
const PLATFORM_INTRO: KnowledgeEntry = {
    id: 'platform_intro',
    aliases: [
        "qu'est-ce que icns", "qu'est ce que icns", "c'est quoi icns",
        "icns c'est quoi", "à quoi sert icns", "à quoi sert cette plateforme",
        "présente-moi la plateforme", "présente la plateforme",
        "explique icns", "explique-moi icns",
        "i conseil national de sécurité",
    ],
    answer:
        "iCNS est la plateforme souveraine de remontée, croisement et synthèse du renseignement national. "
        + "Elle orchestre les flux d'information entre les treize services de renseignement et de sécurité, "
        + "le secrétariat permanent du Conseil National de Sécurité et son Secrétaire Général. "
        + "Une API protégée alimente l'application présidentielle en synthèses signées.",
    detail:
        'Référence : NTSAGUI/CNS/2026 — classification CONFIDENTIEL DÉFENSE. '
        + 'L\'application orchestre les flux entre treize services, le secrétariat permanent du CNS et le SG-CNS.',
};

// ─── Modules iCNS ──────────────────────────────────────────────────────
const MODULES: KnowledgeEntry[] = [
    {
        id: 'module_sg_cockpit',
        aliases: ['cockpit sg', 'cockpit sg-cns', 'sg cockpit', "c'est quoi le cockpit", "à quoi sert le cockpit"],
        answer:
            "Le cockpit SG-CNS est la vue d'ensemble réservée au Secrétaire Général. "
            + "Il agrège les synthèses, les alertes et les indicateurs des treize services.",
    },
    {
        id: 'module_cellule',
        aliases: ['cellule cns', 'cellule', 'croisement', 'synthèses inter-services', 'synthese'],
        answer:
            "La Cellule CNS effectue le croisement et la synthèse du renseignement entre les services. "
            + "Elle produit les synthèses signées transmises à la Présidence.",
    },
    {
        id: 'module_dossiers',
        aliases: ['dossiers de renseignement', 'mes dossiers', 'dossiers', 'dossier de renseignement'],
        answer:
            "Le module Dossiers regroupe vos dossiers de renseignement visibles selon votre habilitation. "
            + "Chaque dossier porte un type, un parcours, des pièces et une classification.",
    },
    {
        id: 'module_idocument',
        aliases: [
            'idocument', 'i-document', 'module idocument', "c'est quoi idocument",
            'gestion des documents', 'ged', 'coffre documentaire',
        ],
        answer:
            "iDocument est la gestion électronique de documents iCNS. "
            + "Il inclut l'arbre des dossiers de renseignement, le coffre des pièces et iArchive en sous-onglet.",
    },
    {
        id: 'module_icorrespondance',
        aliases: [
            'icorrespondance', 'i-correspondance', 'module icorrespondance', "c'est quoi icorrespondance",
            'workflow courrier', 'approbation courrier',
        ],
        answer:
            "iCorrespondance gère les courriers officiels avec un workflow d'approbation complet : "
            + "rédaction, visa, signature, transmission, archivage.",
    },
    {
        id: 'module_icom',
        aliases: ['icom', 'communications', 'messages inter-agences', 'messages officiels'],
        answer:
            "iCom regroupe les communications officielles inter-agences en temps réel. "
            + "Distinct d'iCorrespondance, qui gère le workflow d'approbation des courriers.",
    },
    {
        id: 'module_iarchive',
        aliases: ['iarchive', 'i-archive', 'module iarchive', "c'est quoi iarchive", 'archive', 'archives'],
        answer:
            "iArchive prend en charge le versement réglementaire et la déclassification des dossiers. "
            + "Les durées de rétention sont définies par les règles iCNS.",
    },
    {
        id: 'module_audit',
        aliases: ['audit', 'rssi', 'journal audit', "journal d'audit", 'intégrité', 'chaîne audit'],
        answer:
            "Le module Audit/RSSI expose le journal d'audit chaîné. "
            + "Chaque entrée est hachée et liée à la précédente pour garantir l'intégrité non répudiable.",
    },
    {
        id: 'module_admin',
        aliases: ['administration', 'admin technique', 'habilitations', 'paramètres techniques'],
        answer:
            "Le module Administration gère les habilitations des agents et les paramètres techniques de la plateforme.",
    },
    {
        id: 'module_iasted',
        aliases: ['module iasted', "c'est quoi le module iasted", 'agent intelligent'],
        answer:
            "Le module iAsted regroupe l'agent intelligent : chat, appels, contacts, réunions. "
            + "C'est l'espace où je vous accompagne directement.",
    },
    {
        id: 'module_iagenda',
        aliases: ['iagenda', 'i-agenda', 'module iagenda', "c'est quoi iagenda", 'agenda officiel'],
        answer:
            "iAgenda est l'agenda officiel iCNS : événements, réunions inter-services, échéances réglementaires.",
    },
];

// ─── Rôles iCNS (les 8) ─────────────────────────────────────────────────
const ROLES: KnowledgeEntry[] = [
    {
        id: 'role_list',
        aliases: ['liste des rôles', 'quels rôles', 'rôles icns', 'quels sont les rôles', 'qui peut utiliser icns'],
        answer:
            "iCNS définit huit rôles : officier traitant, chef de section, directeur de service, analyste CNS, "
            + "Secrétaire Général du CNS, RSSI, auditeur et administrateur technique.",
    },
    {
        id: 'role_sg_cns',
        aliases: ['sg cns', "secrétaire général", 'sg-cns', "secrétaire général du cns"],
        answer:
            "Le Secrétaire Général du CNS est le rôle pivot d'iCNS. "
            + "Il dispose du cockpit SG-CNS, voit toutes les synthèses inter-services et est habilité jusqu'au niveau Très Secret Défense.",
    },
    {
        id: 'role_rssi',
        aliases: ['rssi', "responsable sécurité"],
        answer:
            "Le RSSI surveille le journal d'audit, l'intégrité de la chaîne et le respect des règles de sécurité. "
            + "Il est habilité jusqu'au niveau Très Secret Défense.",
    },
    {
        id: 'role_analyste',
        aliases: ['analyste cns', 'analyste'],
        answer:
            "L'analyste CNS travaille dans la Cellule CNS au croisement des sources et à la rédaction des synthèses. "
            + "Habilitation Très Secret Défense.",
    },
    {
        id: 'role_officier',
        aliases: ['officier traitant', 'officier'],
        answer:
            "L'officier traitant est l'agent opérationnel d'un service. Il instruit ses dossiers de renseignement "
            + "et alimente iCorrespondance. Habilitation Secret Défense.",
    },
];

// ─── Les 13 services de sécurité ───────────────────────────────────────
const SERVICES: KnowledgeEntry = {
    id: 'services_list',
    aliases: [
        'liste des services', 'quels services', 'les 13 services', 'treize services',
        'services de renseignement', 'services de sécurité',
        'qui compose le cns', 'qui sont les services',
    ],
    answer:
        "Le Conseil National de Sécurité fédère treize services de renseignement et de défense, "
        + "sous l'autorité du Secrétaire Général. iCNS centralise leurs remontées, opère les croisements en cellule, "
        + "et transmet les synthèses à la Présidence.",
};

// ─── Classifications ───────────────────────────────────────────────────
const CLASSIFICATIONS: KnowledgeEntry = {
    id: 'classifications',
    aliases: [
        'classifications', 'niveaux de classification', 'classification des documents',
        "c'est quoi tsd", "c'est quoi sd", "c'est quoi cd", "c'est quoi dr",
        'diffusion restreinte', 'confidentiel défense', 'secret défense', 'très secret défense',
    ],
    answer:
        "iCNS distingue quatre classifications : Diffusion Restreinte, Confidentiel Défense, "
        + "Secret Défense et Très Secret Défense. Chaque niveau impose des règles strictes de stockage, "
        + "de chiffrement et de consultation, contrôlées par l'habilitation de l'agent.",
};

// ─── Authentification ─────────────────────────────────────────────────
const AUTH_INTRO: KnowledgeEntry = {
    id: 'auth_intro',
    aliases: [
        'comment me connecter', 'connexion sécurisée', 'authentification icns', 'login icns',
        'carte agent', 'pin', 'biométrie', 'mfa', 'multi facteurs', 'multi-facteurs',
    ],
    answer:
        "La connexion à iCNS exige trois facteurs : votre carte agent personnelle, votre code PIN "
        + "et une vérification biométrique. L'authentification doit avoir lieu sur un poste durci identifié "
        + "par son adresse IP fixe. La session est volatile : un rafraîchissement de la page exige un nouveau MFA.",
};

// ─── Workflow renseignement ────────────────────────────────────────────
const WORKFLOW: KnowledgeEntry = {
    id: 'workflow',
    aliases: [
        'comment marche le renseignement', 'workflow renseignement', 'flux renseignement',
        'comment ça marche', 'parcours du renseignement', 'comment circule le renseignement',
        "comment fonctionne icns",
    ],
    answer:
        "Le renseignement remonte des treize services vers la Cellule CNS, où il est croisé et synthétisé. "
        + "Les synthèses signées sont ensuite transmises à la Présidence via l'API présidentielle, "
        + "protégée par mutual TLS et par un token court délivré à chaque agent autorisé.",
};

// ─── Sécurité plateforme ──────────────────────────────────────────────
const PLATFORM_SECURITY: KnowledgeEntry = {
    id: 'platform_security',
    aliases: [
        'sécurité de la plateforme', 'sécurité icns', 'comment c\'est sécurisé',
        'hsm', 'pki', 'pki souveraine', 'kek', 'chiffrement icns',
    ],
    answer:
        "iCNS s'appuie sur une PKI souveraine et un HSM PKCS#11 pour la cryptographie. "
        + "Toutes les pièces sont chiffrées par une clé dérivée d'une KEK protégée matériellement. "
        + "Le journal d'audit est chaîné et signé pour garantir la non-répudiation.",
};

// ─── Index complet ─────────────────────────────────────────────────────
export const KNOWLEDGE_BASE: KnowledgeEntry[] = [
    SELF_INTRO,
    PLATFORM_INTRO,
    ...MODULES,
    ...ROLES,
    SERVICES,
    CLASSIFICATIONS,
    AUTH_INTRO,
    WORKFLOW,
    PLATFORM_SECURITY,
];

/** Normalise pour matching robuste (lowercase + suppression ponctuation/accents pour les comparaisons). */
function normalize(s: string): string {
    return s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '') // strip accents
        .replace(/[?!.,;:'"()]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function tokenize(s: string): string[] {
    return normalize(s)
        .split(/\s+/)
        .filter((w) => w.length >= 2 && !STOPWORDS.has(w));
}

const STOPWORDS = new Set([
    'le', 'la', 'les', 'un', 'une', 'de', 'du', 'des', 'et', 'ou', 'a', 'à',
    'au', 'aux', 'en', 'que', 'qui', 'quoi', 'sur', 'avec', 'pour', 'par',
    'ce', 'cette', 'ces', 'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'son', 'sa', 'ses',
    'me', 'te', 'se', 'tu', 'il', 'elle', 'on', 'je', "j'", "c'", "l'", "d'",
    'est', 'sont', 'sera', 'serait', 'pas', 'ne', 'non', 'oui',
    'tres', 'plus', 'moins', 'bien', 'mal',
]);

/**
 * Lookup avec scoring :
 *   1. match exact d'un alias normalisé → meilleur
 *   2. la question contient un alias (LE PLUS LONG en priorité, pour éviter
 *      qu'un alias court comme « documents » ne capture une entrée moins pertinente)
 *   3. recouvrement de tokens (≥ 60 %) — fallback pour les phrases courtes
 */
export function lookupKnowledge(query: string): KnowledgeEntry | null {
    const q = normalize(query);
    if (!q) return null;

    // 1. Match exact (normalisé)
    for (const entry of KNOWLEDGE_BASE) {
        if (entry.aliases.some((a) => normalize(a) === q)) return entry;
    }
    // 2. La question contient un alias — privilégier l'alias le plus long
    let bestSubstring: { entry: KnowledgeEntry; len: number } | null = null;
    for (const entry of KNOWLEDGE_BASE) {
        for (const a of entry.aliases) {
            const na = normalize(a);
            if (na.length >= 4 && q.includes(na)) {
                if (!bestSubstring || na.length > bestSubstring.len) {
                    bestSubstring = { entry, len: na.length };
                }
            }
        }
    }
    if (bestSubstring) return bestSubstring.entry;

    // 3. Recouvrement de tokens (cas court, ex: "résumé situation")
    const qTokens = new Set(tokenize(q));
    if (qTokens.size > 0) {
        let bestOverlap: { entry: KnowledgeEntry; score: number } | null = null;
        for (const entry of KNOWLEDGE_BASE) {
            for (const a of entry.aliases) {
                const aTokens = new Set(tokenize(a));
                if (aTokens.size === 0) continue;
                let inter = 0;
                for (const tk of qTokens) if (aTokens.has(tk)) inter++;
                const score = inter / Math.max(qTokens.size, aTokens.size);
                if (score >= 0.6 && (!bestOverlap || score > bestOverlap.score)) {
                    bestOverlap = { entry, score };
                }
            }
        }
        if (bestOverlap) return bestOverlap.entry;
    }
    return null;
}
