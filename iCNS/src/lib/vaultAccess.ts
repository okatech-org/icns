// Règles d'accès du Coffre documentaire iDocument iCNS.
//
// Référence : NTSAGUI/CNS/CDC/2026/001 §3.3 — `habilitation_user ≥ classification_dossier`
// et matrice de visibilité multi-comptes (Persona × VaultFolder).
//
// Fonctions PURES, sans effet de bord et sans dépendance React :
// directement testables en unitaire.

import type { Classification, Persona, RoleICNS } from "@/data/icns-personas";
import type { VaultDocument, VaultFolder, VaultVisibility } from "@/types/idocument";

// Ordre strict des classifications iCNS (DR < CD < SD < TSD).
const CLASSIFICATION_RANK: Record<Classification, number> = {
  DR: 1,
  CD: 2,
  SD: 3,
  TSD: 4,
};

/** Vrai si `userLevel` est suffisant pour accéder à `requiredLevel`. */
export function hasClearance(
  userLevel: Classification,
  requiredLevel: Classification,
): boolean {
  return CLASSIFICATION_RANK[userLevel] >= CLASSIFICATION_RANK[requiredLevel];
}

/** Rôles autorisés à modifier la visibilité d'un dossier (partage). */
const SHARING_ROLES: ReadonlySet<RoleICNS> = new Set([
  "chef_section",
  "directeur_service",
  "sg_cns",
  "admin_technique",
]);

export function canShare(persona: Persona | null | undefined): boolean {
  if (!persona) return false;
  return SHARING_ROLES.has(persona.role);
}

/**
 * Vrai si la visibilité ouvre l'accès à `persona`.
 *
 * Règle métier supplémentaire : les agents de la cellule centrale CNS
 * (`categorie === "cns_central"`) voient automatiquement tous les dossiers
 * de visibilité `service` — c'est leur rôle de coordination du
 * renseignement inter-cellules.
 */
function visibilityAllows(
  visibility: VaultVisibility,
  persona: Persona,
): boolean {
  switch (visibility.kind) {
    case "private":
      return false;
    case "shared":
      return (
        visibility.matricules.includes(persona.matricule) ||
        visibility.roles.includes(persona.role) ||
        visibility.services.includes(persona.serviceCode)
      );
    case "service":
      return (
        visibility.service === persona.serviceCode ||
        persona.categorie === "cns_central"
      );
    case "cns_wide":
      return true;
  }
}

export function canViewFolder(
  folder: VaultFolder,
  persona: Persona | null | undefined,
): boolean {
  if (!persona) return false;
  if (!hasClearance(persona.classificationMax, folder.classification)) {
    return false;
  }
  if (folder.ownerMatricule === persona.matricule) return true;
  return visibilityAllows(folder.visibility, persona);
}

export function canViewDocument(
  doc: VaultDocument,
  persona: Persona | null | undefined,
): boolean {
  if (!persona) return false;
  if (!hasClearance(persona.classificationMax, doc.classification)) return false;
  if (doc.ownerMatricule === persona.matricule) return true;
  return visibilityAllows(doc.visibility, persona);
}

/**
 * Édition : propriétaire OU `canShare` ET visibilité ouverte au persona.
 * Les dossiers système (`isSystem`) ne sont jamais éditables.
 */
export function canEdit(
  folder: VaultFolder,
  persona: Persona | null | undefined,
): boolean {
  if (!persona) return false;
  if (folder.isSystem) return false;
  if (folder.ownerMatricule === persona.matricule) return true;
  if (!canShare(persona)) return false;
  return canViewFolder(folder, persona);
}

/** Catégorise un dossier visible pour l'affichage en sections. */
export type VaultSection =
  | "system"
  | "private"
  | "shared_with_me"
  | "service"
  | "cellules"
  | "cns_wide";

export function sectionForFolder(
  folder: VaultFolder,
  persona: Persona,
): VaultSection {
  if (folder.isSystem) return "system";
  // Privé : strictement réservé au propriétaire.
  if (folder.visibility.kind === "private") {
    return folder.ownerMatricule === persona.matricule ? "private" : "private";
  }
  // CNS-wide : visible par tous, dans la section dédiée.
  if (folder.visibility.kind === "cns_wide") return "cns_wide";
  // Service : section "MON SERVICE" si je suis du service propriétaire
  // (que je sois owner du dossier ou non — c'est la cellule qui compte),
  // sinon "DOSSIERS CELLULES" pour le CNS central, sinon partagés.
  if (folder.visibility.kind === "service") {
    if (folder.visibility.service === persona.serviceCode) return "service";
    if (persona.categorie === "cns_central") return "cellules";
    return "shared_with_me";
  }
  // shared : si je suis owner, je le retrouve dans partagés (j'ai initié
  // un partage), sinon idem.
  return "shared_with_me";
}
