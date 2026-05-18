// Handlers internes appelés par les HTTP actions (Prompt 5.2)
// Référence : NTSAGUI/CNS/CDC/2026/001 §2.3

import { internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { signJWT, verifyJWT, generateSessionToken } from "../auth/jwt";
import { appendAuditEntry } from "../audit";

const PRESIDENCE_TOKEN_TTL_MS = 15 * 60 * 1000;

export const isAuthorized = internalQuery({
  args: { matricule: v.string(), certificatSerial: v.string() },
  handler: async (ctx, args) => {
    const auth = await ctx.db
      .query("api_presidentielle_autorisations")
      .withIndex("by_matricule", (q) => q.eq("matriculeAutorise", args.matricule))
      .first();
    if (!auth) return false;
    if (auth.revoqueeAt) return false;
    if (auth.certificatSerialNumber !== args.certificatSerial) return false;
    return true;
  },
});

export const issueToken = internalMutation({
  args: { matricule: v.string(), certificatSerial: v.string() },
  handler: async (_ctx, args) => {
    const now = Date.now();
    const sid = generateSessionToken();
    const jwt = await signJWT({
      sub: args.matricule,
      sid,
      iat: now,
      exp: now + PRESIDENCE_TOKEN_TTL_MS,
      role: "api_presidentielle",
      svc: "PRESIDENCE",
    });
    return { jwt, expiresAt: now + PRESIDENCE_TOKEN_TTL_MS };
  },
});

export const verifyToken = internalQuery({
  args: { token: v.string(), expectedMatricule: v.string() },
  handler: async (_ctx, args) => {
    try {
      const payload = await verifyJWT(args.token);
      if (payload.sub !== args.expectedMatricule)
        return { ok: false as const, reason: "matricule_mismatch" };
      if (payload.role !== "api_presidentielle")
        return { ok: false as const, reason: "wrong_role" };
      // TODO Prompt 5.2 final : signer la réponse avec une clé HSM
      // séparée pour permettre vérification côté client présidentielle.
      return { ok: true as const, responseSignature: "SIGN-RESPONSE-MOCK" };
    } catch (e) {
      return { ok: false as const, reason: (e as Error).message };
    }
  },
});

export const listSyntheses = internalQuery({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db
      .query("cns_syntheses")
      .withIndex("by_statut", (q) => q.eq("statut", "transmise_presidence"))
      .order("desc")
      .take(100);
    return all.map((s) => ({
      id: s._id,
      reference: s.reference,
      classification: s.classification,
      transmisePresidenceAt: s.transmisePresidenceAt,
      signeParSgAt: s.signeParSgAt,
      // Le contenu reste chiffré ; l'application présidentielle déchiffre
      // côté client via la DEK fournie par /syntheses/{id}.
    }));
  },
});

export const getSynthese = internalQuery({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    try {
      const syn = await ctx.db.get(args.id as any);
      if (!syn) return null;
      if (syn.statut !== "transmise_presidence") return null;
      return {
        id: syn._id,
        reference: syn.reference,
        classification: syn.classification,
        encryptedTitre: syn.encryptedTitre,
        encryptedCorps: syn.encryptedCorps,
        dossiersSources: syn.dossiersSources,
        signeParSgAt: syn.signeParSgAt,
        transmisePresidenceAt: syn.transmisePresidenceAt,
      };
    } catch {
      return null;
    }
  },
});

export const acknowledgeSynthese = internalMutation({
  args: { syntheseId: v.string(), matriculeAppelant: v.string() },
  handler: async (ctx, args) => {
    await appendAuditEntry(ctx, {
      utilisateurMatricule: args.matriculeAppelant,
      serviceUtilisateur: "B2", // PRESIDENCE — service code dédié non encore défini
      action: "API_PRESIDENTIELLE_ACK",
      cibleEntiteType: "cns_syntheses",
      cibleEntiteId: args.syntheseId,
      adresseIP: "via_api_presidentielle",
      poste: "PRESIDENCE",
    });
    return { ok: true };
  },
});

