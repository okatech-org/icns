// Machine d'états du cycle de vie d'un dossier — iCNS (Prompt 3.2)
// Référence : NTSAGUI/CNS/CDC/2026/001 §2.1 (EF-01)
//
// Statuts (cf. validators/classification.ts) :
//   constitution → validation_section → validation_direction → transmis_cns
//                                                              → cloture_*
//                                                              → archive
//   * → suspendu → previous status
//   * → renvoye_incomplet → constitution
//
// Règles métier critiques :
//   - EF-01.5 : transmission impossible sans signature du directeur.
//   - EF-01.6 : à la transmission, une copie classifiée reste sur le service.
//   - EF-01.10 : les clôtures sont irréversibles.
//   - Le SG-CNS (ou son délégué) peut faire passer un dossier `transmis_cns`
//     en `renvoye_incomplet` (qui repart à `constitution` après réception).

import type {
  RoleICNSValue,
  StatutDossierValue,
} from "../validators/classification";

// ──────────────────────────────────────────────────────────────────────
// Définition des transitions
// ──────────────────────────────────────────────────────────────────────

/**
 * Action métier déclenchant une transition. Le code consommateur appelle
 * `canTransition(currentStatus, action, role)` pour savoir si la transition
 * est permise, puis `nextStatus(action)` pour obtenir le statut cible.
 */
export type DossierAction =
  | "soumettre_section" // officier → chef section
  | "soumettre_direction" // chef → directeur
  | "signer_et_transmettre" // directeur signe et transmet vers CNS
  | "renvoyer_a_constitution" // chef ou directeur renvoie au début
  | "renvoyer_a_section" // directeur renvoie au chef
  | "marquer_incomplet_par_cns" // CNS renvoie au service pour complément
  | "suspendre"
  | "reprendre"
  | "cloturer_positif"
  | "cloturer_negatif"
  | "cloturer_administratif"
  | "archiver";

export interface TransitionRule {
  from: StatutDossierValue;
  to: StatutDossierValue;
  /** Rôles autorisés à déclencher cette transition. Vide = tous rôles. */
  rolesAutorises: ReadonlyArray<RoleICNSValue>;
  /** Exigences supplémentaires vérifiées par la mutation (ex. signature). */
  requires?: ReadonlyArray<"signature_directeur" | "motif_renvoi" | "motif_cloture">;
}

export const TRANSITIONS: Record<DossierAction, TransitionRule> = {
  soumettre_section: {
    from: "constitution",
    to: "validation_section",
    rolesAutorises: ["officier_traitant", "chef_section"],
  },
  soumettre_direction: {
    from: "validation_section",
    to: "validation_direction",
    rolesAutorises: ["chef_section"],
  },
  signer_et_transmettre: {
    from: "validation_direction",
    to: "transmis_cns",
    rolesAutorises: ["directeur_service"],
    requires: ["signature_directeur"],
  },
  renvoyer_a_section: {
    from: "validation_direction",
    to: "validation_section",
    rolesAutorises: ["directeur_service"],
    requires: ["motif_renvoi"],
  },
  renvoyer_a_constitution: {
    // Permis depuis validation_section ET validation_direction —
    // résolu dynamiquement par `applicableTransitions`.
    from: "validation_section",
    to: "constitution",
    rolesAutorises: ["chef_section", "directeur_service"],
    requires: ["motif_renvoi"],
  },
  marquer_incomplet_par_cns: {
    from: "transmis_cns",
    to: "renvoye_incomplet",
    rolesAutorises: ["analyste_cns", "sg_cns"],
    requires: ["motif_renvoi"],
  },
  suspendre: {
    // S'applique à tout statut non terminal (résolu par helper)
    from: "constitution",
    to: "suspendu",
    rolesAutorises: ["directeur_service", "sg_cns", "rssi"],
    requires: ["motif_renvoi"],
  },
  reprendre: {
    from: "suspendu",
    to: "constitution", // recalculé dynamiquement vers le statut précédent
    rolesAutorises: ["directeur_service", "sg_cns", "rssi"],
  },
  cloturer_positif: {
    from: "transmis_cns",
    to: "cloture_positif",
    rolesAutorises: ["sg_cns"],
    requires: ["motif_cloture"],
  },
  cloturer_negatif: {
    from: "transmis_cns",
    to: "cloture_negatif",
    rolesAutorises: ["sg_cns"],
    requires: ["motif_cloture"],
  },
  cloturer_administratif: {
    from: "transmis_cns",
    to: "cloture_administratif",
    rolesAutorises: ["sg_cns", "rssi"],
    requires: ["motif_cloture"],
  },
  archiver: {
    from: "cloture_positif", // ou cloture_negatif / cloture_administratif
    to: "archive",
    rolesAutorises: ["admin_technique", "sg_cns"], // typiquement par cron, mais traçable
  },
};

