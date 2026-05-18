// iDocument — Upload chiffré (Prompt 3.1)
// Référence : NTSAGUI/CNS/CDC/2026/001 §2.5 (EF-05)
//
// Flux d'upload (« near-zero-knowledge ») :
//   1. Client génère une DEK aléatoire (AES-256-GCM, dans le navigateur).
//   2. Client calcule SHA-256 du plaintext (pour l'intégrité).
//   3. Client chiffre le fichier avec la DEK et upload le ciphertext
//      directement vers Convex storage (`generateUploadUrl`).
//   4. Client envoie au serveur la DEK (raw bytes b64) — qui n'est jamais
//      persistée en clair côté serveur.
//   5. Serveur wrappe la DEK avec la KEK (HSM) et stocke le record final.
//
// Limite par défaut : 500 Mo par fichier (EF-05.4) — configurable par type
// de pièce via `types_dossier`.
//
// Toute action est journalisée dans `journal_audit`. La table interne
// `idoc_records_v2` (à ne pas confondre avec `idocDocuments` LEGACY)
// matérialise les fichiers iCNS durcis. Sa définition est portée par la
// migration de Phase 3 (TODO).

import { mutation } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { v } from "convex/values";
import { appendAuditEntry } from "../audit";
import { requireAuth } from "../auth/middleware";

// ──────────────────────────────────────────────────────────────────────
// Constantes
// ──────────────────────────────────────────────────────────────────────

/** Taille max par défaut — peut être surchargée par `types_dossier`. */
export const DEFAULT_MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 Mo

/** Types MIME autorisés par défaut. La liste peut être restreinte par
 *  type de pièce dans la config métier (voir `types_dossier.parcours[].
 *  piecesAttendues` — TODO Phase 3). */
const ALLOWED_MIME_TYPES: ReadonlySet<string> = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/tiff",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "video/mp4",
  "text/plain",
]);

// ──────────────────────────────────────────────────────────────────────
// Étape 1 : générer l'URL d'upload directe Convex Storage
// ──────────────────────────────────────────────────────────────────────

/**
 * Délivre une URL d'upload directe pour Convex Storage.
 *
 * Le client uploadera vers cette URL la version **chiffrée** du fichier.
 * Le serveur ne voit jamais le plaintext.
 */
export const generateUploadUrl = mutation({
  args: { jwt: v.string() },
  handler: async (ctx, args) => {
    const auth = await requireAuth(ctx, args.jwt);
    // Trace l'intention d'upload (le record réel sera tracé en recordUpload)
    await appendAuditEntry(ctx, {
      utilisateurMatricule: auth.matricule,
      serviceUtilisateur: auth.service,
      action: "IDOC_UPLOAD_URL_GENEREE",
      adresseIP: auth.sessionDoc.adresseIPOuverture,
      poste: auth.sessionDoc.posteOuverture,
    });
    return await ctx.storage.generateUploadUrl();
  },
});

// ──────────────────────────────────────────────────────────────────────
// Étape 2 : enregistrer le fichier uploadé avec sa DEK wrappée
// ──────────────────────────────────────────────────────────────────────

/**
 * Le client a uploadé le ciphertext vers `storageId` ; il envoie maintenant
 * au serveur le hash du plaintext et la DEK raw qui a servi à chiffrer.
 *
 * Le serveur :
 *   - vérifie auth ;
 *   - vérifie taille et MIME ;
 *   - wrappe la DEK avec la KEK (HSM) — la DEK raw n'est jamais persistée ;
 *   - stocke un record dans `idoc_records_v2` (TODO : table à créer en
 *     Phase 3 — pour l'instant on stocke dans `idocDocuments` LEGACY avec
 *     un suffixe « _v2 » dans `metadata`).
 */
