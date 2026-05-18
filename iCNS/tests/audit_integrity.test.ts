// Tests d'intégrité du journal d'audit iCNS
// Référence : NTSAGUI/CNS/CDC/2026/001 §2.8 (EF-08) — Prompt 1.2
//
// Couverture :
// 1. Pures functions du module audit (sha256Hex, serializeAuditEntry)
// 2. Simulation in-memory de la chaîne — 1000 entrées → chaîne cohérente
// 3. Détection d'une manipulation (modification d'une entrée → rupture)
// 4. Détection d'une lacune de séquence
// 5. Détection d'un GENESIS placé incorrectement
//
// Framework : vitest (à installer en devDep — cf. package.json).
//   bun add -d vitest
//   bun run test
//
// Note : ces tests utilisent un mock de base de données en mémoire pour
// simuler le runtime Convex sans nécessiter de déploiement. Les vérifications
// reproduisent exactement la logique de `convex/audit_verify.ts`.

import { describe, expect, it } from "vitest";
import {
  GENESIS_HASH,
  serializeAuditEntry,
  sha256Hex,
  type AuditEntryArgs,
} from "../convex/audit";

// ──────────────────────────────────────────────────────────────────────
// Mock minimal de l'API Convex pour la simulation in-memory
// ──────────────────────────────────────────────────────────────────────

interface JournalEntry {
  sequence: number;
  utilisateurMatricule: string;
  serviceUtilisateur: string;
  action: string;
  classificationDossier?: string;
  dossierId?: string;
  cibleEntiteType?: string;
  cibleEntiteId?: string;
  detail?: string;
  horodatage: number;
  adresseIP: string;
  poste: string;
  hashEntreePrecedente: string;
  hashEntreeCourante: string;
}

class InMemoryJournal {
  entries: JournalEntry[] = [];

  /** Réplique la logique de `appendAuditEntry` sans Convex. */
  async append(args: AuditEntryArgs): Promise<JournalEntry> {
    const last = this.entries[this.entries.length - 1];
    const sequence = (last?.sequence ?? 0) + 1;
    const hashEntreePrecedente = last?.hashEntreeCourante ?? GENESIS_HASH;
    const horodatage = Date.now();

    const payload = serializeAuditEntry({
      sequence,
      utilisateurMatricule: args.utilisateurMatricule,
      serviceUtilisateur: args.serviceUtilisateur,
      action: args.action,
      classificationDossier: args.classificationDossier,
      dossierId: args.dossierId,
      cibleEntiteType: args.cibleEntiteType,
      cibleEntiteId: args.cibleEntiteId,
      detail: args.detail,
      horodatage,
      adresseIP: args.adresseIP,
      poste: args.poste,
      hashEntreePrecedente,
    });
    const hashEntreeCourante = await sha256Hex(payload);

    const entry: JournalEntry = {
      sequence,
      utilisateurMatricule: args.utilisateurMatricule,
      serviceUtilisateur: args.serviceUtilisateur,
      action: args.action,
      classificationDossier: args.classificationDossier,
      dossierId: args.dossierId,
      cibleEntiteType: args.cibleEntiteType,
      cibleEntiteId: args.cibleEntiteId,
      detail: args.detail,
      horodatage,
      adresseIP: args.adresseIP,
      poste: args.poste,
      hashEntreePrecedente,
      hashEntreeCourante,
    };
    this.entries.push(entry);
    return entry;
  }

  /** Réplique `verifyAuditChain` sans Convex. */
  async verify(): Promise<{ ok: boolean; ecarts: Array<{ sequence: number; reason: string }> }> {
    const ecarts: Array<{ sequence: number; reason: string }> = [];
    let attendueSequence = 1;
    let hashPrecedentAttendu = GENESIS_HASH;

    for (const entry of this.entries) {
      if (entry.sequence !== attendueSequence) {
        ecarts.push({ sequence: entry.sequence, reason: "sequence_non_continue" });
        attendueSequence = entry.sequence;
      }
      if (entry.hashEntreePrecedente !== hashPrecedentAttendu) {
        ecarts.push({ sequence: entry.sequence, reason: "hash_precedent_invalide" });
      }
      const payload = serializeAuditEntry({
        sequence: entry.sequence,
        utilisateurMatricule: entry.utilisateurMatricule,
        serviceUtilisateur: entry.serviceUtilisateur,
        action: entry.action,
        classificationDossier: entry.classificationDossier,
        dossierId: entry.dossierId,
        cibleEntiteType: entry.cibleEntiteType,
        cibleEntiteId: entry.cibleEntiteId,
        detail: entry.detail,
        horodatage: entry.horodatage,
        adresseIP: entry.adresseIP,
        poste: entry.poste,
        hashEntreePrecedente: entry.hashEntreePrecedente,
      });
      const hashRecalcule = await sha256Hex(payload);
      if (hashRecalcule !== entry.hashEntreeCourante) {
        ecarts.push({ sequence: entry.sequence, reason: "hash_courant_invalide" });
      }
      hashPrecedentAttendu = entry.hashEntreeCourante;
      attendueSequence = entry.sequence + 1;
    }

    return { ok: ecarts.length === 0, ecarts };
  }
}

