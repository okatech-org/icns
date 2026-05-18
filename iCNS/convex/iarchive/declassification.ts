// iArchive — Workflow de déclassification (Prompt 5.1, EF-06.4)

import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { appendAuditEntry } from "../audit";
import { requireAuth, requireAuthInQuery, requireRole } from "../auth/middleware";

export const requestDeclassification = mutation({
  args: {
    jwt: v.string(),
    archiveId: v.id("iarchive_dossiers"),
    motif: v.string(),
  },
  handler: async (ctx, args) => {
    const auth = await requireAuth(ctx, args.jwt);
    requireRole(auth, ["sg_cns", "rssi", "analyste_cns"]);
    if (args.motif.trim().length < 10)
      throw new Error("Motif de déclassification trop court.");
    const archive = await ctx.db.get(args.archiveId);
    if (!archive) throw new Error("Archive introuvable.");

    const reqId = await ctx.db.insert("iarchive_declassification_requests", {
      archiveId: args.archiveId,
      requestedByMatricule: auth.matricule,
      motif: args.motif,
      statut: "en_attente_commission",
    });

    await appendAuditEntry(ctx, {
      utilisateurMatricule: auth.matricule,
      serviceUtilisateur: auth.service,
      action: "DECLASSIFICATION_DEMANDEE",
      classificationDossier: archive.classification,
      cibleEntiteType: "iarchive_dossiers",
      cibleEntiteId: args.archiveId,
      detail: args.motif,
      adresseIP: auth.sessionDoc.adresseIPOuverture,
      poste: auth.sessionDoc.posteOuverture,
    });

    return { declassRequestId: reqId };
  },
});

export const sgApprouverDeclassification = mutation({
  args: {
    jwt: v.string(),
    declassRequestId: v.id("iarchive_declassification_requests"),
    decision: v.union(v.literal("approuver"), v.literal("rejeter")),
  },
  handler: async (ctx, args) => {
    const auth = await requireAuth(ctx, args.jwt);
    requireRole(auth, ["sg_cns"]);
    const r = await ctx.db.get(args.declassRequestId);
    if (!r) throw new Error("Demande introuvable.");
    if (r.statut !== "en_attente_commission")
      throw new Error(`Demande au statut ${r.statut} non décidable par le SG.`);

    await ctx.db.patch(args.declassRequestId, {
      statut: args.decision === "approuver" ? "approuvee_sg" : "rejetee",
      sgDecisionAt: Date.now(),
    });

    await appendAuditEntry(ctx, {
      utilisateurMatricule: auth.matricule,
      serviceUtilisateur: auth.service,
      action: `DECLASSIFICATION_${args.decision.toUpperCase()}_PAR_SG`,
      cibleEntiteType: "iarchive_declassification_requests",
      cibleEntiteId: args.declassRequestId,
      adresseIP: auth.sessionDoc.adresseIPOuverture,
      poste: auth.sessionDoc.posteOuverture,
    });
    return { statut: args.decision === "approuver" ? "approuvee_sg" : "rejetee" };
  },
});

export const executerVersementArchivesNationales = mutation({
  args: {
    jwt: v.string(),
    declassRequestId: v.id("iarchive_declassification_requests"),
    versementRef: v.string(),
  },
  handler: async (ctx, args) => {
    const auth = await requireAuth(ctx, args.jwt);
    requireRole(auth, ["admin_technique", "rssi"]);
    const r = await ctx.db.get(args.declassRequestId);
    if (!r) throw new Error("Demande introuvable.");
    if (r.statut !== "approuvee_sg")
      throw new Error(`Demande au statut ${r.statut} : versement impossible.`);

    const now = Date.now();
    await ctx.db.patch(args.declassRequestId, {
      statut: "executee",
      executeeAt: now,
      versementArchivesNationalesRef: args.versementRef,
    });
    await ctx.db.patch(r.archiveId, {
      declassifiedAt: now,
      declassifiedByMatricule: auth.matricule,
      versementArchivesNationalesAt: now,
    });

    await appendAuditEntry(ctx, {
      utilisateurMatricule: auth.matricule,
      serviceUtilisateur: auth.service,
      action: "DECLASSIFICATION_EXECUTEE",
      cibleEntiteType: "iarchive_dossiers",
      cibleEntiteId: r.archiveId,
      detail: `Versement Archives Nationales ref ${args.versementRef}`,
      adresseIP: auth.sessionDoc.adresseIPOuverture,
      poste: auth.sessionDoc.posteOuverture,
    });
    return { ok: true };
  },
});

export const listDeclassificationRequests = query({
  args: { jwt: v.string(), statut: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const auth = await requireAuthInQuery(ctx, args.jwt);
    requireRole(auth, ["sg_cns", "rssi", "auditeur", "admin_technique"]);
    return await ctx.db
      .query("iarchive_declassification_requests")
      .order("desc")
      .take(200);
  },
});

/** Accès auditeur en lecture seule sur mandat. */
export const auditorReadArchive = query({
  args: { jwt: v.string(), archiveId: v.id("iarchive_dossiers") },
  handler: async (ctx, args) => {
    const auth = await requireAuthInQuery(ctx, args.jwt);
    requireRole(auth, ["auditeur"]);
    const archive = await ctx.db.get(args.archiveId);
    if (!archive) return null;
    return {
      reference: archive.reference,
      classification: archive.classification,
      serviceProducteurCode: archive.serviceProducteurCode,
      archivedAt: archive.archivedAt,
      retentionEndAt: archive.retentionEndAt,
      piecesCount: archive.piecesCount,
      dossiersAuditEntries: archive.dossiersAuditEntries,
      // Contenu chiffré, pas exposé en clair sans mutation `requestDecryptForAudit`
      hashIntegrite: archive.hashIntegrite,
    };
  },
});
