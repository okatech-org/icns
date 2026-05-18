// Tâches planifiées Convex iCNS
// Référence : NTSAGUI/CNS/CDC/2026/001 — différents prompts

import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// ─── iCom — escalade Flash non lues (Prompt 4.1) ─────────────────────
// Vérification toutes les 5 minutes ; seuil de 1h porté par le helper.
crons.interval(
  "icom-flash-escalade",
  { minutes: 5 },
  internal.icom.escalate.escalateFlashCommunications,
);

// ─── iArchive — versement automatique selon rétention (Prompt 5.1) ───
// Vérification quotidienne à 03:00.
crons.daily(
  "iarchive-retention-check",
  { hourUTC: 3, minuteUTC: 0 },
  internal.iarchive.retention.archiverDossiersExpires,
);

// ─── iArchive — exports de chaînes d'audit out-of-band (EF-08.3) ─────
// Export toutes les 24h à 04:00.
crons.daily(
  "audit-out-of-band-export",
  { hourUTC: 4, minuteUTC: 0 },
  internal.iarchive.retention.exporterChaineAudit,
);

export default crons;