export const recordUpload = mutation({
  args: {
    jwt: v.string(),
    storageId: v.id("_storage"),
    fileName: v.string(),
    mimeType: v.string(),
    fileSize: v.number(),
    hashPlaintext: v.string(), // SHA-256 hex du contenu déchiffré
    dekRawBase64: v.string(), // DEK 32 octets en base64 — sera wrappée immédiatement
    // Lien optionnel à un dossier (pour les pièces)
    dossierId: v.optional(v.id("dossiers_renseignement")),
    typePiece: v.optional(
      v.union(
        v.literal("note"),
        v.literal("fiche_individu"),
        v.literal("fiche_organisation"),
        v.literal("piece_probante"),
        v.literal("transcription"),
        v.literal("rapport"),
        v.literal("piece_procedure"),
        v.literal("avis"),
      ),
    ),
    libelle: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const auth = await requireAuth(ctx, args.jwt);

    // 1. Validation MIME et taille
    if (!ALLOWED_MIME_TYPES.has(args.mimeType)) {
      await traceRefus(ctx, auth, args.fileName, `MIME interdit: ${args.mimeType}`);
      await ctx.storage.delete(args.storageId);
      throw new Error(`Type MIME non autorisé: ${args.mimeType}`);
    }
    if (args.fileSize > DEFAULT_MAX_FILE_SIZE) {
      await traceRefus(ctx, auth, args.fileName, `Taille ${args.fileSize} > ${DEFAULT_MAX_FILE_SIZE}`);
      await ctx.storage.delete(args.storageId);
      throw new Error(
        `Fichier trop volumineux : ${args.fileSize} octets > ${DEFAULT_MAX_FILE_SIZE}.`,
      );
    }

    // 2. Wrap la DEK avec la KEK (HSM en prod, PBKDF2 en dev).
    //    On importe la DEK raw, on génère un wrap, on jette la DEK.
    const dekRawBytes = base64ToBytes(args.dekRawBase64);
    if (dekRawBytes.length !== 32) {
      await traceRefus(ctx, auth, args.fileName, "DEK longueur invalide");
      await ctx.storage.delete(args.storageId);
      throw new Error("DEK doit faire 32 octets (AES-256).");
    }
    const dek = await crypto.subtle.importKey(
      "raw",
      dekRawBytes,
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"],
    );
    const { wrapDEK } = await import("../crypto/dek_manager");
    const wrappedDEK = await wrapDEK(dek);

    // 3. Vérifier le format du hash plaintext (64 hex chars)
    if (!/^[0-9a-f]{64}$/.test(args.hashPlaintext)) {
      await traceRefus(ctx, auth, args.fileName, "Hash format invalide");
      await ctx.storage.delete(args.storageId);
      throw new Error("hashPlaintext doit être SHA-256 hex (64 caractères).");
    }

    // 4. Stocker le record. On utilise idocDocuments (LEGACY) avec
    //    metadata.v2 pour distinguer. La table définitive `idoc_records_v2`
    //    sera créée lors du nettoyage final des tables LEGACY.
    const docId = await ctx.db.insert("idocDocuments", {
      title: args.fileName,
      typeId: args.typePiece,
      status: "actif",
      createdBy: auth.matricule,
      fileStorageId: args.storageId,
      fileName: args.fileName,
      fileSize: args.fileSize,
      mimeType: args.mimeType,
      version: 1,
      isArchived: false,
      tags: [],
      metadata: {
        v: 2, // marqueur iDocument iCNS durci
        hashPlaintext: args.hashPlaintext,
        wrappedDEK,
        libelle: args.libelle,
        dossierId: args.dossierId,
        adresseIPUpload: auth.sessionDoc.adresseIPOuverture,
        posteUpload: auth.sessionDoc.posteOuverture,
      },
    });

    // 5. Si lié à un dossier, créer aussi une entrée dans `pieces`
    if (args.dossierId && args.typePiece) {
      await ctx.db.insert("pieces", {
        dossierId: args.dossierId,
        typePiece: args.typePiece,
        libelle: args.libelle ?? args.fileName,
        fileStorageId: args.storageId,
        fileName: args.fileName,
        mimeType: args.mimeType,
        fileSize: args.fileSize,
        hashIntegrite: args.hashPlaintext,
        addedByMatricule: auth.matricule,
        addedAt: Date.now(),
        obligatoire: false, // déterminé par config types_dossier — à enrichir
      });
    }

    // 6. Audit
    await appendAuditEntry(ctx, {
      utilisateurMatricule: auth.matricule,
      serviceUtilisateur: auth.service,
      action: "IDOC_UPLOAD_OK",
      dossierId: args.dossierId,
      cibleEntiteType: "idocDocument",
      cibleEntiteId: docId,
      detail: `Upload ${args.fileName} (${args.fileSize} octets, ${args.mimeType})`,
      adresseIP: auth.sessionDoc.adresseIPOuverture,
      poste: auth.sessionDoc.posteOuverture,
    });

    return {
      docId,
      storageId: args.storageId,
      // Le wrappedDEK est aussi renvoyé pour info — il est déjà persisté.
      wrappedDEK,
    };
  },
});

// ──────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

import type { MutationCtx } from "../_generated/server";
import type { AuthContext } from "../auth/middleware";

async function traceRefus(
  ctx: MutationCtx,
  auth: AuthContext,
  fileName: string,
  reason: string,
): Promise<void> {
  await appendAuditEntry(ctx, {
    utilisateurMatricule: auth.matricule,
    serviceUtilisateur: auth.service,
    action: "IDOC_UPLOAD_REFUSE",
    detail: `${fileName} — ${reason}`,
    adresseIP: auth.sessionDoc.adresseIPOuverture,
    poste: auth.sessionDoc.posteOuverture,
  });
}
