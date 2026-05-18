// Mutation `authenticate` — flux carte agent + PIN + biométrie
// Référence : NTSAGUI/CNS/CDC/2026/001 §3.2 (ET-02.4) — Prompt 2.1
//
// Le PIN et la biométrie sont vérifiés localement sur le poste durci
// (jamais envoyés au serveur). Le serveur reçoit :
//   - le certificat de la carte agent (X.509 émis par la PKI souveraine) ;
//   - un challenge signé par la carte (preuve de possession).
//
// Le serveur vérifie la validité du certificat, la signature du challenge,
// puis émet un JWT de session de 15 minutes signé par le HSM (RS256 en
// prod, HS256 en dev — cf. `jwt.ts`).
//
// État dev : la validation X.509 et la vérification de signature de carte
// sont stubées. La structure du flux est complète et testable. Le
// branchement réel de la PKI souveraine + HSM est porté par les livrables
// de Phase 2 (intégration HSM en Prompt 2.2 et certificats PKI en M3).

import { mutation, query, type MutationCtx } from "../_generated/server";
import { v } from "convex/values";
import { appendAuditEntry } from "../audit";
import type { RoleICNSValue, ServiceCodeValue } from "../validators/classification";
import { generateSessionToken, signJWT } from "./jwt";

// ──────────────────────────────────────────────────────────────────────
// Constantes
// ──────────────────────────────────────────────────────────────────────

/** Durée d'une session JWT (ET-02.6). */
const SESSION_TTL_MS = 15 * 60 * 1000;

/** Fenêtre d'observation pour le compteur d'échecs. */
const FAILURE_WINDOW_MS = 30 * 60 * 1000;

/** Nombre d'échecs consécutifs déclenchant un verrouillage. */
const FAILURE_THRESHOLD = 5;

/** Durée du verrouillage automatique. */
const LOCK_DURATION_MS = 24 * 60 * 60 * 1000;

// ──────────────────────────────────────────────────────────────────────
// Validation du certificat — STUB DEV
// ──────────────────────────────────────────────────────────────────────

interface CertificatPayload {
  /** Matricule de l'utilisateur extrait du SAN ou du CN. */
  matricule: string;
  /** Numéro de série (pour traçabilité). */
  serialNumber: string;
  /** Issuer DN (PKI souveraine attendue). */
  issuer: string;
  /** Validité — millis epoch. */
  notBefore: number;
  notAfter: number;
}

interface ValidationCertResult {
  ok: boolean;
  matricule?: string;
  serialNumber: string;
  issuer: string;
  reason?:
    | "format_invalide"
    | "issuer_inattendu"
    | "expire"
    | "pas_encore_valide"
    | "revoque"
    | "signature_invalide";
}

/**
 * Valide un certificat X.509 contre la PKI souveraine.
 *
 * STUB DEV : se contente de vérifier la structure de l'objet et la
 * cohérence des dates. En prod, doit :
 *  - vérifier la signature du certificat contre la racine PKI souveraine ;
 *  - vérifier la non-révocation (CRL ou OCSP) ;
 *  - vérifier la conformité aux profils X.509 attendus.
 *
 * À brancher en Prompt 2.2 quand le service HSM expose la racine PKI.
 */
async function validerCertificat(cert: CertificatPayload, now: number): Promise<ValidationCertResult> {
  if (!cert.matricule || !cert.serialNumber || !cert.issuer) {
    return { ok: false, reason: "format_invalide", serialNumber: cert.serialNumber ?? "?", issuer: cert.issuer ?? "?" };
  }
  // En dev, on attend un issuer commençant par "CN=PKI_SOUVERAINE_DEV".
  if (!cert.issuer.startsWith("CN=PKI_SOUVERAINE")) {
    return { ok: false, reason: "issuer_inattendu", serialNumber: cert.serialNumber, issuer: cert.issuer };
  }
  if (now < cert.notBefore) {
    return { ok: false, reason: "pas_encore_valide", serialNumber: cert.serialNumber, issuer: cert.issuer };
  }
  if (now > cert.notAfter) {
    return { ok: false, reason: "expire", serialNumber: cert.serialNumber, issuer: cert.issuer };
  }
  return { ok: true, matricule: cert.matricule, serialNumber: cert.serialNumber, issuer: cert.issuer };
}

/**
 * Vérifie la signature du challenge serveur par la carte.
 *
 * STUB DEV : accepte une signature de la forme `MOCK-SIGN:<challenge>`.
 * En prod, vérifie la signature ECDSA/RSA-PSS produite par la puce contre
 * la clé publique du certificat.
 */
async function verifierChallengeSigne(
  challenge: string,
  challengeSigne: string,
): Promise<boolean> {
  // Stub minimal — à remplacer en Prompt 2.2 par crypto.subtle.verify avec
  // la clé publique extraite du certificat.
  return challengeSigne === `MOCK-SIGN:${challenge}`;
}

