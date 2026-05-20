/**
 * iAstedSpatialAwareness — Conscience spatiale.
 *
 * iCNS-first : la majorité des routes décrites ici sont les routes iCNS
 * (carte agent + PIN + biométrie → /icns/workspace avec hub modulaire par rôle).
 * Les routes héritées du fork executif.ga (espace Président, Secrétariat
 * Général en mode legacy, etc.) sont conservées en bas, marquées `legacy`,
 * pour ne pas casser les espaces existants pendant la transition.
 *
 * Source : src/pages/icns/ICNSWorkspace.tsx (MODULE_META + MODULES_PAR_ROLE).
 */

export interface PageContext {
    module: string;
    /** Titre humain pour la confirmation vocale. */
    label: string;
    /** Verbes d'action proposables. */
    capabilities: string[];
    /** Phrases courtes suggérées à l'utilisateur. */
    suggestions: string[];
    /** Quand true, route héritée du fork executif.ga, à terme dépréciée. */
    legacy?: boolean;
}

// ─── Routes iCNS (Phase 3+) ────────────────────────────────────────────
const ICNS_ROUTES: Record<string, PageContext> = {
    '/': {
        module: 'Accueil iCNS',
        label: "l'accueil de la plateforme iCNS",
        capabilities: ['vous présenter iCNS', 'vous diriger vers la connexion sécurisée'],
        suggestions: ["Présente-moi iCNS", "Connecte-moi en mode sécurisé"],
    },
    '/icns/login': {
        module: 'Login iCNS sécurisé',
        label: "l'écran de connexion sécurisée iCNS",
        capabilities: [
            "rappeler les trois facteurs : carte agent, code PIN et biométrie",
            "expliquer pourquoi le poste est durci",
        ],
        suggestions: ["Quels facteurs d'authentification sont requis ?"],
    },
    '/icns/workspace': {
        module: 'Workspace iCNS',
        label: "le workspace iCNS",
        capabilities: [
            'ouvrir un dossier de renseignement',
            'consulter les synthèses inter-services',
            'transmettre un dossier',
            'changer de module',
            'consulter le journal d\'audit',
        ],
        suggestions: [
            "Ouvre mes dossiers",
            "Affiche le cockpit SG-CNS",
            "Va à la cellule CNS",
        ],
    },
    '/idocument': {
        module: 'iDocument',
        label: "le module iDocument",
        capabilities: [
            'parcourir les dossiers de renseignement',
            'consulter une pièce',
            'téléverser un document',
            'gérer les classifications DR à TSD',
        ],
        suggestions: ["Liste les pièces récentes", "Cherche un dossier", "Crée un nouveau document"],
    },
    '/icorrespondance': {
        module: 'iCorrespondance',
        label: "le module iCorrespondance",
        capabilities: [
            'créer un courrier officiel',
            'suivre le workflow d\'approbation',
            'archiver une correspondance clôturée',
        ],
        suggestions: ["Crée une correspondance", "Affiche les approbations en attente"],
    },
    '/iarchive': {
        module: 'iArchive',
        label: "le module iArchive",
        capabilities: [
            'rechercher dans les archives',
            'consulter la durée de rétention',
            'gérer une déclassification',
        ],
        suggestions: ["Cherche dans les archives", "Affiche les dossiers à déclassifier"],
    },
};

