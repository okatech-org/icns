// Transmission d'un dossier vers le CNS — Prompt 3.2
// Référence : NTSAGUI/CNS/CDC/2026/001 §2.1 (EF-01.5, EF-01.6)
//
// Action atomique : SOIT tout aboutit (statut changé + étape clôturée +
// copie classifiée créée + audit), SOIT rien n'aboutit (Convex mutation
// transactionnelle).

import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { appendAuditEntry } from "../audit";
import { requireAuth, requireRole } from "../auth/middleware";
import { checkTransition } from "./state_machine";
import { encrypt } from "../crypto/service";

export const transmettreDossier = mutation({
  args: {
    jwt: v.string(),
    dossierId: v.id("dossiers_renseignement"),
    /** Signature qualifiée du directeur (blob produit par le HSM lors du sign). */
    signatureQualifieeBlob: v.string(),
    /** Destinataire (généralement "CNS_SECRETARIAT"). */
    destinataire: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const auth = await requireAuth(ctx, args.jwt);
    requireRole(auth, ["directeur_service"]);

    // 1. Charger le dossier
    const dossier = await ctx.db.get(args.dossierId);
    if (!dossier) throw new Error("Dossier introuvable.");

    // 2. Vérifier que le directeur est bien du service producteur
    if (dossier.serviceProducteurCode !== auth.service) {
      throw new Error(
        `Le directeur de ${auth.service} ne peut pas transmettre un dossier de ${dossier.serviceProducteurCode}.`,
      );
    }

    // 3. Vérifier la transition
    const check = checkTransition(dossier.statut, "signer_et_transmettre", auth.role);
    if (!check.ok || !check.toStatus) {
      throw new Error(`Transmission impossible : ${check.reason ?? "?"}`);
    }

    // 4. Exigence métier : signature présente
    if (!args.signatureQualifieeBlob || args.signatureQualifieeBlob.length < 16) {
      throw new Error("Signature qualifiée du directeur requise (EF-01.5).");
    }

    const now = Date.now();
    const destinataire = args.destinataire ?? "CNS_SECRETARIAT";

    // 5. Mettre à jour le dossier
    await ctx.db.patch(args.dossierId, {
      statut: "transmis_cns",
      signedByDirecteurMatricule: auth.matricule,
      signatureQualifieeBlob: args.signatureQualifieeBlob,
      signatureAt: now,
      transmittedAt: now,
      transmittedToService: destinataire,
      updatedAt: now,
    });

    // 6. Clôturer l'étape courante
    const currentEtape = await ctx.db
      .query("etapes_parcours")
      .withIndex("by_dossier_etape", (q) =>
        q.eq("dossierId", args.dossierId).eq("etapeIndex", dossier.currentEtapeIndex),
      )
      .first();
    if (currentEtape) {
      await ctx.db.patch(currentEtape._id, {
        dateSortie: now,
        motifSortie: "transmission",
        etat: "terminee",
      });
    }

    // 7. Créer la copie classifiée read-only
    const snapshotData = {
      reference: dossier.reference,
      classification: dossier.classification,
      urgence: dossier.urgence,
      serviceProducteur: dossier.serviceProducteurCode,
      transmittedAt: now,
      destinataire,
      signedByDirecteur: auth.matricule,
      signatureAt: now,
      typeDossierId: dossier.typeDossierId,
      // Note : on chiffre le snapshot avec un nouveau contextKey
      // pour qu'il soit déchiffrable indépendamment du dossier original.
    };
    const contextKey = `copie:${dossier.reference}:${now}`;
    const encryptedSnapshot = await encrypt(JSON.stringify(snapshotData), contextKey);

    // Hash d'intégrité du snapshot
    const hashSeed = `${dossier.reference}|${now}|${destinataire}|${auth.matricule}`;
    const hashBuf = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(hashSeed),
    );
    let hashIntegrite = "";
    for (const b of new Uint8Array(hashBuf)) {
      hashIntegrite += b.toString(16).padStart(2, "0");
    }

    await ctx.db.insert("copies_classifiees", {
      dossierOriginalId: args.dossierId,
      referenceOriginale: dossier.reference,
      serviceProducteurCode: dossier.serviceProducteurCode,
      classification: dossier.classification,
      dateTransmission: now,
      destinataire,
      encryptedSnapshot,
      hashIntegrite,
      impressionAutorisee: false,
    });

    // 8. Audit (atomique avec tout ce qui précède)
    await appendAuditEntry(ctx, {
      utilisateurMatricule: auth.matricule,
      serviceUtilisateur: auth.service,
      action: "DOSSIER_TRANSMIS",
      dossierId: args.dossierId,
      classificationDossier: dossier.classification,
      detail: `Transmission de ${dossier.reference} vers ${destinataire}`,
      adresseIP: auth.sessionDoc.adresseIPOuverture,
      poste: auth.sessionDoc.posteOuverture,
    });

    return {
      ok: true,
      reference: dossier.reference,
      transmittedAt: now,
      destinataire,
    };
  },
});
