// Validateurs et helpers de classification iCNS
// Référence : NTSAGUI/CNS/CDC/2026/001 §2.4 (EF-04)
//
// Niveaux de classification (du moins au plus sensible) :
//   DR  — Diffusion Restreinte
//   CD  — Confidentiel Défense
//   SD  — Secret Défense
//   TSD — Très Secret Défense
//
// Règle d'accès (EF-04.2) :
//   accès autorisé ⇔ habilitation utilisateur ≥ classification du dossier
//                  ET appartenance au périmètre de besoin-d'en-connaître

import { v, type Infer } from "convex/values";

// ──────────────────────────────────────────────────────────────────────
// Classification — enum strict
// ──────────────────────────────────────────────────────────────────────

export const CLASSIFICATIONS = ["DR", "CD", "SD", "TSD"] as const;
export type Classification = (typeof CLASSIFICATIONS)[number];

export const classificationValidator = v.union(
  v.literal("DR"),
  v.literal("CD"),
  v.literal("SD"),
  v.literal("TSD"),
);

// Ordre des classifications utilisé pour la comparaison d'habilitations.
// Un index plus élevé = classification plus sensible.
const CLASSIFICATION_RANK: Record<Classification, number> = {
  DR: 0,
  CD: 1,
  SD: 2,
  TSD: 3,
};

/**
 * Indique si une habilitation `userMax` autorise l'accès à un contenu
 * de classification `dossierClass`. Renvoie true ssi userMax ≥ dossierClass.
 */
export function hasClassificationAccess(
  userMax: Classification,
  dossierClass: Classification,
): boolean {
  return CLASSIFICATION_RANK[userMax] >= CLASSIFICATION_RANK[dossierClass];
}

/**
 * Compare deux classifications. Retourne :
 *   -1 si a < b
 *    0 si a === b
 *    1 si a > b
 */
export function compareClassification(
  a: Classification,
  b: Classification,
): -1 | 0 | 1 {
  const diff = CLASSIFICATION_RANK[a] - CLASSIFICATION_RANK[b];
  if (diff < 0) return -1;
  if (diff > 0) return 1;
  return 0;
}

/**
 * Classifications SD et TSD nécessitent une traçabilité individuelle
 * de chaque consultation (EF-04.5).
 */
export function requiresIndividualTracking(c: Classification): boolean {
  return c === "SD" || c === "TSD";
}

// ──────────────────────────────────────────────────────────────────────
// Urgence — enum strict
// ──────────────────────────────────────────────────────────────────────

export const URGENCES = ["routine", "urgent", "flash"] as const;
export type Urgence = (typeof URGENCES)[number];

export const urgenceValidator = v.union(
  v.literal("routine"),
  v.literal("urgent"),
  v.literal("flash"),
);

// ──────────────────────────────────────────────────────────────────────
// Statut d'un dossier — machine d'états (EF-01)
// ──────────────────────────────────────────────────────────────────────

export const STATUTS_DOSSIER = [
  "constitution", // En cours de constitution par l'officier traitant
  "validation_section", // Soumis au chef de section
  "validation_direction", // Soumis au directeur pour signature
  "transmis_cns", // Transmis vers le secrétariat permanent CNS
  "renvoye_incomplet", // Renvoyé pour complément
  "suspendu", // Délais gelés
  "cloture_positif", // Clos avec suite positive
  "cloture_negatif", // Classé sans suite
  "cloture_administratif", // Clos pour raison administrative
  "archive", // Versé en iArchive
] as const;
export type StatutDossier = (typeof STATUTS_DOSSIER)[number];

export const statutDossierValidator = v.union(
  v.literal("constitution"),
  v.literal("validation_section"),
  v.literal("validation_direction"),
  v.literal("transmis_cns"),
  v.literal("renvoye_incomplet"),
  v.literal("suspendu"),
  v.literal("cloture_positif"),
  v.literal("cloture_negatif"),
  v.literal("cloture_administratif"),
  v.literal("archive"),
);

