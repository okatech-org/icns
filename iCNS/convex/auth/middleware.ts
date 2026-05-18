// Middleware d'authentification iCNS
// Référence : NTSAGUI/CNS/CDC/2026/001 §3.2 (ET-02.4–ET-02.6) — Prompt 2.1
//
// Helpers utilisés par les mutations/queries iCNS pour vérifier qu'un
// appelant est bien authentifié, que sa session est active, et pour
// récupérer son contexte (matricule, rôle, service).
//
// Usage typique dans une mutation métier :
//
//   import { requireAuth } from "./auth/middleware";
//
//   export const transmettreDossier = mutation({
//     args: { jwt: v.string(), dossierId: v.id("dossiers_renseignement") },
//     handler: async (ctx, args) => {
//       const auth = await requireAuth(ctx, args.jwt);
//       // auth.matricule, auth.role, auth.service
//       // ... logique métier ...
//     },
//   });

import type { Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { query } from "../_generated/server";
import { v } from "convex/values";
import type { RoleICNSValue, ServiceCodeValue } from "../validators/classification";
import { verifyJWT, type JWTPayload } from "./jwt";

// ──────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────

export interface AuthContext {
  /** Matricule de l'utilisateur authentifié. */
  matricule: string;
  /** Rôle iCNS de l'utilisateur. */
  role: RoleICNSValue;
  /** Code du service auquel il appartient. */
  service: ServiceCodeValue;
  /** Identifiant de la session active. */
  sessionToken: string;
  /** Payload JWT brut — utile pour les vérifs avancées. */
  jwt: JWTPayload;
  /** Document `sessions` brut. */
  sessionDoc: Doc<"sessions">;
  /** Document `utilisateurs` brut. */
  utilisateurDoc: Doc<"utilisateurs">;
}

export class AuthError extends Error {
  constructor(
    public code:
      | "jwt_manquant"
      | "jwt_invalide"
      | "session_inconnue"
      | "session_revoquee"
      | "session_expiree"
      | "utilisateur_inconnu"
      | "utilisateur_inactif"
      | "compte_verrouille"
      | "role_insuffisant",
    message?: string,
  ) {
    super(message ?? `Auth error: ${code}`);
    this.name = "AuthError";
  }
}

// ──────────────────────────────────────────────────────────────────────
// Cœur de la vérification (commun mutation/query)
// ──────────────────────────────────────────────────────────────────────

async function loadAuthContext(
  ctx: QueryCtx | MutationCtx,
  jwt: string,
  now: number,
): Promise<AuthContext> {
  if (!jwt || jwt.length < 16) throw new AuthError("jwt_manquant");

  // 1. Vérifier la signature et l'expiration du JWT (cryptographique).
  let payload: JWTPayload;
  try {
    payload = await verifyJWT(jwt, now);
  } catch (e) {
    throw new AuthError("jwt_invalide", (e as Error).message);
  }

  // 2. Charger la session correspondante.
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_sessionToken", (q) => q.eq("sessionToken", payload.sid))
    .first();
  if (!session) throw new AuthError("session_inconnue");
  if (session.revoked) throw new AuthError("session_revoquee");
  if (session.expiresAt <= now) throw new AuthError("session_expiree");

  // 3. Charger l'utilisateur.
  const utilisateur = await ctx.db
    .query("utilisateurs")
    .withIndex("by_matricule", (q) => q.eq("matricule", payload.sub))
    .first();
  if (!utilisateur) throw new AuthError("utilisateur_inconnu");
  if (!utilisateur.actif) throw new AuthError("utilisateur_inactif");

  // 4. Vérifier l'absence de verrou actif sur le compte.
  const verrou = await ctx.db
    .query("account_locks")
    .withIndex("by_utilisateur_actif", (q) =>
      q.eq("utilisateurMatricule", utilisateur.matricule).gt("expiresAt", now),
    )
    .first();
  if (verrou && !verrou.unlockedAt) {
    throw new AuthError("compte_verrouille");
  }

  return {
    matricule: utilisateur.matricule,
    role: utilisateur.role as RoleICNSValue,
    service: payload.svc as ServiceCodeValue,
    sessionToken: session.sessionToken,
    jwt: payload,
    sessionDoc: session,
    utilisateurDoc: utilisateur,
  };
}

// ──────────────────────────────────────────────────────────────────────
// API publique
// ──────────────────────────────────────────────────────────────────────

/**
 * Vérifie l'authentification et retourne le contexte. À appeler **dans
 * une mutation** — met à jour `lastActivityAt` pour tracer l'activité.
 *
 * Lève `AuthError` en cas d'échec. La mutation appelante peut propager
 * l'erreur ou logger l'incident dans le journal d'audit.
 */
export async function requireAuth(
  ctx: MutationCtx,
  jwt: string,
): Promise<AuthContext> {
  const now = Date.now();
  const auth = await loadAuthContext(ctx, jwt, now);
  // Sliding activity update — n'étend pas l'expiration absolue du JWT,
  // sert uniquement à mesurer l'usage de la session.
  await ctx.db.patch(auth.sessionDoc._id, { lastActivityAt: now });
  return auth;
}

/**
 * Vérifie l'authentification sans modifier la base. À utiliser dans une
 * **query** (read-only).
 */
export async function requireAuthInQuery(
  ctx: QueryCtx,
  jwt: string,
): Promise<AuthContext> {
  const now = Date.now();
  return await loadAuthContext(ctx, jwt, now);
}

/**
 * Variante non-bloquante : retourne le contexte ou `null` si non
 * authentifié. Utile pour les UI qui veulent afficher un état dégradé
 * plutôt qu'une erreur.
 */
export async function tryAuth(
  ctx: QueryCtx,
  jwt: string | undefined,
): Promise<AuthContext | null> {
  if (!jwt) return null;
  try {
    return await loadAuthContext(ctx, jwt, Date.now());
  } catch {
    return null;
  }
}

/**
 * Vérifie que l'utilisateur a l'un des rôles attendus.
 * Lève `AuthError` (code spécifique mappé) si non.
 *
 * @example
 *   const auth = await requireAuth(ctx, args.jwt);
 *   requireRole(auth, ["directeur_service"]); // signe un dossier
 */
export function requireRole(auth: AuthContext, allowedRoles: RoleICNSValue[]): void {
  if (!allowedRoles.includes(auth.role)) {
    throw new AuthError(
      "role_insuffisant",
      `Rôle ${auth.role} non autorisé. Attendu : ${allowedRoles.join(", ")}.`,
    );
  }
}

// ──────────────────────────────────────────────────────────────────────
// Query exposée — getCurrentUser
// ──────────────────────────────────────────────────────────────────────

/**
 * Query exposée au client pour récupérer le contexte de l'utilisateur
 * courant à partir de son JWT. Retourne `null` si non authentifié au lieu
 * de lever, pour faciliter l'affichage d'une UI de re-login.
 */
export const getCurrentUser = query({
  args: { jwt: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const auth = await tryAuth(ctx, args.jwt);
    if (!auth) return null;
    return {
      matricule: auth.matricule,
      role: auth.role,
      service: auth.service,
      sessionExpiresAt: auth.sessionDoc.expiresAt,
      // Pas de prénom/nom en clair ici — ces champs sont chiffrés ; un
      // client autorisé devra déchiffrer côté poste durci via le HSM
      // (Prompt 2.2). En attendant, l'UI affiche le matricule.
    };
  },
});