// ─── Espaces hérités (executif.ga fork — à terme migrer vers /icns/workspace) ─
const LEGACY_ROUTES: Record<string, PageContext> = {
    '/auth': {
        module: 'Connexion (legacy)',
        label: "la page de connexion héritée",
        capabilities: ['expliquer la migration vers la connexion iCNS sécurisée'],
        suggestions: ["Va à la connexion sécurisée iCNS"],
        legacy: true,
    },
    '/demo': {
        module: 'Démonstration',
        label: "la page de démonstration des personas iCNS",
        capabilities: ['lister les personas démo', 'expliquer le flux MFA iCNS'],
        suggestions: ["Liste les personas", "Va à la connexion sécurisée"],
    },
    '/president-space': {
        module: 'Espace Président (legacy)',
        label: "l'espace Président hérité",
        capabilities: [
            'consulter le tableau de bord présidentiel',
            'ouvrir les décrets et nominations',
            'générer des documents officiels',
        ],
        suggestions: ["Va au tableau de bord", "Ouvre les décrets"],
        legacy: true,
    },
    '/secretariat-general-space': {
        module: 'Secrétariat Général (legacy)',
        label: "l'espace Secrétariat Général hérité",
        capabilities: ['coordonner les services', 'consulter les synthèses'],
        suggestions: ["Affiche les synthèses", "Va au workspace iCNS"],
        legacy: true,
    },
    '/service-courriers-space': {
        module: 'Service Courriers (legacy)',
        label: "le service Courriers hérité",
        capabilities: ['traiter les courriers entrants', 'archiver'],
        suggestions: ["Affiche les courriers en attente"],
        legacy: true,
    },
    '/service-reception-space': {
        module: 'Service Réception (legacy)',
        label: "le service Réception hérité",
        capabilities: ["enregistrer les visites"],
        suggestions: ["Liste les visites du jour"],
        legacy: true,
    },
    '/dgss-space': {
        module: 'DGSS (legacy)',
        label: "l'espace DGSS hérité",
        capabilities: ['consulter les alertes opérationnelles'],
        suggestions: ["Va au workspace iCNS"],
        legacy: true,
    },
    '/admin-space': {
        module: 'Administration (legacy)',
        label: "l'espace administration hérité",
        capabilities: ['gérer les utilisateurs', 'configurer les modules', 'consulter l\'audit'],
        suggestions: ["Va au workspace iCNS", "Affiche l'audit"],
        legacy: true,
    },
    '/admin-system-settings': {
        module: 'Paramètres Système',
        label: "les paramètres système",
        capabilities: ['ajuster les paramètres globaux'],
        suggestions: ["Que peux-tu changer ici ?"],
        legacy: true,
    },
    '/document-generator': {
        module: 'Générateur de documents',
        label: "le générateur de documents",
        capabilities: ['générer une lettre, un décret, une note ou une nomination'],
        suggestions: ["Génère une lettre", "Génère un décret"],
    },
    '/dashboard': {
        module: 'Tableau de bord',
        label: "votre tableau de bord",
        capabilities: ['consulter vos indicateurs', 'voir vos notifications'],
        suggestions: ["Que vois-tu ici ?"],
    },
    '/profile': {
        module: 'Profil',
        label: "votre profil",
        capabilities: ['modifier votre identité', 'changer votre mot de passe'],
        suggestions: ["Modifie mon nom"],
    },
    '/settings': {
        module: 'Paramètres',
        label: "les paramètres",
        capabilities: ['ajuster les préférences', 'gérer les notifications'],
        suggestions: ["Active le mode sombre"],
    },
};

const ALL_ROUTES: Record<string, PageContext> = { ...ICNS_ROUTES, ...LEGACY_ROUTES };

const DEFAULT_CONTEXT: PageContext = {
    module: 'Général',
    label: "cette page",
    capabilities: ['vous orienter dans la plateforme iCNS'],
    suggestions: ["Présente-moi iCNS", "Va au workspace iCNS"],
};

export function getPageContext(pathname: string): PageContext {
    if (ALL_ROUTES[pathname]) return ALL_ROUTES[pathname];
    // Préfixe (ex: /icns/workspace/dossier/abc)
    const prefixed = Object.entries(ALL_ROUTES).find(
        ([key]) => key !== '/' && pathname.startsWith(key),
    );
    if (prefixed) return prefixed[1];
    return DEFAULT_CONTEXT;
}

export function getPageSuggestions(pathname: string): string[] {
    return getPageContext(pathname).suggestions;
}

export function isLegacyRoute(pathname: string): boolean {
    return getPageContext(pathname).legacy === true;
}
