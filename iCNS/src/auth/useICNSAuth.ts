// Store d'authentification iCNS — Zustand (en mémoire uniquement)
// Référence : NTSAGUI/CNS/CDC/2026/001 §3.2 (ET-02.6, ET-02.7) — Prompt 2.1/3.3
//
// Contraintes :
//   - JWT et état d'auth uniquement EN MÉMOIRE (jamais localStorage/sessionStorage)
//   - Verrouillage automatique après 15 min d'inactivité
//   - Recharge la page = perte d'auth (volontaire — re-MFA obligatoire)

import { create } from "zustand";

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;

// Un JWT compact valide a 3 segments séparés par '.' (header.payload.signature).
// Cette vérification ne valide pas la signature — seulement le format brut —
// pour rejeter immédiatement les valeurs corrompues qui feraient échouer
// systématiquement toute query Convex authentifiée.
function isJwtShaped(s: unknown): s is string {
  if (typeof s !== "string") return false;
  const parts = s.split(".");
  if (parts.length !== 3) return false;
  return parts.every((p) => p.length > 0);
}

export interface ICNSAuthState {
  jwt: string | null;
  expiresAt: number | null;
  role: string | null;
  service: string | null;
  lastActivityAt: number | null;
  isAuthenticated: boolean;

  // Actions
  setAuth: (auth: {
    jwt: string;
    expiresAt: number;
    role: string;
    service: string;
  }) => void;
  clearAuth: (reason?: string) => void;
  touch: () => void;
  isExpired: () => boolean;
  isInactive: () => boolean;
}

export const useICNSAuth = create<ICNSAuthState>((set, get) => ({
  jwt: null,
  expiresAt: null,
  role: null,
  service: null,
  lastActivityAt: null,
  isAuthenticated: false,

  setAuth: (auth) => {
    if (!isJwtShaped(auth.jwt)) {
      // Refuse explicitement les JWT mal formés pour éviter qu'une session
      // corrompue ne parvienne au backend (où elle ferait échouer toutes les
      // queries authentifiées avec « Header JWT illisible »).
      console.error("[useICNSAuth] setAuth refusé : JWT mal formé.");
      return;
    }
    const now = Date.now();
    set({
      jwt: auth.jwt,
      expiresAt: auth.expiresAt,
      role: auth.role,
      service: auth.service,
      lastActivityAt: now,
      isAuthenticated: true,
    });
  },

  clearAuth: () => {
    set({
      jwt: null,
      expiresAt: null,
      role: null,
      service: null,
      lastActivityAt: null,
      isAuthenticated: false,
    });
  },

  touch: () => {
    set({ lastActivityAt: Date.now() });
  },

  isExpired: () => {
    const exp = get().expiresAt;
    return exp === null ? true : Date.now() >= exp;
  },

  isInactive: () => {
    const last = get().lastActivityAt;
    return last === null
      ? true
      : Date.now() - last > INACTIVITY_TIMEOUT_MS;
  },
}));

/**
 * Hook utilitaire : démarre un watcher qui vérifie l'expiration et
 * l'inactivité toutes les 30 secondes et déclenche `clearAuth` au besoin.
 * À monter une seule fois (ex. dans App.tsx).
 */
export function useAuthWatchdog(onExpired?: (reason: string) => void): void {
  if (typeof window === "undefined") return;
  const store = useICNSAuth.getState();
  if (!store.isAuthenticated) return;

  const id = window.setInterval(() => {
    const s = useICNSAuth.getState();
    if (!s.isAuthenticated) {
      window.clearInterval(id);
      return;
    }
    if (s.isExpired()) {
      s.clearAuth("jwt_expired");
      onExpired?.("jwt_expired");
      window.clearInterval(id);
    } else if (s.isInactive()) {
      s.clearAuth("inactivity_15min");
      onExpired?.("inactivity_15min");
      window.clearInterval(id);
    }
  }, 30_000);
}
