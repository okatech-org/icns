// Tests du cycle de vie d'un dossier — Prompt 3.2
// Référence : NTSAGUI/CNS/CDC/2026/001 §2.1 (EF-01)
//
// Tests sur la machine d'états (pure functions, pas de Convex db).

import { describe, expect, it } from "vitest";
import {
  applicableActions,
  checkTransition,
  isTerminal,
  TRANSITIONS,
} from "../convex/dossiers/state_machine";
import type {
  RoleICNSValue,
  StatutDossierValue,
} from "../convex/validators/classification";

// ──────────────────────────────────────────────────────────────────────
// checkTransition
// ──────────────────────────────────────────────────────────────────────

describe("checkTransition — transitions nominales", () => {
  it("officier soumet à section depuis constitution", () => {
    const r = checkTransition("constitution", "soumettre_section", "officier_traitant");
    expect(r.ok).toBe(true);
    expect(r.toStatus).toBe("validation_section");
  });

  it("chef soumet à direction depuis validation_section", () => {
    const r = checkTransition("validation_section", "soumettre_direction", "chef_section");
    expect(r.ok).toBe(true);
    expect(r.toStatus).toBe("validation_direction");
  });

  it("directeur signe et transmet depuis validation_direction", () => {
    const r = checkTransition(
      "validation_direction",
      "signer_et_transmettre",
      "directeur_service",
    );
    expect(r.ok).toBe(true);
    expect(r.toStatus).toBe("transmis_cns");
  });

  it("SG-CNS clôture positif depuis transmis_cns", () => {
    const r = checkTransition("transmis_cns", "cloturer_positif", "sg_cns");
    expect(r.ok).toBe(true);
    expect(r.toStatus).toBe("cloture_positif");
  });
});

describe("checkTransition — refus", () => {
  it("officier ne peut PAS signer et transmettre (EF-01.5)", () => {
    const r = checkTransition(
      "validation_direction",
      "signer_et_transmettre",
      "officier_traitant",
    );
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/officier_traitant/);
  });

  it("chef ne peut PAS signer et transmettre", () => {
    const r = checkTransition(
      "validation_direction",
      "signer_et_transmettre",
      "chef_section",
    );
    expect(r.ok).toBe(false);
  });

  it("transition impossible depuis statut terminal", () => {
    const r = checkTransition("cloture_positif", "soumettre_section", "officier_traitant");
    expect(r.ok).toBe(false);
  });

  it("on ne peut pas archiver un dossier non clôturé (EF-01.10)", () => {
    const r = checkTransition("transmis_cns", "archiver", "admin_technique");
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/non archivable/);
  });

  it("CNS ne peut pas marquer incomplet un dossier en constitution", () => {
    const r = checkTransition(
      "constitution",
      "marquer_incomplet_par_cns",
      "sg_cns",
    );
    expect(r.ok).toBe(false);
  });
});

describe("checkTransition — suspension/reprise", () => {
  it("permet la suspension depuis tout statut non terminal", () => {
    const statuts: StatutDossierValue[] = [
      "constitution",
      "validation_section",
      "validation_direction",
      "transmis_cns",
      "renvoye_incomplet",
    ];
    for (const s of statuts) {
      const r = checkTransition(s, "suspendre", "directeur_service");
      expect(r.ok).toBe(true);
      expect(r.toStatus).toBe("suspendu");
    }
  });

  it("rejette la suspension sur statut terminal", () => {
    const r = checkTransition("cloture_positif", "suspendre", "directeur_service");
    expect(r.ok).toBe(false);
  });

  it("permet la reprise depuis suspendu", () => {
    const r = checkTransition("suspendu", "reprendre", "directeur_service");
    expect(r.ok).toBe(true);
  });

  it("interdit suspendre/reprendre aux rôles non habilités", () => {
    const a = checkTransition("constitution", "suspendre", "officier_traitant");
    expect(a.ok).toBe(false);
    const b = checkTransition("suspendu", "reprendre", "officier_traitant");
    expect(b.ok).toBe(false);
  });
});

describe("checkTransition — renvois", () => {
  it("directeur renvoie à section avec motif", () => {
    const r = checkTransition(
      "validation_direction",
      "renvoyer_a_section",
      "directeur_service",
    );
    expect(r.ok).toBe(true);
    expect(r.toStatus).toBe("validation_section");
  });

  it("chef renvoie à constitution", () => {
    const r = checkTransition(
      "validation_section",
      "renvoyer_a_constitution",
      "chef_section",
    );
    expect(r.ok).toBe(true);
    expect(r.toStatus).toBe("constitution");
  });

  it("directeur peut aussi renvoyer à constitution depuis validation_direction", () => {
    const r = checkTransition(
      "validation_direction",
      "renvoyer_a_constitution",
      "directeur_service",
    );
    expect(r.ok).toBe(true);
    expect(r.toStatus).toBe("constitution");
  });

  it("CNS renvoie un dossier transmis comme incomplet", () => {
    const r = checkTransition(
      "transmis_cns",
      "marquer_incomplet_par_cns",
      "analyste_cns",
    );
    expect(r.ok).toBe(true);
    expect(r.toStatus).toBe("renvoye_incomplet");
  });
});

