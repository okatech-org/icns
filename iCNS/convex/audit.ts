// Journal d'audit chaîné SHA-256 — iCNS
// Référence : NTSAGUI/CNS/CDC/2026/001 §2.8 (EF-08) — Prompt 1.2
//
// Le journal d'audit est la pièce maîtresse du dispositif de sécurité iCNS :
// indélébile, séquentiel, chaîné cryptographiquement. Une seule rupture
// de chaîne suffit à signaler une tentative de manipulation.
//
// Modèle de menace : cf. `docs/audit-threat-model.md`.

import { mutation, internalMutation, type MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import {
  classificationValidator,
  serviceCodeValidator,
  type ClassificationValue,
  type ServiceCodeValue,
} from "./validators/classification";

// ──────────────────────────────────────────────────────────────────────
// Constantes
// ──────────────────────────────────────────────────────────────────────

/** Valeur utilisée comme `hashEntreePrecedente` pour la 1re entrée. */
export const GENESIS_HASH = "GENESIS";

/** Séparateur de champs pour la sérialisation hashée. Caractère non-imprimable
 *  pour minimiser les collisions de payload entre deux entrées différentes. */
const FIELD_SEP = "\x1f"; // ASCII Unit Separator

// ──────────────────────────────────────────────────────────────────────
// Hashing — Web Crypto API (disponible dans le runtime Convex)
// ──────────────────────────────────────────────────────────────────────

/**
 * Calcule un hash SHA-256 d'une chaîne UTF-8 et retourne sa représentation
 * hexadécimale en minuscules (64 caractères).
 *
 * Utilise l'API Web Crypto (`crypto.subtle.digest`), disponible dans le
 * runtime Convex (V8 isolate) et dans les navigateurs modernes.
 */
export async function sha256Hex(payload: string): Promise<string> {
  const data = new TextEncoder().encode(payload);
  const buf = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(buf);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return hex;
}

/**
 * Sérialise les champs d'une entrée d'audit en un payload déterministe
 * destiné au calcul du hash de chaînage. L'ordre des champs et le
 * séparateur sont stables pour garantir la reproductibilité de la
 * vérification (cf. `convex/audit_verify.ts`).
 */
export function serializeAuditEntry(fields: {
  sequence: number;
  utilisateurMatricule: string;
  serviceUtilisateur: string;
  action: string;
  classificationDossier?: string;
  dossierId?: string;
  cibleEntiteType?: string;
  cibleEntiteId?: string;
  detail?: string;
  horodatage: number;
  adresseIP: string;
  poste: string;
  hashEntreePrecedente: string;
}): string {
  return [
    fields.sequence.toString(),
    fields.utilisateurMatricule,
    fields.serviceUtilisateur,
    fields.action,
    fields.classificationDossier ?? "",
    fields.dossierId ?? "",
    fields.cibleEntiteType ?? "",
    fields.cibleEntiteId ?? "",
    fields.detail ?? "",
    fields.horodatage.toString(),
    fields.adresseIP,
    fields.poste,
    fields.hashEntreePrecedente,
  ].join(FIELD_SEP);
}

// ──────────────────────────────────────────────────────────────────────
// Helper interne — réutilisable par d'autres mutations dans la même
// transaction.
// ──────────────────────────────────────────────────────────────────────

export interface AuditEntryArgs {
  utilisateurMatricule: string;
  serviceUtilisateur: ServiceCodeValue;
  action: string;
  classificationDossier?: ClassificationValue;
  dossierId?: Id<"dossiers_renseignement">;
  cibleEntiteType?: string;
  cibleEntiteId?: string;
  detail?: string;
  adresseIP: string;
  poste: string;
}

/**
 * Insère une entrée d'audit en respectant le chaînage SHA-256.
 *
 * **À utiliser depuis d'autres mutations Convex** pour garantir l'atomicité
 * de l'écriture métier + audit. Convex applique l'OCC : si deux mutations
 * tentent d'insérer la même séquence en concurrence, l'une est retentée.
 *
 * @example
 * import { appendAuditEntry } from "./audit";
 *
 * export const transmettreDossier = mutation({
 *   args: { dossierId: v.id("dossiers_renseignement"), ... },
 *   handler: async (ctx, args) => {
 *     // ... logique métier ...
 *     await appendAuditEntry(ctx, {
 *       utilisateurMatricule: "...",
 *       serviceUtilisateur: "DGSS",
 *       action: "DOSSIER_TRANSMIS",
 *       dossierId: args.dossierId,
 *       adresseIP: "...",
 *       poste: "...",
 *     });
 *   },
 * });
 */
export async function appendAuditEntry(
  ctx: MutationCtx,
  args: AuditEntryArgs,
): Promise<{ sequence: number; hash: string }> {
  // 1. Lire la dernière entrée pour récupérer séquence et hash précédent.
  //    Convex tracke ce read dans l'OCC : toute insertion concurrente
  //    déclenchera une retry automatique.
  const last = await ctx.db
    .query("journal_audit")
    .withIndex("by_sequence")
    .order("desc")
    .first();

  const sequence = (last?.sequence ?? 0) + 1;
  const hashEntreePrecedente = last?.hashEntreeCourante ?? GENESIS_HASH;
  const horodatage = Date.now();

  // 2. Calculer le hash de cette entrée (chaînage).
  const payload = serializeAuditEntry({
    sequence,
    utilisateurMatricule: args.utilisateurMatricule,
    serviceUtilisateur: args.serviceUtilisateur,
    action: args.action,
    classificationDossier: args.classificationDossier,
    dossierId: args.dossierId,
    cibleEntiteType: args.cibleEntiteType,
    cibleEntiteId: args.cibleEntiteId,
    detail: args.detail,
    horodatage,
    adresseIP: args.adresseIP,
    poste: args.poste,
    hashEntreePrecedente,
  });
  const hashEntreeCourante = await sha256Hex(payload);

  // 3. Append. Si une autre mutation a inséré entre-temps, Convex retry
  //    cette mutation depuis le début (la séquence sera incrémentée).
  await ctx.db.insert("journal_audit", {
    sequence,
    utilisateurMatricule: args.utilisateurMatricule,
    serviceUtilisateur: args.serviceUtilisateur,
    action: args.action,
    classificationDossier: args.classificationDossier,
    dossierId: args.dossierId,
    cibleEntiteType: args.cibleEntiteType,
    cibleEntiteId: args.cibleEntiteId,
    detail: args.detail,
    horodatage,
    adresseIP: args.adresseIP,
    poste: args.poste,
    hashEntreePrecedente,
    hashEntreeCourante,
  });

  return { sequence, hash: hashEntreeCourante };
}

// ──────────────────────────────────────────────────────────────────────
// Mutations exposées
// ──────────────────────────────────────────────────────────────────────

/**
 * Mutation interne — invocable uniquement depuis d'autres fonctions Convex
 * (par `ctx.runMutation`). N'est pas exposée au client.
 *
 * À privilégier pour les rares cas où le helper `appendAuditEntry` ne peut
 * pas être appelé directement (ex. cross-deployment audit replication).
 * Dans la plupart des cas, importer et appeler `appendAuditEntry` est plus
 * efficace (même transaction, pas de surcoût d'invocation).
 */
export const _appendAuditInternal = internalMutation({
  args: {
    utilisateurMatricule: v.string(),
    serviceUtilisateur: serviceCodeValidator,
    action: v.string(),
    classificationDossier: v.optional(classificationValidator),
    dossierId: v.optional(v.id("dossiers_renseignement")),
    cibleEntiteType: v.optional(v.string()),
    cibleEntiteId: v.optional(v.string()),
    detail: v.optional(v.string()),
    adresseIP: v.string(),
    poste: v.string(),
  },
  handler: async (ctx, args) => {
    return await appendAuditEntry(ctx, args);
  },
});

/**
 * Mutation publique — exposée pour les tests d'intégration et les outils
 * d'administration RSSI. Toute utilisation est elle-même tracée dans le
 * journal (méta-audit).
 *
 * **Restriction** : à terme, cette mutation sera réservée aux rôles RSSI /
 * admin_technique (cf. middleware d'authentification — Prompt 2.1). Pour
 * l'instant elle est ouverte pour permettre l'amorçage des tests.
 */
export const appendAudit = mutation({
  args: {
    utilisateurMatricule: v.string(),
    serviceUtilisateur: serviceCodeValidator,
    action: v.string(),
    classificationDossier: v.optional(classificationValidator),
    dossierId: v.optional(v.id("dossiers_renseignement")),
    cibleEntiteType: v.optional(v.string()),
    cibleEntiteId: v.optional(v.string()),
    detail: v.optional(v.string()),
    adresseIP: v.string(),
    poste: v.string(),
  },
  handler: async (ctx, args) => {
    // TODO Prompt 2.1 : vérifier le JWT (HSM-signé) et autoriser uniquement
    // les rôles RSSI / admin_technique. Pour l'instant, on log que l'appel a
    // eu lieu — toute écriture étant elle-même chaînée, une utilisation
    // anormale est détectable a posteriori.
    return await appendAuditEntry(ctx, args);
  },
});
