// iCom — Création d'une communication officielle (Prompt 4.1, EF-07)

import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { appendAuditEntry } from "../audit";
import { requireAuth } from "../auth/middleware";
import { classificationValidator } from "../validators/classification";
import { encrypt } from "../crypto/service";

const TYPE_CODE: Record<string, string> = {
  requisition: "REQ",
  note_coordination: "NCO",
  directive: "DIR",
  compte_rendu: "CRM",
  demande_eclaircissement: "DEM",
};

async function generateRef(
  ctx: { db: any },
  type: string,
  service: string,
): Promise<string> {
  const year = new Date().getFullYear();
  const code = TYPE_CODE[type] ?? "GEN";
  const existing = await ctx.db
    .query("icom_communications")
    .withIndex("by_sentAt")
    .order("desc")
    .take(2000); // marge
  const prefix = `${code}/${year}/${service}/`;
  const sameYear = (existing as Array<{ reference: string }>).filter((c) =>
    c.reference.startsWith(prefix),
  );
  const nextSeq = sameYear.length + 1;
  return `${prefix}${String(nextSeq).padStart(4, "0")}`;
}

export const createCom = mutation({
  args: {
    jwt: v.string(),
    type: v.union(
      v.literal("requisition"),
      v.literal("note_coordination"),
      v.literal("directive"),
      v.literal("compte_rendu"),
      v.literal("demande_eclaircissement"),
    ),
    urgence: v.union(
      v.literal("routine"),
      v.literal("urgent"),
      v.literal("flash"),
    ),
    classification: classificationValidator,
    destinataireService: v.string(),
    destinatairesIndividuels: v.optional(v.array(v.string())),
    objet: v.string(),
    corps: v.string(),
    signatureQualifieeBlob: v.string(),
    delaiReponseAttendueHeures: v.optional(v.number()),
    dossierId: v.optional(v.id("dossiers_renseignement")),
  },
  handler: async (ctx, args) => {
    const auth = await requireAuth(ctx, args.jwt);

    // EF-07.3 : signature qualifiée obligatoire
    if (!args.signatureQualifieeBlob || args.signatureQualifieeBlob.length < 16) {
      throw new Error("Signature qualifiée requise (EF-07.3).");
    }

    // Les directives ne peuvent être émises que par le SG-CNS
    if (args.type === "directive" && auth.role !== "sg_cns") {
      throw new Error("Seul le SG-CNS peut émettre des directives.");
    }

    const reference = await generateRef(ctx, args.type, auth.service);
    const now = Date.now();

    const contextKey = `icom:${reference}`;
    const encryptedObjet = await encrypt(args.objet, contextKey);
    const encryptedCorps = await encrypt(args.corps, contextKey);

    // Hash d'intégrité
    const seed = `${reference}|${args.classification}|${args.urgence}|${auth.matricule}|${args.destinataireService}|${now}`;
    const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(seed));
    let hashIntegrite = "";
    for (const b of new Uint8Array(h)) hashIntegrite += b.toString(16).padStart(2, "0");

    const commId = await ctx.db.insert("icom_communications", {
      reference,
      type: args.type,
      urgence: args.urgence,
      classification: args.classification,
      emetteurMatricule: auth.matricule,
      emetteurService: auth.service,
      destinataireService: args.destinataireService,
      destinatairesIndividuels: args.destinatairesIndividuels,
      encryptedObjet,
      encryptedCorps,
      hashIntegrite,
      signatureQualifieeBlob: args.signatureQualifieeBlob,
      signedAt: now,
      sentAt: now,
      delaiReponseAttendueHeures: args.delaiReponseAttendueHeures,
      dossierId: args.dossierId,
      flashEscaladeStatut: args.urgence === "flash" ? "en_attente" : "non_applicable",
    });

    await appendAuditEntry(ctx, {
      utilisateurMatricule: auth.matricule,
      serviceUtilisateur: auth.service,
      action: `ICOM_CREE_${args.type.toUpperCase()}`,
      dossierId: args.dossierId,
      classificationDossier: args.classification,
      cibleEntiteType: "icom_communications",
      cibleEntiteId: commId,
      detail: `${reference} (urgence ${args.urgence})`,
      adresseIP: auth.sessionDoc.adresseIPOuverture,
      poste: auth.sessionDoc.posteOuverture,
    });

    return { communicationId: commId, reference };
  },
});