/** Statuts non modifiables (clôturés). */
export const STATUTS_TERMINAUX: ReadonlyArray<StatutDossier> = [
  "cloture_positif",
  "cloture_negatif",
  "cloture_administratif",
  "archive",
];

export function isStatutTerminal(s: StatutDossier): boolean {
  return STATUTS_TERMINAUX.includes(s);
}

// ──────────────────────────────────────────────────────────────────────
// Types de pièces (EF-01.3)
// ──────────────────────────────────────────────────────────────────────

export const TYPES_PIECE = [
  "note",
  "fiche_individu",
  "fiche_organisation",
  "piece_probante",
  "transcription",
  "rapport",
  "piece_procedure",
  "avis",
] as const;
export type TypePiece = (typeof TYPES_PIECE)[number];

export const typePieceValidator = v.union(
  v.literal("note"),
  v.literal("fiche_individu"),
  v.literal("fiche_organisation"),
  v.literal("piece_probante"),
  v.literal("transcription"),
  v.literal("rapport"),
  v.literal("piece_procedure"),
  v.literal("avis"),
);

// ──────────────────────────────────────────────────────────────────────
// Codes des 13 services bénéficiaires (CDC §1.3)
// ──────────────────────────────────────────────────────────────────────

export const SERVICE_CODES = [
  "B2",
  "DGDI",
  "DGR",
  "DGSS",
  "GR", // Garde Républicaine
  "GN", // Gendarmerie Nationale
  "FAG_TERRE",
  "FAG_AIR",
  "FAG_MARINE",
  "POLICE",
  "SILAM",
  "DGSP",
  "DOUANE",
] as const;
export type ServiceCode = (typeof SERVICE_CODES)[number];

export const serviceCodeValidator = v.union(
  v.literal("B2"),
  v.literal("DGDI"),
  v.literal("DGR"),
  v.literal("DGSS"),
  v.literal("GR"),
  v.literal("GN"),
  v.literal("FAG_TERRE"),
  v.literal("FAG_AIR"),
  v.literal("FAG_MARINE"),
  v.literal("POLICE"),
  v.literal("SILAM"),
  v.literal("DGSP"),
  v.literal("DOUANE"),
);

// ──────────────────────────────────────────────────────────────────────
// Rôles iCNS (orientés CNS, pas Présidence)
// ──────────────────────────────────────────────────────────────────────

export const ROLES_ICNS = [
  "officier_traitant", // Agent contributeur dans un service
  "chef_section", // Chef de section dans un service
  "directeur_service", // Directeur d'un service (signe les dossiers)
  "analyste_cns", // Analyste au secrétariat permanent CNS
  "sg_cns", // Secrétaire Général du CNS
  "auditeur", // Auditeur sur mandat (lecture seule du journal)
  "rssi", // Responsable Sécurité (accès journaux scellés)
  "admin_technique", // Admin de la plateforme (sans accès aux contenus)
] as const;
export type RoleICNS = (typeof ROLES_ICNS)[number];

export const roleICNSValidator = v.union(
  v.literal("officier_traitant"),
  v.literal("chef_section"),
  v.literal("directeur_service"),
  v.literal("analyste_cns"),
  v.literal("sg_cns"),
  v.literal("auditeur"),
  v.literal("rssi"),
  v.literal("admin_technique"),
);

// ──────────────────────────────────────────────────────────────────────
// Types pour usage applicatif
// ──────────────────────────────────────────────────────────────────────

export type ClassificationValue = Infer<typeof classificationValidator>;
export type UrgenceValue = Infer<typeof urgenceValidator>;
export type StatutDossierValue = Infer<typeof statutDossierValidator>;
export type TypePieceValue = Infer<typeof typePieceValidator>;
export type ServiceCodeValue = Infer<typeof serviceCodeValidator>;
export type RoleICNSValue = Infer<typeof roleICNSValidator>;