// ──────────────────────────────────────────────────────────────────────
// Mutations / queries
// ──────────────────────────────────────────────────────────────────────

/**
 * Émet un challenge cryptographique aléatoire que le client devra faire
 * signer par la carte agent avant d'invoquer `authenticate`.
 *
 * Le challenge n'est pas stocké côté serveur (stateless) : il est inclus
 * dans la requête d'`authenticate` qui le re-vérifie. C'est acceptable
 * tant que le challenge inclut un nonce + timestamp et que la durée de
 * validité est courte (< 1 min).
 */
export const issueChallenge = query({
  args: {},
  handler: async (_ctx) => {
    const nonce = generateSessionToken(); // 32 bytes base64url
    const issuedAt = Date.now();
    return {
      challenge: `${issuedAt}.${nonce}`,
      validityMs: 60_000, // 1 minute
    };
  },
});

/**
 * Mutation d'authentification — vérifie cert + challenge signé, ouvre
 * une session, retourne le JWT.
 *
 * Toutes les tentatives (succès ou échec) sont tracées dans `auth_attempts`
 * et dans le journal d'audit chaîné. Les échecs répétés déclenchent un
 * verrouillage de compte de 24h.
 */
export const authenticate = mutation({
  args: {
    certificat: v.object({
      matricule: v.string(),
      serialNumber: v.string(),
      issuer: v.string(),
      notBefore: v.number(),
      notAfter: v.number(),
    }),
    challenge: v.string(),
    challengeSigne: v.string(),
    adresseIP: v.string(),
    poste: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // ── Helper : tracer un échec + journal d'audit, puis throw ──
    const traceFailure = async (
      reason:
        | "certificat_inconnu"
        | "certificat_revoque"
        | "certificat_expire"
        | "signature_invalide"
        | "compte_verrouille"
        | "compte_inactif"
        | "autre",
      matricule: string | undefined,
    ): Promise<never> => {
      await ctx.db.insert("auth_attempts", {
        utilisateurMatricule: matricule,
        certificatSerialNumber: args.certificat.serialNumber,
        success: false,
        failureReason: reason,
        horodatage: now,
        adresseIP: args.adresseIP,
        poste: args.poste,
      });

      await appendAuditEntry(ctx, {
        utilisateurMatricule: matricule ?? "INCONNU",
        serviceUtilisateur: "B2", // placeholder pour un échec sans contexte service
        action: "AUTH_ECHEC",
        detail: `Échec d'authentification : ${reason} (cert ${args.certificat.serialNumber})`,
        adresseIP: args.adresseIP,
        poste: args.poste,
      });

      // Si on connaît le matricule, appliquer la règle des 5 échecs.
      if (matricule) {
        await peutEtreVerrouiller(ctx, matricule, now, args.adresseIP, args.poste);
      }

      // Réponse uniformisée — pas d'information utile pour l'attaquant.
      throw new Error("Authentification refusée.");
    };

    // ── 1. Vérifier le certificat ──
    const certCheck = await validerCertificat(args.certificat, now);
    if (!certCheck.ok || !certCheck.matricule) {
      const reason =
        certCheck.reason === "expire"
          ? "certificat_expire"
          : certCheck.reason === "revoque"
            ? "certificat_revoque"
            : "certificat_inconnu";
      return await traceFailure(reason, undefined);
    }

    // ── 2. Vérifier la fraîcheur du challenge ──
    const [issuedAtStr] = args.challenge.split(".");
    const issuedAt = Number.parseInt(issuedAtStr, 10);
    if (Number.isNaN(issuedAt) || now - issuedAt > 60_000) {
      return await traceFailure("signature_invalide", certCheck.matricule);
    }

    // ── 3. Vérifier la signature du challenge ──
    const sigOk = await verifierChallengeSigne(args.challenge, args.challengeSigne);
    if (!sigOk) {
      return await traceFailure("signature_invalide", certCheck.matricule);
    }

    // ── 4. Charger l'utilisateur en base ──
    const utilisateur = await ctx.db
      .query("utilisateurs")
      .withIndex("by_matricule", (q) => q.eq("matricule", certCheck.matricule!))
      .first();
    if (!utilisateur) {
      return await traceFailure("certificat_inconnu", certCheck.matricule);
    }
    if (!utilisateur.actif) {
      return await traceFailure("compte_inactif", utilisateur.matricule);
    }

    // ── 5. Vérifier qu'il n'est pas verrouillé ──
    const verrou = await ctx.db
      .query("account_locks")
      .withIndex("by_utilisateur_actif", (q) =>
        q.eq("utilisateurMatricule", utilisateur.matricule).gt("expiresAt", now),
      )
      .first();
    if (verrou && !verrou.unlockedAt) {
      return await traceFailure("compte_verrouille", utilisateur.matricule);
    }

    // ── 6. Charger le service ──
    const service = await ctx.db.get(utilisateur.serviceId);
    if (!service) {
      return await traceFailure("autre", utilisateur.matricule);
    }

    // ── 7. Tout est OK : créer la session ──
    const sessionToken = generateSessionToken();
    const expiresAt = now + SESSION_TTL_MS;
    await ctx.db.insert("sessions", {
      sessionToken,
      utilisateurMatricule: utilisateur.matricule,
      issuedAt: now,
      expiresAt,
      lastActivityAt: now,
      revoked: false,
      adresseIPOuverture: args.adresseIP,
      posteOuverture: args.poste,
      certificatSerialNumber: args.certificat.serialNumber,
      certificatIssuer: args.certificat.issuer,
    });

    // ── 8. Signer le JWT ──
    const jwt = await signJWT({
      sub: utilisateur.matricule,
      sid: sessionToken,
      iat: now,
      exp: expiresAt,
      role: utilisateur.role,
      svc: service.code,
    });

    // ── 9. Tracer le succès ──
    await ctx.db.insert("auth_attempts", {
      utilisateurMatricule: utilisateur.matricule,
      certificatSerialNumber: args.certificat.serialNumber,
      success: true,
      horodatage: now,
      adresseIP: args.adresseIP,
      poste: args.poste,
    });

    await appendAuditEntry(ctx, {
      utilisateurMatricule: utilisateur.matricule,
      serviceUtilisateur: service.code as ServiceCodeValue,
      action: "AUTH_SUCCES",
      detail: `Session ouverte (cert ${args.certificat.serialNumber}, exp ${new Date(expiresAt).toISOString()})`,
      adresseIP: args.adresseIP,
      poste: args.poste,
    });

    return {
      jwt,
      expiresAt,
      role: utilisateur.role as RoleICNSValue,
      service: service.code,
    };
  },
});