/**
 * Marque une communication comme « lue » par un destinataire.
 * Génère un accusé de réception (idempotent par destinataire).
 */
export const acknowledgeCom = mutation({
  args: { jwt: v.string(), communicationId: v.id("icom_communications") },
  handler: async (ctx, args) => {
    const auth = await requireAuth(ctx, args.jwt);
    const comm = await ctx.db.get(args.communicationId);
    if (!comm) throw new Error("Communication introuvable.");

    // Vérifier que l'utilisateur est destinataire
    const isService = comm.destinataireService === auth.service;
    const isIndividual = (comm.destinatairesIndividuels ?? []).includes(auth.matricule);
    if (!isService && !isIndividual) {
      throw new Error("Cette communication ne vous est pas adressée.");
    }

    // Idempotence
    const existing = await ctx.db
      .query("icom_accuses")
      .withIndex("by_destinataire", (q) => q.eq("destinataireMatricule", auth.matricule))
      .collect();
    if (existing.some((a) => a.communicationId === args.communicationId)) {
      return { alreadyAcknowledged: true };
    }

    const now = Date.now();
    await ctx.db.insert("icom_accuses", {
      communicationId: args.communicationId,
      destinataireMatricule: auth.matricule,
      luAt: now,
      adresseIP: auth.sessionDoc.adresseIPOuverture,
      poste: auth.sessionDoc.posteOuverture,
    });

    // Si c'était Flash et que c'est la première lecture, désactiver l'escalade
    if (comm.urgence === "flash" && comm.flashEscaladeStatut === "en_attente") {
      await ctx.db.patch(args.communicationId, {
        flashEscaladeStatut: "non_applicable",
      });
    }

    await appendAuditEntry(ctx, {
      utilisateurMatricule: auth.matricule,
      serviceUtilisateur: auth.service,
      action: "ICOM_ACCUSE_RECEPTION",
      cibleEntiteType: "icom_communications",
      cibleEntiteId: args.communicationId,
      detail: `Accusé de réception sur ${comm.reference}`,
      adresseIP: auth.sessionDoc.adresseIPOuverture,
      poste: auth.sessionDoc.posteOuverture,
    });

    return { alreadyAcknowledged: false };
  },
});

/**
 * Répond à une communication (chaînage parent / sous-fil).
 */
export const replyCom = mutation({
  args: {
    jwt: v.string(),
    communicationId: v.id("icom_communications"),
    parentReponseId: v.optional(v.id("icom_reponses")),
    corps: v.string(),
    signatureQualifieeBlob: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const auth = await requireAuth(ctx, args.jwt);
    const comm = await ctx.db.get(args.communicationId);
    if (!comm) throw new Error("Communication introuvable.");

    const contextKey = `icom-reply:${comm.reference}:${Date.now()}`;
    const encryptedCorps = await encrypt(args.corps, contextKey);

    const repId = await ctx.db.insert("icom_reponses", {
      communicationId: args.communicationId,
      parentReponseId: args.parentReponseId,
      emetteurMatricule: auth.matricule,
      emetteurService: auth.service,
      encryptedCorps,
      sentAt: Date.now(),
      signatureQualifieeBlob: args.signatureQualifieeBlob,
    });

    await appendAuditEntry(ctx, {
      utilisateurMatricule: auth.matricule,
      serviceUtilisateur: auth.service,
      action: "ICOM_REPONSE",
      cibleEntiteType: "icom_communications",
      cibleEntiteId: args.communicationId,
      detail: `Réponse sur ${comm.reference}`,
      adresseIP: auth.sessionDoc.adresseIPOuverture,
      poste: auth.sessionDoc.posteOuverture,
    });

    return { reponseId: repId };
  },
});
