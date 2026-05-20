// Dérive le Persona iCNS courant à partir de l'auth en mémoire.
//
// Le matricule est extrait du `sub` du JWT (déjà émis par
// `convex/auth/authenticate.ts`) — on ne touche donc pas à `useICNSAuth` :
// le persona est purement dérivé.
//
// Source de vérité : `ICNS_PERSONAS` (48 personas démo, classification,
// rôle, service…). Le hook renvoie `null` si l'utilisateur n'est pas
// authentifié ou si son matricule n'existe pas dans le catalogue.

import { useMemo } from "react";
import { useICNSAuth } from "./useICNSAuth";
import { ICNS_PERSONAS, type Persona } from "@/data/icns-personas";

function matriculeFromJwt(jwt: string | null): string | null {
  if (!jwt) return null;
  const parts = jwt.split(".");
  if (parts.length !== 3) return null;
  try {
    const payloadB64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payloadB64 + "===".slice((payloadB64.length + 3) % 4);
    const payload = JSON.parse(atob(padded));
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export function useCurrentPersona(): Persona | null {
  const jwt = useICNSAuth((s) => s.jwt);
  return useMemo(() => {
    const matricule = matriculeFromJwt(jwt);
    if (!matricule) return null;
    return ICNS_PERSONAS.find((p) => p.matricule === matricule) ?? null;
  }, [jwt]);
}

/** Variante non-React : utilisable depuis un store ou un service. */
export function getCurrentPersona(jwt: string | null): Persona | null {
  const matricule = matriculeFromJwt(jwt);
  if (!matricule) return null;
  return ICNS_PERSONAS.find((p) => p.matricule === matricule) ?? null;
}
