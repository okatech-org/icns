// Création d'un dossier de renseignement — Prompt 3.2
// Référence : NTSAGUI/CNS/CDC/2026/001 §2.1 (EF-01.1, EF-01.2)

import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { appendAuditEntry } from "../audit";
import { requireAuth, requireRole } from "../auth/middleware";
import {
  classificationValidator,
  urgenceValidator,
  type ClassificationValue,
} from "../validators/classification";
import { encrypt } from "../crypto/service";

// ──────────────────────────────────────────────────────────────────────
// Génération de la référence classifiée
// ──────────────────────────────────────────────────────────────────────

/**
 * Génère la prochaine référence pour un (typeCode, year, service, classification).
 *
 * Implémentation simple : compte les dossiers existants pour la combinaison
 * et incrémente. Sous Convex OCC, deux créations simultanées seront
 * sérialisées (l'une sera retentée et obtiendra une séquence différente).
 *
 * Le pattern est lu depuis `schemas_reference.pattern`. Tokens supportés :
 *   {code} {yyyy} {service} {classification} {seq}
 */
async function generateReference(
  ctx: { db: any },
  pattern: string,
  seqWidth: number,
  args: {
    typeCode: string;
    year: number;
    service: string;
    classification: ClassificationValue;
  },
): Promise<string> {
  // Compter combien de dossiers existent déjà avec un prefix compatible.
  const allYear = await ctx.db
    .query("dossiers_renseignement")
    .withIndex("by_service_producteur")
    .filter((q: any) =>
      q.and(
        q.eq(q.field("serviceProducteurCode"), args.service),
        q.eq(q.field("classification"), args.classification),
      ),
    )
    .collect();
  // On filtre par année dans la référence (le timestamp inclut l'année
  // mais on s'appuie sur le pattern pour ne pas dépendre du format)
  const sameYearPrefix = `${args.typeCode}/${args.year}/${args.service}/${args.classification}/`;
  const sameYear = (allYear as Array<{ reference: string }>).filter((d) =>
    d.reference.startsWith(sameYearPrefix),
  );
  const nextSeq = sameYear.length + 1;
  const seqStr = String(nextSeq).padStart(seqWidth, "0");

  return pattern
    .replaceAll("{code}", args.typeCode)
    .replaceAll("{yyyy}", String(args.year))
    .replaceAll("{service}", args.service)
    .replaceAll("{classification}", args.classification)
    .replaceAll("{seq}", seqStr);
}

// ──────────────────────────────────────────────────────────────────────
// Mutation
// ──────────────────────────────────────────────────────────────────────

export const createDossier = mutation({
  args: {
    jwt: v.string(),
    typeDossierId: v.id("types_dossier"),
    classification: classificationValidator,
    urgence: urgenceValidator,
    titre: v.string(), // sera chiffré côté serveur
    synthese: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const auth = await requireAuth(ctx, args.jwt);
    requireRole(auth, ["officier_traitant", "chef_section"]);

    // 1. Charger le type de dossier
    const typeDoc = await ctx.db.get(args.typeDossierId);
    if (!typeDoc || !typeDoc.actif) {
      throw new Error("Type de dossier inconnu ou inactif.");
    }

    // 2. Vérifier que le service de l'utilisateur est autorisé
    if (!typeDoc.servicesProducteursAutorises.includes(auth.service)) {
      throw new Error(
        `Le service ${auth.service} n'est pas autorisé à produire des dossiers de type ${typeDoc.code}.`,
      );
    }

    // 3. Vérifier que la classification demandée >= classification minimale du type
    const order = { DR: 0, CD: 1, SD: 2, TSD: 3 };
    if (order[args.classification] < order[typeDoc.classificationMin]) {
      throw new Error(
        `Classification ${args.classification} < classification minimale ${typeDoc.classificationMin} du type ${typeDoc.code}.`,
      );
    }

    // 4. Charger le schéma de référence et générer la référence
    const schemaRef = await ctx.db.get(typeDoc.schemaReferenceId);
    if (!schemaRef) throw new Error("Schéma de référence introuvable.");

    const year = new Date().getFullYear();
    const reference = await generateReference(
      ctx,
      schemaRef.pattern,
      schemaRef.seqWidth,
      {
        typeCode: typeDoc.code,
        year,
        service: auth.service,
        classification: args.classification,
      },
    );

    // 5. Chiffrer le titre et la synthèse (contextKey = "dossier:<reference>")
    const contextKey = `dossier:${reference}`;
    const encryptedTitre = await encrypt(args.titre, contextKey);
    const encryptedSynthese = args.synthese
      ? await encrypt(args.synthese, contextKey)
      : undefined;

    // 6. Calculer le hash d'intégrité initial
    const hashSeed = [
      reference,
      args.classification,
      args.urgence,
      auth.matricule,
      year,
    ].join("|");
    const hashBytes = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(hashSeed),
    );
    let hashIntegrite = "";
    for (const b of new Uint8Array(hashBytes)) {
      hashIntegrite += b.toString(16).padStart(2, "0");
    }

    // 7. Insérer le dossier
    const now = Date.now();
    const dossierId = await ctx.db.insert("dossiers_renseignement", {
      reference,
      typeDossierId: args.typeDossierId,
      classification: args.classification,
      urgence: args.urgence,
      statut: "constitution",
      serviceProducteurCode: auth.service,
      currentEtapeIndex: 0,
      encryptedTitre,
      encryptedSynthese,
      hashIntegrite,
      createdByMatricule: auth.matricule,
      createdAt: now,
      updatedAt: now,
    });

    // 8. Créer la première étape du parcours
    const firstStep = typeDoc.parcours.find((p) => p.index === 0);
    if (firstStep) {
      await ctx.db.insert("etapes_parcours", {
        dossierId,
        etapeIndex: 0,
        etapeCode: firstStep.code,
        etapeLabel: firstStep.label,
        contributeursMatricules: [auth.matricule],
        dateEntree: now,
        suspendue: false,
        etat: "en_cours",
      });
    }

    // 9. Audit
    await appendAuditEntry(ctx, {
      utilisateurMatricule: auth.matricule,
      serviceUtilisateur: auth.service,
      action: "DOSSIER_CREE",
      dossierId,
      classificationDossier: args.classification,
      detail: `Création dossier ${reference}`,
      adresseIP: auth.sessionDoc.adresseIPOuverture,
      poste: auth.sessionDoc.posteOuverture,
    });

    return { dossierId, reference };
  },
});
