// Vérification d'intégrité de la chaîne d'audit iCNS
// Référence : NTSAGUI/CNS/CDC/2026/001 §2.8 (EF-08.5) — Prompt 1.2
//
// Une query qui parcourt l'intégralité du journal et recalcule chaque hash
// pour détecter toute rupture de chaîne. Destinée :
// - aux audits internes RSSI ;
// - à la vérification cryptographique par un tiers indépendant (EF-08.5).
//
// Performance attendue : pour un journal de 100k entrées, la vérification
// complète tourne en quelques secondes. Au-delà, paginer (voir TODO en bas).

import { query } from "./_generated/server";
import { v } from "convex/values";
import { GENESIS_HASH, serializeAuditEntry, sha256Hex } from "./audit";

// ──────────────────────────────────────────────────────────────────────
// Types de retour
// ──────────────────────────────────────────────────────────────────────

export type AuditBreakReason =
  | "hash_courant_invalide" // Le hash stocké ne correspond pas au recalcul
  | "hash_precedent_invalide" // hashEntreePrecedente ne pointe pas sur l'entrée précédente
  | "sequence_non_continue" // sequence saute (lacune ou doublon)
  | "genesis_inattendu" // hashEntreePrecedente == GENESIS sur une entrée > 1
  | "genesis_manquant"; // 1re entrée n'a pas GENESIS comme prev

export interface AuditBreak {
  sequence: number;
  reason: AuditBreakReason;
  hashAttendu?: string;
  hashEffectif?: string;
  detail?: string;
}

export interface AuditVerificationReport {
  ok: boolean;
  totalEntries: number;
  premierEcartSequence: number | null;
  ecarts: AuditBreak[];
  derniereSequence: number;
  derniereEntreeHash: string | null;
  verifieALe: number; // millis epoch
}

// ──────────────────────────────────────────────────────────────────────
// Queries
// ──────────────────────────────────────────────────────────────────────

/**
 * Parcourt l'intégralité du journal d'audit et vérifie la chaîne SHA-256.
 *
 * Retourne un rapport structuré listant tous les écarts détectés. Si la
 * chaîne est intacte, `ok = true` et `ecarts = []`.
 *
 * Cette query est sécurisée à la lecture (pas de modification). Tout RSSI
 * habilité peut l'invoquer. À terme, l'accès sera restreint par auth
 * (Prompt 2.1).
 */
export const verifyAuditChain = query({
  args: {
    // Limite optionnelle pour la vérification — utile en dev / test.
    // En production, omettre pour scanner tout le journal.
    maxEntries: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<AuditVerificationReport> => {
    const entries = await ctx.db
      .query("journal_audit")
      .withIndex("by_sequence")
      .order("asc")
      .take(args.maxEntries ?? 1_000_000);

    const ecarts: AuditBreak[] = [];
    let premierEcartSequence: number | null = null;
    let attendueSequence = 1;
    let hashPrecedentAttendu = GENESIS_HASH;

    for (const entry of entries) {
      // 1. Continuité de la séquence
      if (entry.sequence !== attendueSequence) {
        const ecart: AuditBreak = {
          sequence: entry.sequence,
          reason: "sequence_non_continue",
          detail: `Séquence attendue ${attendueSequence}, trouvée ${entry.sequence}`,
        };
        ecarts.push(ecart);
        premierEcartSequence ??= entry.sequence;
        // On continue avec la séquence trouvée pour ne pas masquer d'autres écarts.
        attendueSequence = entry.sequence;
      }

      // 2. hashEntreePrecedente correct
      if (entry.hashEntreePrecedente !== hashPrecedentAttendu) {
        const isFirst = entry.sequence === 1;
        if (isFirst && entry.hashEntreePrecedente !== GENESIS_HASH) {
          ecarts.push({
            sequence: entry.sequence,
            reason: "genesis_manquant",
            hashAttendu: GENESIS_HASH,
            hashEffectif: entry.hashEntreePrecedente,
          });
          premierEcartSequence ??= entry.sequence;
        } else if (!isFirst && entry.hashEntreePrecedente === GENESIS_HASH) {
          ecarts.push({
            sequence: entry.sequence,
            reason: "genesis_inattendu",
            hashAttendu: hashPrecedentAttendu,
            hashEffectif: entry.hashEntreePrecedente,
          });
          premierEcartSequence ??= entry.sequence;
        } else {
          ecarts.push({
            sequence: entry.sequence,
            reason: "hash_precedent_invalide",
            hashAttendu: hashPrecedentAttendu,
            hashEffectif: entry.hashEntreePrecedente,
          });
          premierEcartSequence ??= entry.sequence;
        }
      }

      // 3. Recalcul du hash courant
      const payload = serializeAuditEntry({
        sequence: entry.sequence,
        utilisateurMatricule: entry.utilisateurMatricule,
        serviceUtilisateur: entry.serviceUtilisateur,
        action: entry.action,
        classificationDossier: entry.classificationDossier ?? undefined,
        dossierId: entry.dossierId ?? undefined,
        cibleEntiteType: entry.cibleEntiteType ?? undefined,
        cibleEntiteId: entry.cibleEntiteId ?? undefined,
        detail: entry.detail ?? undefined,
        horodatage: entry.horodatage,
        adresseIP: entry.adresseIP,
        poste: entry.poste,
        hashEntreePrecedente: entry.hashEntreePrecedente,
      });
      const hashRecalcule = await sha256Hex(payload);

      if (hashRecalcule !== entry.hashEntreeCourante) {
        ecarts.push({
          sequence: entry.sequence,
          reason: "hash_courant_invalide",
          hashAttendu: hashRecalcule,
          hashEffectif: entry.hashEntreeCourante,
        });
        premierEcartSequence ??= entry.sequence;
      }

      // Préparer l'itération suivante
      hashPrecedentAttendu = entry.hashEntreeCourante;
      attendueSequence = entry.sequence + 1;
    }

    return {
      ok: ecarts.length === 0,
      totalEntries: entries.length,
      premierEcartSequence,
      ecarts,
      derniereSequence: entries.length > 0 ? entries[entries.length - 1].sequence : 0,
      derniereEntreeHash:
        entries.length > 0 ? entries[entries.length - 1].hashEntreeCourante : null,
      verifieALe: Date.now(),
    };
  },
});

/**
 * Retourne le hash et la séquence de la dernière entrée du journal.
 *
 * Utile pour les sauvegardes externes (out-of-band) qui doivent prouver
 * qu'elles ont capturé un état figé du journal à un instant T. La
 * sauvegarde stocke `{ sequence, hash, timestamp }` et le RSSI peut
 * comparer.
 */
export const getLastAuditHash = query({
  args: {},
  handler: async (ctx) => {
    const last = await ctx.db
      .query("journal_audit")
      .withIndex("by_sequence")
      .order("desc")
      .first();
    if (!last) {
      return { sequence: 0, hash: null as string | null, horodatage: null as number | null };
    }
    return {
      sequence: last.sequence,
      hash: last.hashEntreeCourante,
      horodatage: last.horodatage,
    };
  },
});

// TODO Phase 6 (Prompt 6.1 — tests de charge) : pour un journal > 1M entrées,
// implémenter une vérification paginée :
// - query `verifyAuditChainSlice(from, to, previousHash)` qui vérifie un
//   intervalle [from, to] en partant d'un hash précédent fourni ;
// - orchestration côté outil RSSI qui chaîne les slices et agrège les écarts.
// Cela permet de scanner un journal massif sans dépasser le budget temps
// d'une seule query Convex.