const STATUTS_NON_TERMINAUX_SUSPENDABLES: ReadonlyArray<StatutDossierValue> = [
  "constitution",
  "validation_section",
  "validation_direction",
  "transmis_cns",
  "renvoye_incomplet",
];

const STATUTS_CLOTURABLES_VERS_ARCHIVE: ReadonlyArray<StatutDossierValue> = [
  "cloture_positif",
  "cloture_negatif",
  "cloture_administratif",
];

// ──────────────────────────────────────────────────────────────────────
// API publique
// ──────────────────────────────────────────────────────────────────────

export interface CheckResult {
  ok: boolean;
  toStatus?: StatutDossierValue;
  reason?: string;
}

/**
 * Vérifie qu'une action est applicable au statut courant et au rôle donné.
 *
 * Renvoie `{ ok: true, toStatus }` si la transition est permise, sinon
 * `{ ok: false, reason }` avec un motif lisible.
 *
 * Note : les exigences `requires` ne sont PAS validées ici — c'est le rôle
 * de la mutation de vérifier que la signature qualifiée / le motif sont
 * bien présents.
 */
export function checkTransition(
  currentStatus: StatutDossierValue,
  action: DossierAction,
  role: RoleICNSValue,
): CheckResult {
  // Cas particuliers spéciaux
  if (action === "suspendre") {
    if (!STATUTS_NON_TERMINAUX_SUSPENDABLES.includes(currentStatus)) {
      return { ok: false, reason: `Statut "${currentStatus}" non suspendable.` };
    }
    if (!TRANSITIONS.suspendre.rolesAutorises.includes(role)) {
      return { ok: false, reason: `Rôle "${role}" non autorisé à suspendre.` };
    }
    return { ok: true, toStatus: "suspendu" };
  }
  if (action === "reprendre") {
    if (currentStatus !== "suspendu") {
      return { ok: false, reason: "Seul un statut 'suspendu' peut être repris." };
    }
    if (!TRANSITIONS.reprendre.rolesAutorises.includes(role)) {
      return { ok: false, reason: `Rôle "${role}" non autorisé à reprendre.` };
    }
    return { ok: true /* toStatus déterminé dynamiquement */ };
  }
  if (action === "archiver") {
    if (!STATUTS_CLOTURABLES_VERS_ARCHIVE.includes(currentStatus)) {
      return { ok: false, reason: `Statut "${currentStatus}" non archivable.` };
    }
    if (!TRANSITIONS.archiver.rolesAutorises.includes(role)) {
      return { ok: false, reason: `Rôle "${role}" non autorisé à archiver.` };
    }
    return { ok: true, toStatus: "archive" };
  }
  // Cas particulier "renvoyer_a_constitution" : permis depuis 2 statuts
  if (action === "renvoyer_a_constitution") {
    if (
      currentStatus !== "validation_section" &&
      currentStatus !== "validation_direction"
    ) {
      return {
        ok: false,
        reason: `Renvoi à constitution non permis depuis "${currentStatus}".`,
      };
    }
    if (!TRANSITIONS.renvoyer_a_constitution.rolesAutorises.includes(role)) {
      return { ok: false, reason: `Rôle "${role}" non autorisé à renvoyer.` };
    }
    return { ok: true, toStatus: "constitution" };
  }

  // Cas généraux
  const rule = TRANSITIONS[action];
  if (!rule) return { ok: false, reason: `Action inconnue : ${action}` };
  if (currentStatus !== rule.from) {
    return {
      ok: false,
      reason: `Transition "${action}" impossible depuis le statut "${currentStatus}" (attendu "${rule.from}").`,
    };
  }
  if (rule.rolesAutorises.length > 0 && !rule.rolesAutorises.includes(role)) {
    return {
      ok: false,
      reason: `Rôle "${role}" non autorisé pour l'action "${action}".`,
    };
  }
  return { ok: true, toStatus: rule.to };
}

/**
 * Retourne la liste des actions applicables à un statut + rôle donnés.
 * Utile pour conditionner les boutons d'action côté UI.
 */
export function applicableActions(
  currentStatus: StatutDossierValue,
  role: RoleICNSValue,
): DossierAction[] {
  const all: DossierAction[] = [
    "soumettre_section",
    "soumettre_direction",
    "signer_et_transmettre",
    "renvoyer_a_constitution",
    "renvoyer_a_section",
    "marquer_incomplet_par_cns",
    "suspendre",
    "reprendre",
    "cloturer_positif",
    "cloturer_negatif",
    "cloturer_administratif",
    "archiver",
  ];
  return all.filter((a) => checkTransition(currentStatus, a, role).ok);
}

/**
 * Indique si un statut est terminal (cf. validators/classification.ts).
 */
export function isTerminal(status: StatutDossierValue): boolean {
  return (
    status === "cloture_positif" ||
    status === "cloture_negatif" ||
    status === "cloture_administratif" ||
    status === "archive"
  );
}
