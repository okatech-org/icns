// Renvois (incomplet) — Prompt 3.2
// Référence : NTSAGUI/CNS/CDC/2026/001 §2.1 (renvoi par hiérarchie ou par CNS)

import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { appendAuditEntry } from "../audit";
import { requireAuth } from "../auth/middleware";
import { checkTransition } from "./state_machine";

/**
 * Renvoie un dossier à l'étape précédente avec motif obligatoire.
 *
 * Variantes :
 *   - renvoyer_a_section : directeur renvoie au chef
 *   - renvoyer_a_constitution : chef/directeur renvoie à l'officier
 *   - marquer_incomplet_par_cns : SG-CNS / analyste renvoie au service
 */
export const renvoyerDossier = mutation({
  args: {
    jwt: v.string(),
    dossierId: v.id("dossiers_renseignement"),
    cible: v.union(
      v.literal("section"),
      v.literal("constitution"),
      v.literal("service_producteur"), // utilisé par CNS
    ),
    motif: v.string(),
  },
  handler: async (ctx, args) => {
    const auth = await requireAuth(ctx, args.jwt);
    const dossier = await ctx.db.get(args.dossierId);
    if (!dossier) throw new Error("Dossier introuvable.");

    if (!args.motif || args.motif.trim().length < 3) {
      throw new Error("Motif de renvoi obligatoire (≥ 3 caractères).");
    }

    const action =
      args.cible === "section"
        ? "renvoyer_a_section"
        : args.cible === "constitution"
          ? "renvoyer_a_constitution"
          : "marquer_incomplet_par_cns";

    const check = checkTransition(dossier.statut, action, auth.role);
    if (!check.ok || !check.toStatus) {
      throw new Error(check.reason ?? "Renvoi refusé.");
    }

    const now = Date.now();

    // Clôturer l'étape courante avec motif "renvoi"
    const currentEtape = await ctx.db
      .query("etapes_parcours")
      .withIndex("by_dossier_etape", (q) =>
        q.eq("dossierId", args.dossierId).eq("etapeIndex", dossier.currentEtapeIndex),
      )
      .first();
    if (currentEtape) {
      await ctx.db.patch(currentEtape._id, {
        dateSortie: now,
        motifSortie: "renvoi",
        motifRenvoi: args.motif,
        etat: "terminee",
      });
    }

    // Mettre à jour le dossier
    // L'index d'étape recule selon la cible
    let newEtapeIndex = dossier.currentEtapeIndex;
    if (action === "renvoyer_a_section") newEtapeIndex = Math.max(0, dossier.currentEtapeIndex - 1);
    if (action === "renvoyer_a_constitution") newEtapeIndex = 0;
    if (action === "marquer_incomplet_par_cns") newEtapeIndex = 0;

    await ctx.db.patch(args.dossierId, {
      statut: check.toStatus,
      currentEtapeIndex: newEtapeIndex,
      updatedAt: now,
    });

    // Créer une nouvelle étape pour l'étape de retour
    const typeDoc = await ctx.db.get(dossier.typeDossierId);
    const targetStep = typeDoc?.parcours.find((p) => p.index === newEtapeIndex);
    if (targetStep) {
      await ctx.db.insert("etapes_parcours", {
        dossierId: args.dossierId,
        etapeIndex: newEtapeIndex,
        etapeCode: targetStep.code,
        etapeLabel: targetStep.label,
        contributeursMatricules: [],
        dateEntree: now,
        suspendue: false,
        etat: "en_cours",
      });
    }

    // Audit
    await appendAuditEntry(ctx, {
      utilisateurMatricule: auth.matricule,
      serviceUtilisateur: auth.service,
      action: `DOSSIER_${action.toUpperCase()}`,
      dossierId: args.dossierId,
      classificationDossier: dossier.classification,
      detail: `Motif: ${args.motif}`,
      adresseIP: auth.sessionDoc.adresseIPOuverture,
      poste: auth.sessionDoc.posteOuverture,
    });

    return { ok: true, statut: check.toStatus, motif: args.motif };
  },
});
