// iCom — Escalade automatique des Flash non lues après 1h (Prompt 4.1, EF-07.6)
//
// Lancée par un cron Convex toutes les 5 minutes (cf. `convex/crons.ts`).
// Toute communication Flash dont `flashEscaladeStatut == "en_attente"` et
// dont `sentAt < now - 1h` ET pour laquelle aucun accusé n'a été enregistré
// est escaladée :
//   - statut basculé en `escaladee`
//   - une notification (entrée d'audit + future iCom vers SG-CNS) est créée
//   - alerte transmise au SG-CNS

import { internalMutation } from "../_generated/server";
import { appendAuditEntry } from "../audit";

const ONE_HOUR_MS = 60 * 60 * 1000;

export const escalateFlashCommunications = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const cutoff = now - ONE_HOUR_MS;

    const pending = await ctx.db
      .query("icom_communications")
      .withIndex("by_flash_pending", (q) =>
        q.eq("urgence", "flash").eq("flashEscaladeStatut", "en_attente"),
      )
      .collect();

    let escaladeCount = 0;
    for (const comm of pending) {
      if (comm.sentAt > cutoff) continue; // moins d'1h écoulée

      // Vérifier si lue par au moins 1 destinataire
      const accuse = await ctx.db
        .query("icom_accuses")
        .withIndex("by_communication", (q) => q.eq("communicationId", comm._id))
        .first();
      if (accuse) {
        // Lue → désactiver l'escalade
        await ctx.db.patch(comm._id, { flashEscaladeStatut: "non_applicable" });
        continue;
      }

      // Sinon : escalade
      await ctx.db.patch(comm._id, {
        flashEscaladeStatut: "escaladee",
        flashEscaladeAt: now,
      });

      // Tracer dans le journal d'audit chaîné
      await appendAuditEntry(ctx, {
        utilisateurMatricule: "SYSTEM",
        serviceUtilisateur: "B2", // placeholder pour les actions système
        action: "ICOM_FLASH_ESCALADE",
        classificationDossier: comm.classification,
        cibleEntiteType: "icom_communications",
        cibleEntiteId: comm._id,
        detail: `Escalade automatique au SG-CNS : Flash ${comm.reference} non lue après 1h (destinataire ${comm.destinataireService}).`,
        adresseIP: "127.0.0.1",
        poste: "CRON_ESCALADE",
      });

      // TODO Phase 4 finale : créer aussi une communication iCom de
      // type "directive" depuis le système vers le SG-CNS pour
      // matérialiser l'alerte dans son inbox. Ici on se contente du
      // marquage + audit ; le cockpit SG-CNS interroge `flashEscaladeStatut`.

      escaladeCount++;
    }

    return { processed: pending.length, escalated: escaladeCount, at: now };
  },
});
