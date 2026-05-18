// Module Crise — activation et gestion (Prompt 5.3)
// Référence : NTSAGUI/CNS/CDC/2026/001 (Module Crise non listé dans EF
// principal mais demandé dans le prompt d'implémentation)

import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { appendAuditEntry } from "../audit";
import { requireAuth, requireAuthInQuery, requireRole } from "../auth/middleware";
import { encrypt } from "../crypto/service";

export const activerCrise = mutation({
  args: {
    jwt: v.string(),
    nom: v.string(),
    perimetre: v.string(),
    niveau: v.union(
      v.literal("alerte"),
      v.literal("crise"),
      v.literal("crise_majeure"),
    ),
  },
  handler: async (ctx, args) => {
    const auth = await requireAuth(ctx, args.jwt);
    requireRole(auth, ["sg_cns"]);

    // Une seule crise active à la fois ? Politique : on tolère plusieurs
    // crises actives nommées différemment (ex. crise FAG + crise DGSP).
    const now = Date.now();
    const id = await ctx.db.insert("crises", {
      nom: args.nom,
      perimetre: args.perimetre,
      niveau: args.niveau,
      statut: "active",
      declaredByMatricule: auth.matricule,
      declaredAt: now,
    });

    // TODO Phase 5 finale : émettre automatiquement N iCom directives Flash
    // vers tous les chefs de service via internal.icom.create.createComInternal
    // pour notifier l'activation. Pour Phase 5 V1, on se contente du
    // marquage + audit ; les UI cockpit lisent `crises` pour afficher.

    await appendAuditEntry(ctx, {
      utilisateurMatricule: auth.matricule,
      serviceUtilisateur: auth.service,
      action: "CRISE_ACTIVEE",
      cibleEntiteType: "crises",
      cibleEntiteId: id,
      detail: `${args.nom} (niveau ${args.niveau}) — périmètre : ${args.perimetre}`,
      adresseIP: auth.sessionDoc.adresseIPOuverture,
      poste: auth.sessionDoc.posteOuverture,
    });

    return { criseId: id };
  },
});

export const desactiverCrise = mutation({
  args: {
    jwt: v.string(),
    criseId: v.id("crises"),
    rapportFinal: v.string(),
  },
  handler: async (ctx, args) => {
    const auth = await requireAuth(ctx, args.jwt);
    requireRole(auth, ["sg_cns"]);
    const crise = await ctx.db.get(args.criseId);
    if (!crise) throw new Error("Crise introuvable.");
    if (crise.statut !== "active")
      throw new Error("Crise déjà désactivée.");

    const now = Date.now();
    const encryptedRapport = await encrypt(
      args.rapportFinal,
      `crise:${crise.nom}:rapport`,
    );

    await ctx.db.patch(args.criseId, {
      statut: "desactivee",
      desactiveeByMatricule: auth.matricule,
      desactiveeAt: now,
      rapportFinal: encryptedRapport,
    });

    await appendAuditEntry(ctx, {
      utilisateurMatricule: auth.matricule,
      serviceUtilisateur: auth.service,
      action: "CRISE_DESACTIVEE",
      cibleEntiteType: "crises",
      cibleEntiteId: args.criseId,
      detail: `Désactivation de "${crise.nom}" + rapport chiffré`,
      adresseIP: auth.sessionDoc.adresseIPOuverture,
      poste: auth.sessionDoc.posteOuverture,
    });

    return { ok: true };
  },
});

/**
 * Attache un dossier à une crise active. Le dossier remonte en file
 * prioritaire (champ `crisisLabel` sur `dossiers_renseignement`).
 */
export const rattacherDossierACrise = mutation({
  args: {
    jwt: v.string(),
    criseId: v.id("crises"),
    dossierId: v.id("dossiers_renseignement"),
  },
  handler: async (ctx, args) => {
    const auth = await requireAuth(ctx, args.jwt);
    requireRole(auth, ["analyste_cns", "sg_cns"]);
    const crise = await ctx.db.get(args.criseId);
    if (!crise || crise.statut !== "active")
      throw new Error("Crise inconnue ou désactivée.");
    const dossier = await ctx.db.get(args.dossierId);
    if (!dossier) throw new Error("Dossier introuvable.");

    await ctx.db.patch(args.dossierId, { crisisLabel: crise.nom });

    await appendAuditEntry(ctx, {
      utilisateurMatricule: auth.matricule,
      serviceUtilisateur: auth.service,
      action: "DOSSIER_RATTACHE_CRISE",
      dossierId: args.dossierId,
      classificationDossier: dossier.classification,
      detail: `Rattaché à crise "${crise.nom}"`,
      adresseIP: auth.sessionDoc.adresseIPOuverture,
      poste: auth.sessionDoc.posteOuverture,
    });

    return { ok: true };
  },
});

export const listCrisesActives = query({
  args: { jwt: v.string() },
  handler: async (ctx, args) => {
    const _auth = await requireAuthInQuery(ctx, args.jwt);
    return await ctx.db
      .query("crises")
      .withIndex("by_statut", (q) => q.eq("statut", "active"))
      .order("desc")
      .collect();
  },
});

/**
 * File prioritaire : dossiers rattachés à une crise active, triés par
 * urgence et date.
 */
export const filePrioritaireCrise = query({
  args: { jwt: v.string(), criseNom: v.string() },
  handler: async (ctx, args) => {
    const _auth = await requireAuthInQuery(ctx, args.jwt);
    const dossiers = await ctx.db
      .query("dossiers_renseignement")
      .withIndex("by_crisis", (q) => q.eq("crisisLabel", args.criseNom))
      .order("desc")
      .take(200);
    return dossiers.sort((a, b) => {
      const order = { flash: 0, urgent: 1, routine: 2 };
      const oa = order[a.urgence];
      const ob = order[b.urgence];
      if (oa !== ob) return oa - ob;
      return b.updatedAt - a.updatedAt;
    });
  },
});