function entryArgs(overrides: Partial<AuditEntryArgs> = {}): AuditEntryArgs {
  return {
    utilisateurMatricule: "TEST-001",
    serviceUtilisateur: "DGSS",
    action: "TEST_ACTION",
    adresseIP: "10.0.0.1",
    poste: "PDG-001",
    ...overrides,
  };
}

// ──────────────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────────────

describe("sha256Hex", () => {
  it("produit un hash hex de 64 caractères", async () => {
    const h = await sha256Hex("hello");
    expect(h).toMatch(/^[0-9a-f]{64}$/);
  });

  it("est déterministe sur la même entrée", async () => {
    const h1 = await sha256Hex("payload-identique");
    const h2 = await sha256Hex("payload-identique");
    expect(h1).toBe(h2);
  });

  it("est sensible à une modification minime de l'entrée", async () => {
    const h1 = await sha256Hex("contenu");
    const h2 = await sha256Hex("contenu ");
    expect(h1).not.toBe(h2);
  });

  it("retourne le hash SHA-256 connu pour 'abc'", async () => {
    // Vecteur de test standard NIST FIPS 180-2.
    const h = await sha256Hex("abc");
    expect(h).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
});

describe("serializeAuditEntry", () => {
  it("est déterministe pour deux appels identiques", () => {
    const fields = {
      sequence: 1,
      utilisateurMatricule: "M-001",
      serviceUtilisateur: "DGSS",
      action: "DOSSIER_CREE",
      horodatage: 1715500000000,
      adresseIP: "10.0.0.1",
      poste: "PDG-001",
      hashEntreePrecedente: GENESIS_HASH,
    };
    expect(serializeAuditEntry(fields)).toBe(serializeAuditEntry(fields));
  });

  it("traite undefined comme chaîne vide pour les champs optionnels", () => {
    const a = serializeAuditEntry({
      sequence: 1,
      utilisateurMatricule: "M-001",
      serviceUtilisateur: "DGSS",
      action: "X",
      horodatage: 1,
      adresseIP: "ip",
      poste: "p",
      hashEntreePrecedente: GENESIS_HASH,
    });
    const b = serializeAuditEntry({
      sequence: 1,
      utilisateurMatricule: "M-001",
      serviceUtilisateur: "DGSS",
      action: "X",
      classificationDossier: undefined,
      detail: undefined,
      horodatage: 1,
      adresseIP: "ip",
      poste: "p",
      hashEntreePrecedente: GENESIS_HASH,
    });
    expect(a).toBe(b);
  });

  it("différencie deux entrées dont seul un champ optionnel diffère", () => {
    const base = {
      sequence: 1,
      utilisateurMatricule: "M-001",
      serviceUtilisateur: "DGSS",
      action: "X",
      horodatage: 1,
      adresseIP: "ip",
      poste: "p",
      hashEntreePrecedente: GENESIS_HASH,
    };
    const a = serializeAuditEntry(base);
    const b = serializeAuditEntry({ ...base, detail: "petit changement" });
    expect(a).not.toBe(b);
  });
});

describe("Chaîne d'audit — fonctionnement nominal", () => {
  it("la 1re entrée porte hashEntreePrecedente == GENESIS", async () => {
    const j = new InMemoryJournal();
    const e = await j.append(entryArgs());
    expect(e.sequence).toBe(1);
    expect(e.hashEntreePrecedente).toBe(GENESIS_HASH);
  });

  it("chaque entrée porte hashEntreePrecedente = hashEntreeCourante de la précédente", async () => {
    const j = new InMemoryJournal();
    const e1 = await j.append(entryArgs({ action: "A1" }));
    const e2 = await j.append(entryArgs({ action: "A2" }));
    const e3 = await j.append(entryArgs({ action: "A3" }));
    expect(e2.hashEntreePrecedente).toBe(e1.hashEntreeCourante);
    expect(e3.hashEntreePrecedente).toBe(e2.hashEntreeCourante);
  });

  it("ajout de 1000 entrées → chaîne cohérente", async () => {
    const j = new InMemoryJournal();
    for (let i = 0; i < 1000; i++) {
      await j.append(
        entryArgs({
          action: `ACTION_${i}`,
          detail: `Entrée n°${i}`,
          utilisateurMatricule: `M-${String(i % 50).padStart(3, "0")}`,
        }),
      );
    }
    const report = await j.verify();
    expect(report.ok).toBe(true);
    expect(j.entries.length).toBe(1000);
    expect(j.entries[0].sequence).toBe(1);
    expect(j.entries[999].sequence).toBe(1000);
  });
});

describe("Chaîne d'audit — détection de manipulation", () => {
  it("modification d'une entrée intermédiaire → écart détecté", async () => {
    const j = new InMemoryJournal();
    for (let i = 0; i < 10; i++) {
      await j.append(entryArgs({ action: `A${i}` }));
    }
    // Manipulation : un attaquant modifie le détail de l'entrée 5
    j.entries[4].detail = "DONNÉES FALSIFIÉES";

    const report = await j.verify();
    expect(report.ok).toBe(false);
    const seqs = report.ecarts.map((e) => e.sequence);
    // L'écart est détecté à la séquence 5 (hash recalculé ≠ hash stocké),
    // et potentiellement aussi sur la 6 (son hashEntreePrecedente pointe sur
    // l'ancien hash de la 5).
    expect(seqs).toContain(5);
  });

  it("modification du hashEntreeCourante d'une entrée → écart détecté", async () => {
    const j = new InMemoryJournal();
    for (let i = 0; i < 5; i++) {
      await j.append(entryArgs({ action: `A${i}` }));
    }
    j.entries[2].hashEntreeCourante = "00".repeat(32); // hash falsifié

    const report = await j.verify();
    expect(report.ok).toBe(false);
    expect(report.ecarts.some((e) => e.reason === "hash_courant_invalide" && e.sequence === 3)).toBe(true);
  });

  it("suppression d'une entrée intermédiaire → lacune de séquence détectée", async () => {
    const j = new InMemoryJournal();
    for (let i = 0; i < 6; i++) {
      await j.append(entryArgs({ action: `A${i}` }));
    }
    j.entries.splice(2, 1); // supprime l'entrée séquence 3

    const report = await j.verify();
    expect(report.ok).toBe(false);
    expect(report.ecarts.some((e) => e.reason === "sequence_non_continue")).toBe(true);
  });

  it("ré-attaque par insertion d'une fausse entrée GENESIS au milieu → écart détecté", async () => {
    const j = new InMemoryJournal();
    for (let i = 0; i < 5; i++) {
      await j.append(entryArgs({ action: `A${i}` }));
    }
    // L'attaquant clone l'entrée 1 et tente de la réinsérer en position 4
    // (sans recalculer correctement la chaîne en aval).
    j.entries[3] = {
      ...j.entries[0],
      sequence: 4, // garde la séquence locale 4
    };

    const report = await j.verify();
    expect(report.ok).toBe(false);
  });
});

describe("Chaîne d'audit — propriétés cryptographiques", () => {
  it("deux entrées strictement identiques (sauf séquence) ont des hash différents", async () => {
    const j = new InMemoryJournal();
    const e1 = await j.append(entryArgs({ action: "IDENTIQUE" }));
    const e2 = await j.append(entryArgs({ action: "IDENTIQUE" }));
    expect(e1.hashEntreeCourante).not.toBe(e2.hashEntreeCourante);
    // Le chaînage (hashEntreePrecedente différent) garantit l'unicité même
    // si tous les autres champs sont identiques.
  });

  it("aucune entrée ne porte deux fois le même hashEntreeCourante", async () => {
    const j = new InMemoryJournal();
    for (let i = 0; i < 200; i++) {
      await j.append(entryArgs({ action: "ACTION_REPETEE", detail: "même contenu" }));
    }
    const hashes = new Set(j.entries.map((e) => e.hashEntreeCourante));
    expect(hashes.size).toBe(200);
  });
});
