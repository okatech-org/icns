/**
 * IAstedProvider — Synchronise le singleton iAstedSoul avec :
 *   - la route courante (react-router)
 *   - le rôle iCNS effectif (priorité au JWT iCNS, fallback sur la route)
 *
 * À monter à l'intérieur du `<BrowserRouter>` pour `useLocation()`.
 */

import { useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { iAstedSoul, type IAstedRole } from '@/lib/iasted/soul';
import { useICNSAuth } from '@/auth/useICNSAuth';

interface IAstedProviderProps {
    children: ReactNode;
}

/**
 * Map du `role` string du store iCNS Auth → IAstedRole typé.
 * Aligné sur `MODULES_PAR_ROLE` de ICNSWorkspace.tsx.
 */
const ICNS_ROLE_MAP: Record<string, IAstedRole> = {
    sg_cns: 'sg_cns',
    directeur_service: 'directeur_service',
    analyste_cns: 'analyste_cns',
    officier_traitant: 'officier_traitant',
    chef_section: 'chef_section',
    rssi: 'rssi',
    auditeur: 'auditeur',
    admin_technique: 'admin_technique',
};

/** Fallback pour les pages héritées executif.ga (pas encore migrées). */
function legacyRoleFromPathname(pathname: string): IAstedRole {
    if (pathname.startsWith('/president-space')) return 'legacy_president';
    if (pathname.startsWith('/secretariat-general-space')) return 'legacy_director';
    if (pathname.startsWith('/dgss-space')) return 'legacy_director';
    if (pathname.startsWith('/admin-space') || pathname.startsWith('/admin-system-settings')) return 'legacy_admin';
    if (pathname.startsWith('/service-courriers-space')) return 'legacy_courrier';
    if (pathname.startsWith('/service-reception-space')) return 'legacy_reception';
    return 'anonymous';
}

export function IAstedProvider({ children }: IAstedProviderProps) {
    const location = useLocation();
    const icnsRole = useICNSAuth((s) => s.role);
    const isAuthenticated = useICNSAuth((s) => s.isAuthenticated);

    // Synchronise la route dans le soul.
    useEffect(() => {
        iAstedSoul.setPathname(location.pathname);
    }, [location.pathname]);

    // Synchronise le rôle.
    // 1. Si l'utilisateur est authentifié iCNS, on prend le rôle iCNS du JWT.
    // 2. Sinon, on retombe sur les rôles dérivés du pathname (espaces hérités).
    useEffect(() => {
        if (isAuthenticated && icnsRole && ICNS_ROLE_MAP[icnsRole]) {
            iAstedSoul.setRole(ICNS_ROLE_MAP[icnsRole]);
        } else {
            iAstedSoul.setRole(legacyRoleFromPathname(location.pathname));
        }
    }, [isAuthenticated, icnsRole, location.pathname]);

    return <>{children}</>;
}
