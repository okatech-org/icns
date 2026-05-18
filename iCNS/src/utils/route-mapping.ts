/**
 * Route Mapping for Super Admin Navigation Intelligence
 * Maps natural language queries to actual application routes
 */

export interface RouteInfo {
    path: string;
    aliases: string[];
    role?: string;
    description: string;
}

export const ROUTE_MAP: RouteInfo[] = [
    {
        path: '/',
        aliases: ['accueil', 'home', 'page d\'accueil', 'dashboard', 'tableau de bord', 'démarrage', 'start'],
        description: 'Page d\'accueil / Dashboard principal'
    },
    {
        path: '/president-space',
        aliases: ['président', 'president', 'espace président', 'espace présidentiel', 'presidence'],
        role: 'president',
        description: 'Espace du Président de la République'
    },
    {
        path: '/admin-space',
        aliases: ['admin', 'administration', 'administrateur', 'espace admin', 'système', 'god mode', 'base'],
        role: 'admin',
        description: 'Espace Administration Système (Super Admin)'
    },
    {
        path: '/cabinet-director-space',
        aliases: ['cabinet', 'directeur cabinet', 'dgr', 'coordination'],
        role: 'dgr',
        description: 'Espace Directeur de Cabinet'
    },
    {
        path: '/private-cabinet-space',
        aliases: ['cabinet privé', 'privé', 'cabinet prive', 'affaires privées'],
        role: 'cabinet_private',
        description: 'Espace Cabinet Privé du Président'
    },
    {
        path: '/secretariat-general-space',
        aliases: ['secrétariat', 'secretariat', 'sec gen', 'secrétaire général'],
        role: 'sec_gen',
        description: 'Espace Secrétariat Général'
    },
    {
        path: '/dgss-space',
        aliases: ['dgss', 'renseignement', 'sécurité', 'securite', 'contre-espionnage'],
        role: 'dgss',
        description: 'Espace DGSS - Renseignement'
    },
    {
        path: '/protocol-director-space',
        aliases: ['protocole', 'protocol', 'directeur protocole', 'événements', 'evenements'],
        role: 'protocol',
        description: 'Espace Directeur du Protocole'
    },
    {
        path: '/service-reception-space',
        aliases: [
            'service reception',
            'réception',
            'reception',
            'accueil',
            'espace réception',
            'espace reception',
            'service accueil',
            'espace accueil',
            'réceptionniste',
            'receptionniste'
        ],
        role: 'receptionniste',
        description: 'Service Réception et Accueil'
    },
    {
        path: '/service-courriers-space',
        aliases: [
            'service courriers',
            'courriers',
            'courrier',
            'espace courriers',
            'espace courrier',
            'gestion courrier',
            'gestion courriers',
            'service du courrier',
            'messagerie',
            'correspondance'
        ],
        role: 'service_courriers',
        description: 'Service Courriers et Correspondance'
    },
    {
        path: '/auth',
        aliases: ['connexion', 'login', 'authentification', 'auth', 'se connecter'],
        description: 'Page de connexion'
    },
    {
        path: '/demo',
        aliases: ['demo', 'démo', 'démonstration', 'page demo', 'page démo', 'essai'],
        description: 'Page de démonstration'
    }
];

/**
 * Resolve a natural language query to an actual route
 * Uses fuzzy matching on aliases
 */
export function resolveRoute(query: string): string | null {
    const normalizedQuery = query.toLowerCase().trim();

    // Exact path match first
    const exactMatch = ROUTE_MAP.find(route => route.path === normalizedQuery);
    if (exactMatch) return exactMatch.path;

    // Alias matching
    for (const route of ROUTE_MAP) {
        for (const alias of route.aliases) {
            if (normalizedQuery.includes(alias) || alias.includes(normalizedQuery)) {
                return route.path;
            }
        }
    }

    // Fuzzy matching on description
    const fuzzyMatch = ROUTE_MAP.find(route =>
        route.description.toLowerCase().includes(normalizedQuery) ||
        normalizedQuery.includes(route.description.toLowerCase())
    );

    return fuzzyMatch ? fuzzyMatch.path : null;
}

/**
 * Get route information for system prompt
 */
export function getRouteKnowledgePrompt(): string {
    const routeList = ROUTE_MAP.map(route =>
        `- **${route.path}** : ${route.description}\n  Aliases: ${route.aliases.join(', ')}`
    ).join('\n');

    return `# CARTOGRAPHIE DES ROUTES DISPONIBLES\n${routeList}\n\nIMPORTANT: Utilise TOUJOURS ces chemins exacts. Si l'utilisateur demande "page d'accueil" ou "home", utilise "/" et NON "/home".`;
}
