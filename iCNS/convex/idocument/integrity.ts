// iDocument — Vérification d'intégrité (Prompt 3.1, EF-05.3)
// Référence : NTSAGUI/CNS/CDC/2026/001 §2.5
//
// Outils internes permettant au RSSI et au moteur de sauvegarde de vérifier
// que les fichiers stockés sont déchiffrables et que leur hash plaintext
// correspond à la valeur enregistrée à l'upload.
//
// Note : la vérification complète d'un blob nécessite un round-trip
// download + déchiffrement, qui ne peut pas se faire en query (lecture
// du blob storage). On expose donc des helpers + une mutation `auditDocument`
// qui retourne les éléments pour un audit fait côté client.

import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { appendAuditEntry } from "../audit";
import { requireAuth, requireAuthInQuery, requireRole } from "../auth/middleware";

/**
 * Liste paginée de documents v2 nécessitant une vérification d'intégrité.
 * Accessible aux rôles `rssi` uniquement.
 */
export const listDocumentsForAudit = query({
  args: {
    jwt: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const auth = await requireAuthInQuery(ctx, args.jwt);
    requireRole(auth, ["rssi", "auditeur"]);

    const docs = await ctx.db
      .query("idocDocuments")
      .order("desc")
      .take(args.limit ?? 100);
    return docs
      .filter((d) => (d.metadata as { v?: number } | undefined)?.v === 2)
      .map((d) => ({
        id: d._id,
        fileName: d.fileName,
        fileSize: d.fileSize,
        mimeType: d.mimeType,
        hashPlaintext: (d.metadata as { hashPlaintext?: string }).hashPlaintext,
        wrappedDEK: (d.metadata as { wrappedDEK?: string }).wrappedDEK,
        hasStorage: !!d.fileStorageId,
      }));
  },
});

/**
 * Marque un document comme « intégrité confirmée » ou « intégrité altérée »
 * à l'issue d'une vérification.
 *
 * Le client (outil RSSI) télécharge le blob, déchiffre avec la DEK fournie
 * par `requestDownload`, recalcule SHA-256, compare au hash stocké et
 * appelle cette mutation pour archiver le résultat.
 */
export const recordIntegrityCheck = mutation({
  args: {
    jwt: v.string(),
    docId: v.id("idocDocuments"),
    ok: v.boolean(),
    detail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const auth = await requireAuth(ctx, args.jwt);
    requireRole(auth, ["rssi", "auditeur"]);

    const doc = await ctx.db.get(args.docId);
    if (!doc) throw new Error("Document inconnu.");

    const meta = (doc.metadata as Record<string, unknown> | undefined) ?? {};
    const integrityChecks = (meta.integrityChecks as Array<unknown> | undefined) ?? [];
    integrityChecks.push({
      ok: args.ok,
      detail: args.detail,
      checkedByMatricule: auth.matricule,
      checkedAt: Date.now(),
    });

    await ctx.db.patch(args.docId, {
      metadata: { ...meta, integrityChecks },
    });

    await appendAuditEntry(ctx, {
      utilisateurMatricule: auth.matricule,
      serviceUtilisateur: auth.service,
      action: args.ok ? "IDOC_INTEGRITE_OK" : "IDOC_INTEGRITE_KO",
      cibleEntiteType: "idocDocument",
      cibleEntiteId: args.docId,
      detail: args.detail,
      adresseIP: auth.sessionDoc.adresseIPOuverture,
      poste: auth.sessionDoc.posteOuverture,
    });

    if (!args.ok) {
      // TODO Phase 4 : alerte iCom Flash vers le RSSI et le SG-CNS.
    }

    return { ok: true };
  },
});

/**
 * Helper pur (utilisable côté client) : recalcule SHA-256 hex d'un buffer.
 *
 * Exposé ici par symétrie avec `audit.ts.sha256Hex` pour permettre aux
 * tests d'utiliser le même utilitaire. En pratique, le client iDocument
 * implémentera son propre hash via Web Crypto API (cf. SecureFileUploader).
 */
export async function sha256HexBuffer(buf: ArrayBuffer): Promise<string> {
  const h = await crypto.subtle.digest("SHA-256", buf);
  const bytes = new Uint8Array(h);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, "0");
  return hex;
}
