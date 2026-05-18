// iArchive — Versement automatique + export out-of-band (Prompt 5.1)
// Référence : NTSAGUI/CNS/CDC/2026/001 §2.6, §2.8

import { internalMutation } from "../_generated/server";
import { appendAuditEntry, GENESIS_HASH } from "../audit";
import { encrypt } from "../crypto/service";

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const RETENTION: Record<"DR" | "CD" | "SD" | "TSD", number> = {
  DR: 5 * ONE_YEAR_MS,
  CD: 10 * ONE_YEAR_MS,
  SD: 30 * ONE_YEAR_MS,
  TSD: 50 * ONE_YEAR_MS,
};

/**
 * Cron quotidien : verse dans iArchive tous les dossiers clôturés
 * pas encore archivés.
 */
export const archiverDossiersExpires = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const closStatuts = ["cloture_positif", "cloture_negatif", "cloture_administratif"] as const;
    let archived = 0;

    for (const statut of closStatuts) {
      const dossiers = await ctx.db
        .query("dossiers_renseignement")
        .withIndex("by_statut", (q) => q.eq("statut", statut as any))
        .take(500);
      for (const dossier of dossiers) {
        // Déjà archivé ?
        if (dossier.archivedAt) continue;

        const snapshot = {
          reference: dossier.reference,
          classification: dossier.classification,
          urgence: dossier.urgence,
          statut: dossier.statut,
          serviceProducteurCode: dossier.serviceProducteurCode,
          createdByMatricule: dossier.createdByMatricule,
          createdAt: dossier.createdAt,
          updatedAt: dossier.updatedAt,
          signedByDirecteurMatricule: dossier.signedByDirecteurMatricule,
          signatureAt: dossier.signatureAt,
          transmittedAt: dossier.transmittedAt,
          closedAt: dossier.closedAt,
          closeMotif: dossier.closeMotif,
        };
        const contextKey = `archive:${dossier.reference}`;
        const encryptedSnapshot = await encrypt(JSON.stringify(snapshot), contextKey);

        const seed = `${dossier.reference}|${dossier.classification}|${now}`;
        const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(seed));
        let hashIntegrite = "";
        for (const b of new Uint8Array(h)) hashIntegrite += b.toString(16).padStart(2, "0");

        // Compter les pièces et entrées d'audit
        const pieces = await ctx.db
          .query("pieces")
          .withIndex("by_dossier", (q) => q.eq("dossierId", dossier._id))
          .collect();
        const auditEntries = await ctx.db
          .query("journal_audit")
          .withIndex("by_dossier", (q) => q.eq("dossierId", dossier._id))
          .collect();

        await ctx.db.insert("iarchive_dossiers", {
          dossierOriginalId: dossier._id,
          reference: dossier.reference,
          classification: dossier.classification,
          serviceProducteurCode: dossier.serviceProducteurCode,
          encryptedSnapshot,
          hashIntegrite,
          retentionEndAt: now + RETENTION[dossier.classification],
          archivedAt: now,
          piecesCount: pieces.length,
          dossiersAuditEntries: auditEntries.length,
        });

        // Mettre à jour le dossier original
        await ctx.db.patch(dossier._id, {
          statut: "archive",
          archivedAt: now,
        });

        await appendAuditEntry(ctx, {
          utilisateurMatricule: "SYSTEM",
          serviceUtilisateur: "B2",
          action: "DOSSIER_ARCHIVE",
          dossierId: dossier._id,
          classificationDossier: dossier.classification,
          detail: `Versement automatique dans iArchive (rétention ${RETENTION[dossier.classification] / ONE_YEAR_MS} ans)`,
          adresseIP: "127.0.0.1",
          poste: "CRON_RETENTION",
        });
        archived++;
      }
    }
    return { archived, at: now };
  },
});

/**
 * Cron quotidien : exporte la chaîne d'audit out-of-band (EF-08.3).
 * Stocke un snapshot des dernières entrées dans `iarchive_audit_exports`.
 */
export const exporterChaineAudit = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const last = await ctx.db
      .query("journal_audit")
      .withIndex("by_sequence")
      .order("desc")
      .first();
    if (!last) {
      await ctx.db.insert("iarchive_audit_exports", {
        exportedAt: now,
        lastSequence: 0,
        lastHash: GENESIS_HASH,
        nbEntries: 0,
      });
      return { entries: 0, lastSequence: 0 };
    }
    const all = await ctx.db.query("journal_audit").order("asc").collect();
    await ctx.db.insert("iarchive_audit_exports", {
      exportedAt: now,
      lastSequence: last.sequence,
      lastHash: last.hashEntreeCourante,
      nbEntries: all.length,
      // TODO Phase 6 : écrire le snapshot complet dans Convex Storage et
      // déclencher un transfert vers un système séparé (sFTP, support
      // physique signé par RSSI, etc.) cf. modèle de menace M3-M4.
    });
    return { entries: all.length, lastSequence: last.sequence };
  },
});
