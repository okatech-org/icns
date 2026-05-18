// Cellule CNS — Production et signature de synthèses (Prompt 4.2/4.3)
// Référence : NTSAGUI/CNS/CDC/2026/001 §2.2 (EF-02.5, EF-02.6)

import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { appendAuditEntry } from "../audit";
import { requireAuth, requireAuthInQuery, requireRole } from "../auth/middleware";
import { encrypt } from "../crypto/service";
import { classificationValidator } from "../validators/classification";

async function generateRefSynthese(
  ctx: { db: any },
  year: number,
  classification: string,
): Promise<string> {
  const all = await ctx.db.query("cns_syntheses").order("desc").take(2000);
  const prefix = `SYN/${year}/CNS/${classification}/`;
  const sameYear = (all as Array<{ reference: string }>).filter((s) =>
    s.reference.startsWith(prefix),
  );
  return `${prefix}${String(sameYear.length + 1).padStart(4, "0")}`;
}

export const creerSynthese = mutation({
  args: {
    jwt: v.string(),
    classification: classificationValidator,
    titre: v.string(),
    corps: v.string(),
    dossiersSourcesIds: v.array(v.id("dossiers_renseignement")),
    extraitsParDossier: v.optional(v.array(v.string())), // mêmes index que dossiersSourcesIds
    convergenceId: v.optional(v.id("cns_convergences")),
  },
  handler: async (ctx, args) => {
    const auth = await requireAuth(ctx, args.jwt);
    requireRole(auth, ["analyste_cns", "sg_cns"]);

    const year = new Date().getFullYear();
    const reference = await generateRefSynthese(ctx, year, args.classification);
    const contextKey = `synthese:${reference}`;

    const encryptedTitre = await encrypt(args.titre, contextKey);
    const encryptedCorps = await encrypt(args.corps, contextKey);

    const dossiersSources = await Promise.all(
      args.dossiersSourcesIds.map(async (id, idx) => {
        const extrait = args.extraitsParDossier?.[idx];
        return {
          dossierId: id,
          extraitChiffre: extrait
            ? await encrypt(extrait, `${contextKey}:extrait:${id}`)
            : undefined,
        };
      }),
    );

    const synId = await ctx.db.insert("cns_syntheses", {
      reference,
      classification: args.classification,
      encryptedTitre,
      encryptedCorps,
      dossiersSources,
      convergenceId: args.convergenceId,
      statut: "brouillon",
      redacteurMatricule: auth.matricule,
      creeeAt: Date.now(),
    });

    if (args.convergenceId) {
      await ctx.db.patch(args.convergenceId, { statut: "synthese_emise" });
    }

    await appendAuditEntry(ctx, {
      utilisateurMatricule: auth.matricule,
      serviceUtilisateur: auth.service,
      action: "SYNTHESE_CREEE",
      classificationDossier: args.classification,
      cibleEntiteType: "cns_syntheses",
      cibleEntiteId: synId,
      detail: `${reference} (${args.dossiersSourcesIds.length} sources)`,
      adresseIP: auth.sessionDoc.adresseIPOuverture,
      poste: auth.sessionDoc.posteOuverture,
    });

    return { syntheseId: synId, reference };
  },
});

export const proposerSyntheseAuSg = mutation({
  args: { jwt: v.string(), syntheseId: v.id("cns_syntheses") },
  handler: async (ctx, args) => {
    const auth = await requireAuth(ctx, args.jwt);
    requireRole(auth, ["analyste_cns"]);
    const s = await ctx.db.get(args.syntheseId);
    if (!s) throw new Error("Synthèse introuvable.");
    if (s.statut !== "brouillon")
      throw new Error(`Statut actuel ${s.statut} : impossible de proposer.`);
    await ctx.db.patch(args.syntheseId, {
      statut: "propose_au_sg",
      proposeeAt: Date.now(),
    });
    await appendAuditEntry(ctx, {
      utilisateurMatricule: auth.matricule,
      serviceUtilisateur: auth.service,
      action: "SYNTHESE_PROPOSEE",
      cibleEntiteType: "cns_syntheses",
      cibleEntiteId: args.syntheseId,
      adresseIP: auth.sessionDoc.adresseIPOuverture,
      poste: auth.sessionDoc.posteOuverture,
    });
    return { ok: true };
  },
});

export const signerSynthese = mutation({
  args: {
    jwt: v.string(),
    syntheseId: v.id("cns_syntheses"),
    signatureBlob: v.string(),
    transmettreAPresidence: v.boolean(),
  },
  handler: async (ctx, args) => {
    const auth = await requireAuth(ctx, args.jwt);
    requireRole(auth, ["sg_cns"]);
    const s = await ctx.db.get(args.syntheseId);
    if (!s) throw new Error("Synthèse introuvable.");
    if (s.statut !== "propose_au_sg" && s.statut !== "brouillon")
      throw new Error(`Statut ${s.statut} non signable.`);
    if (args.signatureBlob.length < 16)
      throw new Error("Signature qualifiée requise.");

    const now = Date.now();
    await ctx.db.patch(args.syntheseId, {
      statut: args.transmettreAPresidence ? "transmise_presidence" : "signee_par_sg",
      signeParSgAt: now,
      signatureSgBlob: args.signatureBlob,
      transmisePresidenceAt: args.transmettreAPresidence ? now : undefined,
    });
    await appendAuditEntry(ctx, {
      utilisateurMatricule: auth.matricule,
      serviceUtilisateur: auth.service,
      action: args.transmettreAPresidence
        ? "SYNTHESE_SIGNEE_TRANSMISE_PRESIDENCE"
        : "SYNTHESE_SIGNEE",
      classificationDossier: s.classification,
      cibleEntiteType: "cns_syntheses",
      cibleEntiteId: args.syntheseId,
      adresseIP: auth.sessionDoc.adresseIPOuverture,
      poste: auth.sessionDoc.posteOuverture,
    });
    return { ok: true };
  },
});

export const classerSyntheseSansSuite = mutation({
  args: {
    jwt: v.string(),
    syntheseId: v.id("cns_syntheses"),
    motif: v.string(),
  },
  handler: async (ctx, args) => {
    const auth = await requireAuth(ctx, args.jwt);
    requireRole(auth, ["sg_cns"]);
    const s = await ctx.db.get(args.syntheseId);
    if (!s) throw new Error("Synthèse introuvable.");
    if (args.motif.trim().length < 5)
      throw new Error("Motif de classement obligatoire (≥ 5 caractères).");
    const now = Date.now();
    await ctx.db.patch(args.syntheseId, {
      statut: "classee_sans_suite",
      classeeAt: now,
      classeeMotif: args.motif,
    });
    await appendAuditEntry(ctx, {
      utilisateurMatricule: auth.matricule,
      serviceUtilisateur: auth.service,
      action: "SYNTHESE_CLASSEE_SANS_SUITE",
      classificationDossier: s.classification,
      cibleEntiteType: "cns_syntheses",
      cibleEntiteId: args.syntheseId,
      detail: args.motif,
      adresseIP: auth.sessionDoc.adresseIPOuverture,
      poste: auth.sessionDoc.posteOuverture,
    });
    return { ok: true };
  },
});

export const listSynthesesAStatut = query({
  args: { jwt: v.string(), statut: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const auth = await requireAuthInQuery(ctx, args.jwt);
    requireRole(auth, ["analyste_cns", "sg_cns", "rssi", "auditeur"]);
    return await ctx.db
      .query("cns_syntheses")
      .withIndex("by_statut", (q) => q.eq("statut", args.statut as any))
      .order("desc")
      .take(args.limit ?? 100);
  },
});
