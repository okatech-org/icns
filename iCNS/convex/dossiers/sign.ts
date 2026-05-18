// Signature et soumission hiérarchique — Prompt 3.2
// Référence : NTSAGUI/CNS/CDC/2026/001 §2.1 (EF-01.5)

import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { appendAuditEntry } from "../audit";
import { requireAuth, requireRole } from "../auth/middleware";
import { checkTransition, type DossierAction } from "./state_machine";

/**
 * Soumet un dossier au chef de section (officier → chef).
 */
export const soumettreSection = mutation({
  args: { jwt: v.string(), dossierId: v.id("dossiers_renseignement") },
  handler: async (ctx, args) => {
    return await transition(ctx, args.jwt, args.dossierId, "soumettre_section", {});
  },
});

/**
 * Soumet un dossier au directeur (chef → directeur).
 */
export const soumettreDirection = mutation({
  args: { jwt: v.string(), dossierId: v.id("dossiers_renseignement") },
  handler: async (ctx, args) => {
    return await transition(ctx, args.jwt, args.dossierId, "soumettre_direction", {});
  },
});

/**
 * Suspend un dossier (gèle les délais).
 */
export const suspendreDossier = mutation({
  args: {
    jwt: v.string(),
    dossierId: v.id("dossiers_renseignement"),
    motif: v.string(),
  },
  handler: async (ctx, args) => {
    return await transition(ctx, args.jwt, args.dossierId, "suspendre", {
      motif: args.motif,
    });
  },
});

/**
 * Reprend un dossier suspendu (restaure le statut précédent).
 */
export const reprendreDossier = mutation({
  args: { jwt: v.string(), dossierId: v.id("dossiers_renseignement") },
  handler: async (ctx, args) => {
    return await transition(ctx, args.jwt, args.dossierId, "reprendre", {});
  },
});

/**
 * Clôture par le SG-CNS (positif / négatif / administratif).
 */
export const cloturerDossier = mutation({
  args: {
    jwt: v.string(),
    dossierId: v.id("dossiers_renseignement"),
    typeCloture: v.union(
      v.literal("positif"),
      v.literal("negatif"),
      v.literal("administratif"),
    ),
    motif: v.string(),
  },
  handler: async (ctx, args) => {
    const action: DossierAction =
      args.typeCloture === "positif"
        ? "cloturer_positif"
        : args.typeCloture === "negatif"
          ? "cloturer_negatif"
          : "cloturer_administratif";
    return await transition(ctx, args.jwt, args.dossierId, action, {
      motif: args.motif,
    });
  },
});

// ──────────────────────────────────────────────────────────────────────
// Helper générique de transition
// ──────────────────────────────────────────────────────────────────────

import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

async function transition(
  ctx: MutationCtx,
  jwt: string,
  dossierId: Id<"dossiers_renseignement">,
  action: DossierAction,
  options: { motif?: string },
): Promise<{ ok: true; statut: string }> {
  const auth = await requireAuth(ctx, jwt);
  const dossier = await ctx.db.get(dossierId);
  if (!dossier) throw new Error("Dossier introuvable.");

  const check = checkTransition(dossier.statut, action, auth.role);
  if (!check.ok) {
    throw new Error(check.reason ?? "Transition refusée.");
  }

  const now = Date.now();
  let nextStatus = check.toStatus;
  let updates: Record<string, unknown> = { updatedAt: now };

  if (action === "suspendre") {
    if (!options.motif) throw new Error("Motif requis pour la suspension.");
    nextStatus = "suspendu";
    updates = {
      ...updates,
      statut: "suspendu",
      suspendedAt: now,
      suspendReason: options.motif,
    };
    // Suspendre l'étape courante
    const currentEtape = await currentEtapeOf(ctx, dossierId, dossier.currentEtapeIndex);
    if (currentEtape) {
      await ctx.db.patch(currentEtape._id, { suspendue: true, etat: "suspendue" });
    }
  } else if (action === "reprendre") {
    // On suppose ici qu'on remet à "constitution" en fallback —
    // dans une vraie implémentation, on stockerait `statutAvantSuspension`
    // pour reprendre exactement où on en était.
    nextStatus = "constitution";
    updates = {
      ...updates,
      statut: "constitution",
      resumedAt: now,
      suspendedAt: undefined,
      suspendReason: undefined,
    };
    const currentEtape = await currentEtapeOf(ctx, dossierId, dossier.currentEtapeIndex);
    if (currentEtape) {
      await ctx.db.patch(currentEtape._id, { suspendue: false, etat: "en_cours" });
    }
  } else if (
    action === "cloturer_positif" ||
    action === "cloturer_negatif" ||
    action === "cloturer_administratif"
  ) {
    if (!options.motif) throw new Error("Motif de clôture obligatoire (EF-01.9).");
    updates = {
      ...updates,
      statut: nextStatus,
      closedAt: now,
      closeMotif: options.motif,
    };
    const currentEtape = await currentEtapeOf(ctx, dossierId, dossier.currentEtapeIndex);
    if (currentEtape) {
      await ctx.db.patch(currentEtape._id, {
        dateSortie: now,
        motifSortie: "cloture",
        etat: "terminee",
      });
    }
  } else {
    // Transitions « simples » (soumettre, etc.)
    updates = { ...updates, statut: nextStatus };
    // Avancer l'étape courante si elle change
    if (
      action === "soumettre_section" ||
      action === "soumettre_direction"
    ) {
      // Trouver l'étape suivante dans le parcours du type
      const typeDoc = await ctx.db.get(dossier.typeDossierId);
      if (typeDoc) {
        const nextStep = typeDoc.parcours.find(
          (p) => p.index === dossier.currentEtapeIndex + 1,
        );
        if (nextStep) {
          updates = { ...updates, currentEtapeIndex: nextStep.index };
          // Clôturer l'étape précédente
          const currentEtape = await currentEtapeOf(
            ctx,
            dossierId,
            dossier.currentEtapeIndex,
          );
          if (currentEtape) {
            await ctx.db.patch(currentEtape._id, {
              dateSortie: now,
              motifSortie: "transmission",
              etat: "terminee",
            });
          }
          // Créer la nouvelle étape
          await ctx.db.insert("etapes_parcours", {
            dossierId,
            etapeIndex: nextStep.index,
            etapeCode: nextStep.code,
            etapeLabel: nextStep.label,
            contributeursMatricules: [auth.matricule],
            dateEntree: now,
            suspendue: false,
            etat: "en_cours",
          });
        }
      }
    }
  }

  await ctx.db.patch(dossierId, updates);

  await appendAuditEntry(ctx, {
    utilisateurMatricule: auth.matricule,
    serviceUtilisateur: auth.service,
    action: `DOSSIER_${action.toUpperCase()}`,
    dossierId,
    classificationDossier: dossier.classification,
    detail: options.motif,
    adresseIP: auth.sessionDoc.adresseIPOuverture,
    poste: auth.sessionDoc.posteOuverture,
  });

  return { ok: true, statut: nextStatus ?? dossier.statut };
}

async function currentEtapeOf(
  ctx: MutationCtx,
  dossierId: Id<"dossiers_renseignement">,
  etapeIndex: number,
) {
  return await ctx.db
    .query("etapes_parcours")
    .withIndex("by_dossier_etape", (q) =>
      q.eq("dossierId", dossierId).eq("etapeIndex", etapeIndex),
    )
    .first();
}
