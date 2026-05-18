// Cellule CNS — Moteur de croisement multi-services (Prompt 4.2, EF-02)
// Référence : NTSAGUI/CNS/CDC/2026/001 §2.2

import { mutation, query, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { appendAuditEntry } from "../audit";
import { requireAuth, requireAuthInQuery, requireRole } from "../auth/middleware";
import { hasClassificationAccess } from "../validators/classification";

// ──────────────────────────────────────────────────────────────────────
// Hash HMAC pour indexer les valeurs sensibles (matricules d'individus)
// sans les exposer en clair dans les index.
// ──────────────────────────────────────────────────────────────────────

async function tagHash(tagType: string, value: string): Promise<string> {
  const secret = (globalThis as any).process?.env?.ICNS_TAG_INDEX_KEY ?? "DEV_TAG_INDEX_KEY_32_chars_PLEASE";
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const msg = `${tagType}|${value.toLowerCase().trim()}`;
  const buf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
  const bytes = new Uint8Array(buf);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, "0");
  return hex;
}

function normalize(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // remove diacritics
    .toLowerCase()
    .trim();
}

// ──────────────────────────────────────────────────────────────────────
// Indexation
// ──────────────────────────────────────────────────────────────────────

export const indexDossierTags = mutation({
  args: {
    jwt: v.string(),
    dossierId: v.id("dossiers_renseignement"),
    tags: v.array(
      v.object({
        type: v.union(
          v.literal("mot_cle"),
          v.literal("individu"),
          v.literal("organisation"),
          v.literal("lieu"),
          v.literal("periode"),
        ),
        value: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const auth = await requireAuth(ctx, args.jwt);
    requireRole(auth, ["analyste_cns", "sg_cns", "chef_section", "directeur_service"]);

    const dossier = await ctx.db.get(args.dossierId);
    if (!dossier) throw new Error("Dossier introuvable.");

    const now = Date.now();
    const insertedHashes: string[] = [];
    for (const t of args.tags) {
      const value = normalize(t.value);
      if (value.length < 2) continue;
      const hash = await tagHash(t.type, value);
      await ctx.db.insert("cns_dossier_tags", {
        dossierId: args.dossierId,
        tagType: t.type,
        tagValue: t.type === "individu" ? "" : value, // anonymiser les individus
        tagHash: hash,
        classification: dossier.classification,
        serviceProducteurCode: dossier.serviceProducteurCode,
        indexedAt: now,
      });
      insertedHashes.push(hash);
    }

    await appendAuditEntry(ctx, {
      utilisateurMatricule: auth.matricule,
      serviceUtilisateur: auth.service,
      action: "CNS_TAGS_INDEXES",
      dossierId: args.dossierId,
      classificationDossier: dossier.classification,
      detail: `${insertedHashes.length} tags indexés`,
      adresseIP: auth.sessionDoc.adresseIPOuverture,
      poste: auth.sessionDoc.posteOuverture,
    });

    return { inserted: insertedHashes.length };
  },
});

// ──────────────────────────────────────────────────────────────────────
// Recherche
// ──────────────────────────────────────────────────────────────────────

/**
 * Recherche multi-critères : retourne les dossiers qui matchent l'arbre
 * d'expression booléenne. Pour simplicité (Phase 4), supportons :
 *   {must: [...], should: [...], mustNot: [...]}
 *   où chaque item est `{type, value}`.
 */
export const searchDossiers = query({
  args: {
    jwt: v.string(),
    criteres: v.object({
      must: v.array(
        v.object({
          type: v.union(
            v.literal("mot_cle"),
            v.literal("individu"),
            v.literal("organisation"),
            v.literal("lieu"),
            v.literal("periode"),
          ),
          value: v.string(),
        }),
      ),
      should: v.optional(
        v.array(
          v.object({
            type: v.union(
              v.literal("mot_cle"),
              v.literal("individu"),
              v.literal("organisation"),
              v.literal("lieu"),
              v.literal("periode"),
            ),
            value: v.string(),
          }),
        ),
      ),
      mustNot: v.optional(
        v.array(
          v.object({
            type: v.union(
              v.literal("mot_cle"),
              v.literal("individu"),
              v.literal("organisation"),
              v.literal("lieu"),
              v.literal("periode"),
            ),
            value: v.string(),
          }),
        ),
      ),
    }),
  },
  handler: async (ctx, args) => {
    const auth = await requireAuthInQuery(ctx, args.jwt);
    requireRole(auth, ["analyste_cns", "sg_cns", "auditeur"]);

    // Habilitations
    const habilitations = await ctx.db
      .query("habilitations")
      .withIndex("by_utilisateur_actif", (q) =>
        q.eq("utilisateurMatricule", auth.matricule).eq("revoque", false),
      )
      .collect();
    const maxClass = habilitations.reduce<"DR" | "CD" | "SD" | "TSD">(
      (acc, h) => {
        const order = { DR: 0, CD: 1, SD: 2, TSD: 3 };
        return order[h.classificationMax] > order[acc] ? h.classificationMax : acc;
      },
      "DR",
    );

    // 1. MUST : intersection des dossierIds qui contiennent chacun des tags
    const mustHashes = await Promise.all(
      args.criteres.must.map(async (c) => await tagHash(c.type, normalize(c.value))),
    );
    let candidateIds: Set<string> | null = null;
    for (const h of mustHashes) {
      const matches = await ctx.db
        .query("cns_dossier_tags")
        .withIndex("by_tag_hash", (q) => q.eq("tagHash", h))
        .collect();
      const ids = new Set(matches.map((m) => m.dossierId.toString()));
      candidateIds = candidateIds ? intersect(candidateIds, ids) : ids;
      if (candidateIds.size === 0) break;
    }
    if (!candidateIds) candidateIds = new Set();

    // 2. MUST NOT : retire les dossierIds qui ont l'un des tags
    if (args.criteres.mustNot) {
      const mustNotHashes = await Promise.all(
        args.criteres.mustNot.map(async (c) => await tagHash(c.type, normalize(c.value))),
      );
      for (const h of mustNotHashes) {
        const matches = await ctx.db
          .query("cns_dossier_tags")
          .withIndex("by_tag_hash", (q) => q.eq("tagHash", h))
          .collect();
        for (const m of matches) candidateIds.delete(m.dossierId.toString());
      }
    }

    // 3. SHOULD : booste le score mais ne filtre pas
    const shouldHashes = args.criteres.should
      ? await Promise.all(
          args.criteres.should.map(async (c) => await tagHash(c.type, normalize(c.value))),
        )
      : [];
    const boost = new Map<string, number>();
    for (const h of shouldHashes) {
      const matches = await ctx.db
        .query("cns_dossier_tags")
        .withIndex("by_tag_hash", (q) => q.eq("tagHash", h))
        .collect();
      for (const m of matches) {
        const k = m.dossierId.toString();
        boost.set(k, (boost.get(k) ?? 0) + 1);
      }
    }

    // 4. Charger les dossiers et filtrer par habilitation
    const results: Array<{
      dossierId: string;
      reference: string;
      classification: string;
      service: string;
      score: number;
    }> = [];
    for (const idStr of candidateIds) {
      const dossier = await ctx.db.get(idStr as any);
      if (!dossier) continue;
      if (!hasClassificationAccess(maxClass, dossier.classification)) continue;
      results.push({
        dossierId: dossier._id,
        reference: dossier.reference,
        classification: dossier.classification,
        service: dossier.serviceProducteurCode,
        score: 1 + (boost.get(idStr) ?? 0),
      });
    }
    results.sort((a, b) => b.score - a.score);
    return results;
  },
});

function intersect(a: Set<string>, b: Set<string>): Set<string> {
  const out = new Set<string>();
  for (const x of a) if (b.has(x)) out.add(x);
  return out;
}

// ──────────────────────────────────────────────────────────────────────
// Détection automatique de convergences
// ──────────────────────────────────────────────────────────────────────

const CONVERGENCE_THRESHOLD_DEFAULT = 3;

export const detectConvergencesCron = internalMutation({
  args: {},
  handler: async (ctx) => {
    const threshold = Number(
      (globalThis as any).process?.env?.ICNS_CONVERGENCE_THRESHOLD ?? CONVERGENCE_THRESHOLD_DEFAULT,
    );
    // Récupérer tous les tags récents (24h)
    const since = Date.now() - 24 * 60 * 60 * 1000;
    const recentTags = await ctx.db
      .query("cns_dossier_tags")
      .order("desc")
      .take(10_000);

    // Map tagHash → liste de {dossierId, service, classification}
    const byTag = new Map<
      string,
      Array<{ dossierId: any; service: string; classification: string }>
    >();
    for (const t of recentTags) {
      if (t.indexedAt < since) continue;
      const arr = byTag.get(t.tagHash) ?? [];
      arr.push({
        dossierId: t.dossierId,
        service: t.serviceProducteurCode,
        classification: t.classification,
      });
      byTag.set(t.tagHash, arr);
    }

    // Trouver les paires/triplets de dossiers de services différents
    // partageant au moins `threshold` tags.
    // Approche : pour chaque tag avec ≥ 2 dossiers de services différents,
    // on liste les paires. Puis on agrège par paire et compte.
    const pairCounts = new Map<string, { count: number; tags: string[]; services: Set<string>; ids: any[] }>();
    for (const [tagHashKey, arr] of byTag) {
      if (arr.length < 2) continue;
      const distinctServices = new Set(arr.map((x) => x.service));
      if (distinctServices.size < 2) continue; // ignorer les tags intra-service
      for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < arr.length; j++) {
          if (arr[i].service === arr[j].service) continue;
          const a = String(arr[i].dossierId);
          const b = String(arr[j].dossierId);
          const k = a < b ? `${a}|${b}` : `${b}|${a}`;
          const cur = pairCounts.get(k) ?? {
            count: 0,
            tags: [],
            services: new Set<string>(),
            ids: [arr[i].dossierId, arr[j].dossierId],
          };
          cur.count++;
          cur.tags.push(tagHashKey);
          cur.services.add(arr[i].service);
          cur.services.add(arr[j].service);
          pairCounts.set(k, cur);
        }
      }
    }

    let inserted = 0;
    for (const [, info] of pairCounts) {
      if (info.count < threshold) continue;

      // Vérifier qu'une convergence identique n'existe pas déjà
      const existing = await ctx.db
        .query("cns_convergences")
        .withIndex("by_detection")
        .order("desc")
        .take(500);
      const alreadyKnown = existing.some(
        (c) =>
          c.dossierIds.length === info.ids.length &&
          c.dossierIds.every((d) => info.ids.includes(d)),
      );
      if (alreadyKnown) continue;

      await ctx.db.insert("cns_convergences", {
        dossierIds: info.ids,
        tagHashesCommuns: info.tags,
        services: Array.from(info.services),
        score: info.count,
        detecteeAt: Date.now(),
        statut: "nouvelle",
      });
      inserted++;
    }
    return { inserted, pairsExamined: pairCounts.size };
  },
});

export const listConvergencesNouvelles = query({
  args: { jwt: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const auth = await requireAuthInQuery(ctx, args.jwt);
    requireRole(auth, ["analyste_cns", "sg_cns"]);

    return await ctx.db
      .query("cns_convergences")
      .withIndex("by_statut", (q) => q.eq("statut", "nouvelle"))
      .order("desc")
      .take(args.limit ?? 50);
  },
});