export const instructionPresidentielle = internalMutation({
  args: {
    syntheseId: v.string(),
    matriculeAppelant: v.string(),
    texte: v.string(),
  },
  handler: async (ctx, args) => {
    await appendAuditEntry(ctx, {
      utilisateurMatricule: args.matriculeAppelant,
      serviceUtilisateur: "B2",
      action: "API_PRESIDENTIELLE_INSTRUCTION",
      cibleEntiteType: "cns_syntheses",
      cibleEntiteId: args.syntheseId,
      detail: args.texte.slice(0, 200),
      adresseIP: "via_api_presidentielle",
      poste: "PRESIDENCE",
    });
    // TODO : créer une iCom de type "directive" depuis la Présidence
    // vers le SG-CNS en réutilisant convex/icom/create.ts.
    return { ok: true };
  },
});

export const logCall = internalMutation({
  args: {
    matricule: v.string(),
    certificatSerial: v.string(),
    endpoint: v.string(),
    statusCode: v.number(),
    adresseIP: v.string(),
    syntheseId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("api_presidentielle_logs", {
      matriculeAppelant: args.matricule,
      certificatSerialNumber: args.certificatSerial,
      endpoint: args.endpoint,
      syntheseId: args.syntheseId as any,
      statusCode: args.statusCode,
      horodatage: Date.now(),
      adresseIP: args.adresseIP,
    });
  },
});

// ──────────────────────────────────────────────────────────────────────
// Gestion des autorisations nominatives par le SG-CNS
// ──────────────────────────────────────────────────────────────────────

import { mutation } from "../_generated/server";
import { requireAuth, requireRole } from "../auth/middleware";

export const autoriserAccesPresidentiel = mutation({
  args: {
    jwt: v.string(),
    matriculeAutorise: v.string(),
    certificatSerialNumber: v.string(),
  },
  handler: async (ctx, args) => {
    const auth = await requireAuth(ctx, args.jwt);
    requireRole(auth, ["sg_cns"]);
    const id = await ctx.db.insert("api_presidentielle_autorisations", {
      matriculeAutorise: args.matriculeAutorise,
      certificatSerialNumber: args.certificatSerialNumber,
      accordeParMatricule: auth.matricule,
      accordeeAt: Date.now(),
    });
    await appendAuditEntry(ctx, {
      utilisateurMatricule: auth.matricule,
      serviceUtilisateur: auth.service,
      action: "API_PRESIDENTIELLE_AUTORISATION_OCTROYEE",
      cibleEntiteId: id,
      cibleEntiteType: "api_presidentielle_autorisations",
      detail: `Octroyée à ${args.matriculeAutorise} (cert ${args.certificatSerialNumber})`,
      adresseIP: auth.sessionDoc.adresseIPOuverture,
      poste: auth.sessionDoc.posteOuverture,
    });
    return { autorisationId: id };
  },
});

export const revoquerAccesPresidentiel = mutation({
  args: {
    jwt: v.string(),
    autorisationId: v.id("api_presidentielle_autorisations"),
    motif: v.string(),
  },
  handler: async (ctx, args) => {
    const auth = await requireAuth(ctx, args.jwt);
    requireRole(auth, ["sg_cns"]);
    await ctx.db.patch(args.autorisationId, {
      revoqueeAt: Date.now(),
      revoqueeMotif: args.motif,
    });
    await appendAuditEntry(ctx, {
      utilisateurMatricule: auth.matricule,
      serviceUtilisateur: auth.service,
      action: "API_PRESIDENTIELLE_AUTORISATION_REVOQUEE",
      cibleEntiteId: args.autorisationId,
      cibleEntiteType: "api_presidentielle_autorisations",
      detail: args.motif,
      adresseIP: auth.sessionDoc.adresseIPOuverture,
      poste: auth.sessionDoc.posteOuverture,
    });
    return { ok: true };
  },
});
