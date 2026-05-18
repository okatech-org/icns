// iCom — Queries de lecture (Prompt 4.1)

import { query } from "../_generated/server";
import { v } from "convex/values";
import { requireAuthInQuery } from "../auth/middleware";

/**
 * Liste les communications adressées au service de l'utilisateur.
 * Les Flash en attente d'accusé apparaissent en tête.
 */
export const listInbox = query({
  args: { jwt: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const auth = await requireAuthInQuery(ctx, args.jwt);
    const limit = args.limit ?? 100;

    const all = await ctx.db
      .query("icom_communications")
      .withIndex("by_destinataire", (q) => q.eq("destinataireService", auth.service))
      .order("desc")
      .take(limit);

    // Charger les accusés de l'utilisateur pour marquer "lu"
    const userAccuses = await ctx.db
      .query("icom_accuses")
      .withIndex("by_destinataire", (q) => q.eq("destinataireMatricule", auth.matricule))
      .collect();
    const accuseIds = new Set(userAccuses.map((a) => a.communicationId));

    return all.map((c) => ({
      _id: c._id,
      reference: c.reference,
      type: c.type,
      urgence: c.urgence,
      classification: c.classification,
      emetteurMatricule: c.emetteurMatricule,
      emetteurService: c.emetteurService,
      sentAt: c.sentAt,
      delaiReponseAttendueHeures: c.delaiReponseAttendueHeures,
      flashEscaladeStatut: c.flashEscaladeStatut,
      isAcknowledged: accuseIds.has(c._id),
    }));
  },
});

/**
 * Liste les communications émises par l'utilisateur (boîte d'envoi).
 */
export const listOutbox = query({
  args: { jwt: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const auth = await requireAuthInQuery(ctx, args.jwt);
    const limit = args.limit ?? 100;
    const all = await ctx.db
      .query("icom_communications")
      .withIndex("by_emetteur", (q) => q.eq("emetteurMatricule", auth.matricule))
      .order("desc")
      .take(limit);
    return all.map((c) => ({
      _id: c._id,
      reference: c.reference,
      type: c.type,
      urgence: c.urgence,
      destinataireService: c.destinataireService,
      sentAt: c.sentAt,
      flashEscaladeStatut: c.flashEscaladeStatut,
    }));
  },
});

/**
 * Récupère une communication avec ses réponses et accusés (méta seulement —
 * le déchiffrement de objet/corps se fait dans une mutation d'ouverture).
 */
export const getCom = query({
  args: { jwt: v.string(), communicationId: v.id("icom_communications") },
  handler: async (ctx, args) => {
    const auth = await requireAuthInQuery(ctx, args.jwt);
    const comm = await ctx.db.get(args.communicationId);
    if (!comm) return null;

    // Visibilité : destinataire OU émetteur OU SG-CNS
    const isVisible =
      comm.emetteurMatricule === auth.matricule ||
      comm.destinataireService === auth.service ||
      (comm.destinatairesIndividuels ?? []).includes(auth.matricule) ||
      auth.role === "sg_cns";
    if (!isVisible) return null;

    const reponses = await ctx.db
      .query("icom_reponses")
      .withIndex("by_communication", (q) => q.eq("communicationId", args.communicationId))
      .collect();
    const accuses = await ctx.db
      .query("icom_accuses")
      .withIndex("by_communication", (q) => q.eq("communicationId", args.communicationId))
      .collect();

    return {
      _id: comm._id,
      reference: comm.reference,
      type: comm.type,
      urgence: comm.urgence,
      classification: comm.classification,
      emetteurMatricule: comm.emetteurMatricule,
      emetteurService: comm.emetteurService,
      destinataireService: comm.destinataireService,
      destinatairesIndividuels: comm.destinatairesIndividuels,
      encryptedObjet: comm.encryptedObjet,
      encryptedCorps: comm.encryptedCorps,
      sentAt: comm.sentAt,
      delaiReponseAttendueHeures: comm.delaiReponseAttendueHeures,
      flashEscaladeStatut: comm.flashEscaladeStatut,
      dossierId: comm.dossierId,
      reponses: reponses.map((r) => ({
        _id: r._id,
        emetteurMatricule: r.emetteurMatricule,
        emetteurService: r.emetteurService,
        encryptedCorps: r.encryptedCorps,
        sentAt: r.sentAt,
        parentReponseId: r.parentReponseId,
      })),
      accuses: accuses.map((a) => ({
        destinataireMatricule: a.destinataireMatricule,
        luAt: a.luAt,
      })),
    };
  },
});
