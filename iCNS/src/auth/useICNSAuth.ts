// Store d'authentification iCNS — Zustand (en mémoire uniquement)
// Référence : NTSAGUI/CNS/CDC/2026/001 §3.2 (ET-02.6, ET-02.7) — Prompt 2.1/3.3
//
// Contraintes :
//   - JWT et état d'auth uniquement EN MÉMOIRE (jamais localStorage/sessionStorage)
//   - Verrouillage automatique après 15 min d'inactivité
//   - Recharge la page = perte d'auth (volontaire — re-MFA obligatoire)

import { create } from "zustand";

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;

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