describe("isTerminal", () => {
  it("les clôtures et archive sont terminaux", () => {
    expect(isTerminal("cloture_positif")).toBe(true);
    expect(isTerminal("cloture_negatif")).toBe(true);
    expect(isTerminal("cloture_administratif")).toBe(true);
    expect(isTerminal("archive")).toBe(true);
  });

  it("les autres statuts ne sont pas terminaux", () => {
    expect(isTerminal("constitution")).toBe(false);
    expect(isTerminal("validation_section")).toBe(false);
    expect(isTerminal("transmis_cns")).toBe(false);
    expect(isTerminal("suspendu")).toBe(false);
  });
});

describe("applicableActions", () => {
  it("pour un officier sur constitution → soumettre_section uniquement", () => {
    const actions = applicableActions("constitution", "officier_traitant");
    expect(actions).toContain("soumettre_section");
    expect(actions).not.toContain("signer_et_transmettre");
    expect(actions).not.toContain("cloturer_positif");
  });

  it("pour un directeur sur validation_direction → signer + renvois + suspendre", () => {
    const actions = applicableActions("validation_direction", "directeur_service");
    expect(actions).toContain("signer_et_transmettre");
    expect(actions).toContain("renvoyer_a_section");
    expect(actions).toContain("renvoyer_a_constitution");
    expect(actions).toContain("suspendre");
  });

  it("pour le SG-CNS sur transmis_cns → clôtures + renvoi incomplet + suspendre", () => {
    const actions = applicableActions("transmis_cns", "sg_cns");
    expect(actions).toContain("cloturer_positif");
    expect(actions).toContain("cloturer_negatif");
    expect(actions).toContain("cloturer_administratif");
    expect(actions).toContain("marquer_incomplet_par_cns");
    expect(actions).toContain("suspendre");
  });

  it("aucune action sur statut terminal", () => {
    const actions = applicableActions("cloture_positif", "sg_cns");
    // Seul "archiver" est permis pour les rôles ayant ce droit
    expect(actions).toContain("archiver");
    expect(actions).not.toContain("cloturer_positif");
    expect(actions).not.toContain("soumettre_section");
  });
});

describe("Invariants de la machine d'états", () => {
  it("aucune transition ne sort d'un statut terminal sauf archiver", () => {
    const terminaux: StatutDossierValue[] = [
      "cloture_positif",
      "cloture_negatif",
      "cloture_administratif",
      "archive",
    ];
    const allRoles: RoleICNSValue[] = [
      "officier_traitant",
      "chef_section",
      "directeur_service",
      "analyste_cns",
      "sg_cns",
      "rssi",
      "auditeur",
      "admin_technique",
    ];
    for (const t of terminaux) {
      for (const r of allRoles) {
        const actions = applicableActions(t, r);
        // Seule sortie possible : archiver depuis cloture_*
        for (const a of actions) {
          if (t === "archive") {
            // rien ne sort d'archive
            expect(a).toBeUndefined();
          } else {
            // depuis cloture_*, seul archiver est permis
            expect(a).toBe("archiver");
          }
        }
      }
    }
  });

  it("la transmission vers CNS exige le rôle directeur_service", () => {
    const allRoles: RoleICNSValue[] = [
      "officier_traitant",
      "chef_section",
      "directeur_service",
      "analyste_cns",
      "sg_cns",
      "rssi",
      "auditeur",
      "admin_technique",
    ];
    for (const r of allRoles) {
      const check = checkTransition("validation_direction", "signer_et_transmettre", r);
      if (r === "directeur_service") {
        expect(check.ok).toBe(true);
      } else {
        expect(check.ok).toBe(false);
      }
    }
  });

  it("le motif est requis pour les renvois et clôtures (déclaré dans TRANSITIONS)", () => {
    const withMotifRenvoi = [
      "signer_et_transmettre", // requires signature_directeur
      "renvoyer_a_section",
      "renvoyer_a_constitution",
      "marquer_incomplet_par_cns",
      "suspendre",
    ] as const;
    for (const a of withMotifRenvoi) {
      const t = TRANSITIONS[a];
      expect(t.requires).toBeDefined();
      expect(t.requires!.length).toBeGreaterThan(0);
    }
    for (const a of [
      "cloturer_positif",
      "cloturer_negatif",
      "cloturer_administratif",
    ] as const) {
      expect(TRANSITIONS[a].requires).toContain("motif_cloture");
    }
  });
});
