// Queries de lecture sur les dossiers — Prompt 3.2 / Phase 3
//
// Toutes les lectures sont gardées par requireAuthInQuery. Pour les
// classifications SD/TSD, la consultation est en plus tracée
// individuellement par les mutations qui exposent le déchiffrement.

import { query } from "../_generated/server";
import { v } from "convex/values";
import { requireAuthInQuery } from "../auth/middleware";
import { hasClassificationAccess } from "../validators/classification";

/**
 * Liste les dossiers visibles pour l'utilisateur connecté.
 *
 * Règles de visibilité (simplifiées pour Phase 3) :
 *   - officier_traitant / chef_section / directeur_service : voient les
 *     dossiers de leur service uniquement.
 *   - analyste_cns / sg_cns : voient tous les dossiers `transmis_cns` et
 *     `cloture_*` (cf. EF-02.1).
 *   - rssi / auditeur : voient tout pour audit (sans déchiffrement du contenu).
 *   - admin_technique : pas d'accès au contenu, juste métadonnées.
 *
 * Filtrage habilitation (classification ≤ habilitation.classificationMax)
 * appliqué en post-traitement.
 */
export const listDossiers = query({
  args: {
    jwt: v.string(),
    statut: v.optional(v.string()),
    serviceCode: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const auth = await requireAuthInQuery(ctx, args.jwt);
    const limit = args.limit ?? 100;

    // Charger les habilitations actives de l'utilisateur
    const habilitations = await ctx.db
      .query("habilitations")
      .withIndex("by_utilisateur_actif", (q) =>
        q.eq("utilisateurMatricule", auth.matricule).eq("revoque", false),
      )
      .collect();

    const maxHabilitation = habilitations.reduce<
      "DR" | "CD" | "SD" | "TSD"
    >((acc, h) => {
      const order = { DR: 0, CD: 1, SD: 2, TSD: 3 };
      return order[h.classificationMax] > order[acc] ? h.classificationMax : acc;
    }, "DR");

    let qb = ctx.db.query("dossiers_renseignement");

    // Filtrage selon rôle
    if (
      auth.role === "officier_traitant" ||
      auth.role === "chef_section" ||
      auth.role === "directeur_service"
    ) {
      qb = qb.withIndex("by_service_producteur", (q) =>
        q.eq("serviceProducteurCode", auth.service),
      );
    } else if (auth.role === "analyste_cns" || auth.role === "sg_cns") {
      // Voit tous les dossiers transmis ou clôturés — on ne filtre pas par index
      // mais par statut en post-traitement (pour Phase 3 simple).
    }

    const all = await qb.order("desc").take(limit * 2); // marge pour le filtrage

    let filtered = all;
    if (args.statut) {
      filtered = filtered.filter((d) => d.statut === args.statut);
    }
    if (args.serviceCode) {
      filtered = filtered.filter((d) => d.serviceProducteurCode === args.serviceCode);
    }
    if (auth.role === "analyste_cns" || auth.role === "sg_cns") {
      filtered = filtered.filter(
        (d) =>
          d.statut === "transmis_cns" ||
          d.statut === "cloture_positif" ||
          d.statut === "cloture_negatif" ||
          d.statut === "cloture_administratif",
      );
    }

    // Filtrage habilitation
    filtered = filtered.filter((d) =>
      hasClassificationAccess(maxHabilitation, d.classification),
    );

    return filtered.slice(0, limit).map((d) => ({
      _id: d._id,
      reference: d.reference,
      classification: d.classification,
      urgence: d.urgence,
      statut: d.statut,
      serviceProducteurCode: d.serviceProducteurCode,
      currentEtapeIndex: d.currentEtapeIndex,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
      transmittedAt: d.transmittedAt,
      // titre / synthese restent chiffrés — déchiffrement uniquement à l'ouverture
    }));
  },
});

/**
 * Récupère un dossier (sans déchiffrement). Le déchiffrement se fait
 * côté serveur dans une mutation `openDossier` (à venir) qui trace
 * la consultation pour SD/TSD.
 */
export const getDossier = query({
  args: { jwt: v.string(), dossierId: v.id("dossiers_renseignement") },
  handler: async (ctx, args) => {
    const auth = await requireAuthInQuery(ctx, args.jwt);
    const dossier = await ctx.db.get(args.dossierId);
    if (!dossier) return null;

    // Filtrer par habilitation
    const habilitations = await ctx.db
      .query("habilitations")
      .withIndex("by_utilisateur_actif", (q) =>
        q.eq("utilisateurMatricule", auth.matricule).eq("revoque", false),
      )
      .collect();
    const ok = habilitations.some((h) =>
      hasClassificationAccess(h.classificationMax, dossier.classification),
    );
    if (!ok) return null;

    // Charger pièces et étapes (sans contenu chiffré)
    const pieces = await ctx.db
      .query("pieces")
      .withIndex("by_dossier", (q) => q.eq("dossierId", args.dossierId))
      .collect();
    const etapes = await ctx.db
      .query("etapes_parcours")
      .withIndex("by_dossier", (q) => q.eq("dossierId", args.dossierId))
      .collect();

    return {
      dossier: {
        _id: dossier._id,
        reference: dossier.reference,
        classification: dossier.classification,
        urgence: dossier.urgence,
        statut: dossier.statut,
        serviceProducteurCode: dossier.serviceProducteurCode,
        currentEtapeIndex: dossier.currentEtapeIndex,
        createdAt: dossier.createdAt,
        updatedAt: dossier.updatedAt,
        transmittedAt: dossier.transmittedAt,
        signedByDirecteurMatricule: dossier.signedByDirecteurMatricule,
        signatureAt: dossier.signatureAt,
      },
      pieces: pieces.map((p) => ({
        _id: p._id,
        typePiece: p.typePiece,
        libelle: p.libelle,
        fileName: p.fileName,
        fileSize: p.fileSize,
        mimeType: p.mimeType,
        hashIntegrite: p.hashIntegrite,
        addedAt: p.addedAt,
      })),
      etapes: etapes.map((e) => ({
        etapeIndex: e.etapeIndex,
        etapeCode: e.etapeCode,
        etapeLabel: e.etapeLabel,
        dateEntree: e.dateEntree,
        dateSortie: e.dateSortie,
        motifSortie: e.motifSortie,
        etat: e.etat,
      })),
    };
  },
});