/**
 * Mutation de déconnexion — révoque la session associée à un JWT.
 *
 * Le JWT lui-même reste cryptographiquement valide jusqu'à expiration,
 * mais le middleware vérifie aussi la table `sessions` (`revoked` flag)
 * pour rejeter les sessions révoquées.
 */
export const logout = mutation({
  args: {
    sessionToken: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_sessionToken", (q) => q.eq("sessionToken", args.sessionToken))
      .first();
    if (!session) return { ok: true, alreadyClosed: true };
    if (session.revoked) return { ok: true, alreadyClosed: true };

    const now = Date.now();
    await ctx.db.patch(session._id, {
      revoked: true,
      revokedAt: now,
      revokedReason: args.reason ?? "logout",
    });

    await appendAuditEntry(ctx, {
      utilisateurMatricule: session.utilisateurMatricule,
      serviceUtilisateur: "B2", // sera enrichi en Prompt 2.2 via lookup utilisateur
      action: "AUTH_LOGOUT",
      detail: `Session révoquée (raison: ${args.reason ?? "logout"})`,
      adresseIP: session.adresseIPOuverture,
      poste: session.posteOuverture,
    });

    return { ok: true, alreadyClosed: false };
  },
});

// ──────────────────────────────────────────────────────────────────────
// Helpers internes
// ──────────────────────────────────────────────────────────────────────

/**
 * Si le matricule a accumulé 5 échecs ou plus dans la dernière fenêtre,
 * crée un verrou de 24h sur le compte (idempotent : pas de doublon de
 * verrou actif).
 */
async function peutEtreVerrouiller(
  ctx: MutationCtx,
  matricule: string,
  now: number,
  adresseIP: string,
  poste: string,
): Promise<void> {
  const since = now - FAILURE_WINDOW_MS;
  const recentFailures = await ctx.db
    .query("auth_attempts")
    .withIndex("by_utilisateur_horodatage", (q) =>
      q.eq("utilisateurMatricule", matricule).gte("horodatage", since),
    )
    .collect();

  const failures = recentFailures.filter((a) => !a.success).length;
  if (failures < FAILURE_THRESHOLD) return;

  // Idempotence : si un verrou actif existe déjà, on ne réécrit pas.
  const verrouActif = await ctx.db
    .query("account_locks")
    .withIndex("by_utilisateur_actif", (q) =>
      q.eq("utilisateurMatricule", matricule).gt("expiresAt", now),
    )
    .first();
  if (verrouActif && !verrouActif.unlockedAt) return;

  await ctx.db.insert("account_locks", {
    utilisateurMatricule: matricule,
    lockedAt: now,
    expiresAt: now + LOCK_DURATION_MS,
    reason: `${FAILURE_THRESHOLD}_echecs_consecutifs`,
  });

  await appendAuditEntry(ctx, {
    utilisateurMatricule: matricule,
    serviceUtilisateur: "B2",
    action: "COMPTE_VERROUILLE",
    detail: `Verrouillage automatique après ${failures} échecs en ${FAILURE_WINDOW_MS / 60000} min`,
    adresseIP,
    poste,
  });

  // TODO Phase 4 : déclencher une alerte vers le SG-CNS (iCom Flash).
}
