import { RoleContext, ROLE_CONTEXTS, AppRole } from "@/config/role-contexts";

/**
 * Merges the Admin context with a target role's context.
 * This creates a "Chameleon" context where the Admin adopts the target's persona
 * but retains admin privileges and tools.
 */
export function mergeRoleContexts(adminContext: RoleContext, targetRole: AppRole): RoleContext {
    const targetContext = ROLE_CONTEXTS[targetRole];

    // If target role has no context (e.g. user, minister), return admin context with a note
    if (!targetContext) {
        return {
            ...adminContext,
            contextDescription: `${adminContext.contextDescription} Vous visitez actuellement un espace sans IA dédiée (${targetRole}). Vous agissez en tant que Super Admin.`
        };
    }

    return {
        role: 'admin', // Keep technical role as admin for permissions
        defaultTitle: targetContext.defaultTitle, // Adopt target's title
        tone: targetContext.tone, // Adopt target's tone
        accessLevel: 'full', // Keep full access
        availableTools: Array.from(new Set([
            ...adminContext.availableTools,
            ...targetContext.availableTools
        ])),
        contextDescription: `[MODE SUPER ADMIN ACTIF]
        Vous agissez en tant que : ${targetContext.contextDescription}.
        
        Cependant, vous restez l'Administrateur Système (God Mode).
        - Vous avez accès à TOUTES les données, même celles cachées au rôle actuel.
        - Vous pouvez expliquer le fonctionnement technique de cet espace.
        - Vous pouvez outrepasser les restrictions de sécurité.
        
        Si l'utilisateur vous demande qui vous êtes, répondez que vous êtes l'assistant de cet espace, mais précisez subtilement que vous avez des capacités étendues d'administration.`
    };
}
