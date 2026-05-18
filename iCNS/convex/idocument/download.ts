// iDocument — Download chiffré + vérification d'intégrité (Prompt 3.1)
// Référence : NTSAGUI/CNS/CDC/2026/001 §2.5 (EF-05.3, EF-05.6)
//
// Flux de download :
//   1. Client demande le document via son ID.
//   2. Serveur vérifie l'authentification et l'habilitation.
//   3. Serveur unwrappe la DEK avec la KEK (HSM).
//   4. Serveur retourne au client :
//      - URL Convex Storage du blob chiffré ;
//      - DEK raw (transit TLS uniquement, jamais persisté en clair) ;
//      - hash plaintext attendu pour vérification post-déchiffrement.
//   5. Client télécharge, déchiffre, recalcule hash et compare.
//
// La consultation est tracée dans `journal_audit` et, pour les pièces
// SD/TSD, dans `consultations_dossier` (EF-04.5).

import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { appendAuditEntry } from "../audit";
import { requireAuth } from "../auth/middleware";
import { unwrapDEK } from "../crypto/dek_manager";
import { hasClassificationAccess, requiresIndividualTracking, type ClassificationValue } from "../validators/classification";

// ──────────────────────────────────────────────────────────────────────
// Helpers d'encodage
// ──────────────────────────────────────────────────────────────────────

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

// ──────────────────────────────────────────────────────────────────────
// Récupération des métadonnées (query — pas d'unwrap, juste les méta)
// ──────────────────────────────────────────────────────────────────────

export const getDocumentMetadata = query({
  args: { jwt: v.string(), docId: v.id("idocDocuments") },
  handler: async (ctx, args) => {
    const { requireAuthInQuery } = await import("../auth/middleware");
    await requireAuthInQuery(ctx, args.jwt);
    const doc = await ctx.db.get(args.docId);
    if (!doc) return null;
    return {
      id: doc._id,
      title: doc.title,
      fileName: doc.fileName,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      isArchived: doc.isArchived,
      status: doc.status,
      version: doc.version,
      // metadata.hashPlaintext est retourné pour pré-affichage,
      // mais le download réel passe par `requestDownload` qui re-vérifie.
      hashPlaintext: (doc.metadata as { hashPlaintext?: string } | undefined)?.hashPlaintext,
      isV2: (doc.metadata as { v?: number } | undefined)?.v === 2,
    };
  },
});

// ──────────────────────────────────────────────────────────────────────
// Téléchargement effectif — mutation (car on patch un last-access, on
// trace dans consultations_dossier, etc.)
// ──────────────────────────────────────────────────────────────────────

export const requestDownload = mutation({
  args: {
    jwt: v.string(),
    docId: v.id("idocDocuments"),
    // Pour les pièces probantes liées à un dossier classifié, l'appelant
    // doit fournir la classification du dossier pour vérification BdC.
    classificationDossier: v.optional(
      v.union(v.literal("DR"), v.literal("CD"), v.literal("SD"), v.literal("TSD")),
    ),
    dossierId: v.optional(v.id("dossiers_renseignement")),
  },
  handler: async (ctx, args) => {
    const auth = await requireAuth(ctx, args.jwt);

    const doc = await ctx.db.get(args.docId);
    if (!doc || !doc.fileStorageId) {
      await refuse(ctx, auth, args.docId, "introuvable");
      throw new Error("Document introuvable.");
    }
    const meta = doc.metadata as
      | { v?: number; hashPlaintext?: string; wrappedDEK?: string }
      | undefined;
    if (meta?.v !== 2 || !meta.wrappedDEK || !meta.hashPlaintext) {
      await refuse(ctx, auth, args.docId, "format_legacy_non_supporte");
      throw new Error(
        "Document au format LEGACY — non déchiffrable par iDocument v2. À migrer.",
      );
    }

    // Contrôle d'accès — version simplifiée (Phase 3 minimum).
    // L'évaluation complète du besoin-d'en-connaître (mots-clés, zones,
    // périodes) sera ajoutée dans la Phase 4 (cellule CNS).
    if (args.classificationDossier) {
      const habilitations = await ctx.db
        .query("habilitations")
        .withIndex("by_utilisateur_actif", (q) =>
          q.eq("utilisateurMatricule", auth.matricule).eq("revoque", false),
        )
        .collect();
      const ok = habilitations.some((h) =>
        hasClassificationAccess(h.classificationMax, args.classificationDossier!),
      );
      if (!ok) {
        await refuse(ctx, auth, args.docId, "habilitation_insuffisante");
        throw new Error("Habilitation insuffisante pour la classification du document.");
      }

      // Si SD ou TSD, tracer individuellement la consultation.
      if (requiresIndividualTracking(args.classificationDossier) && args.dossierId) {
        const dossier = await ctx.db.get(args.dossierId);
        if (dossier) {
          await ctx.db.insert("consultations_dossier", {
            utilisateurMatricule: auth.matricule,
            dossierId: args.dossierId,
            referenceDossier: dossier.reference,
            classificationDossier: args.classificationDossier,
            typeConsultation: "telechargement_piece",
            horodatage: Date.now(),
            adresseIP: auth.sessionDoc.adresseIPOuverture,
            poste: auth.sessionDoc.posteOuverture,
            serviceUtilisateur: auth.service,
          });
        }
      }
    }

    // Unwrap la DEK (HSM en prod, PBKDF2 en dev)
    const dekKey = await unwrapDEK(meta.wrappedDEK);
    const dekRaw = new Uint8Array(await crypto.subtle.exportKey("raw", dekKey));
    const dekRawBase64 = bytesToBase64(dekRaw);

    // URL Convex Storage signée (TTL court — Convex la gère)
    const url = await ctx.storage.getUrl(doc.fileStorageId);
    if (!url) {
      await refuse(ctx, auth, args.docId, "storage_indisponible");
      throw new Error("Storage Convex indisponible.");
    }

    // Audit
    await appendAuditEntry(ctx, {
      utilisateurMatricule: auth.matricule,
      serviceUtilisateur: auth.service,
      action: "IDOC_DOWNLOAD_OK",
      dossierId: args.dossierId,
      classificationDossier: args.classificationDossier as ClassificationValue | undefined,
      cibleEntiteType: "idocDocument",
      cibleEntiteId: args.docId,
      detail: `Download ${doc.fileName ?? "(sans nom)"}`,
      adresseIP: auth.sessionDoc.adresseIPOuverture,
      poste: auth.sessionDoc.posteOuverture,
    });

    return {
      downloadUrl: url,
      dekRawBase64,
      hashPlaintext: meta.hashPlaintext,
      fileName: doc.fileName,
      mimeType: doc.mimeType,
      fileSize: doc.fileSize,
    };
  },
});

// ──────────────────────────────────────────────────────────────────────
// Helpers internes
// ──────────────────────────────────────────────────────────────────────

import type { MutationCtx } from "../_generated/server";
import type { AuthContext } from "../auth/middleware";

async function refuse(
  ctx: MutationCtx,
  auth: AuthContext,
  docId: string,
  reason: string,
): Promise<void> {
  await appendAuditEntry(ctx, {
    utilisateurMatricule: auth.matricule,
    serviceUtilisateur: auth.service,
    action: "IDOC_DOWNLOAD_REFUSE",
    cibleEntiteType: "idocDocument",
    cibleEntiteId: docId,
    detail: reason,
    adresseIP: auth.sessionDoc.adresseIPOuverture,
    poste: auth.sessionDoc.posteOuverture,
  });
}
