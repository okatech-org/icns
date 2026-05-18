// Tests du flux d'authentification iCNS
// Référence : NTSAGUI/CNS/CDC/2026/001 §3.2 (ET-02.4) — Prompt 2.1
//
// Couverture :
// 1. JWT signature + vérification roundtrip (HS256 dev)
// 2. JWT expiré → rejet
// 3. JWT falsifié → rejet
// 4. Simulation in-memory du flux `authenticate` (cert OK + signature OK)
// 5. Simulation : certificat expiré → refus + auth_attempts
// 6. Simulation : 5 échecs consécutifs → verrouillage du compte
//
// Framework : vitest. Les variables d'environnement nécessaires (ICNS_JWT_DEV_SECRET)
// sont injectées par vitest via le bloc beforeAll.

import { afterAll, beforeAll, describe, expect, it } from "vitest";

// Polyfill ICNS_JWT_DEV_SECRET avant l'import du module (vitest hoist les imports).
const PREVIOUS_SECRET = (globalThis as any).process?.env?.ICNS_JWT_DEV_SECRET;
const TEST_SECRET = "test-secret-32-caracteres-minimum-ok!";
beforeAll(() => {
  if (typeof (globalThis as any).process === "undefined") {
    (globalThis as any).process = { env: {} };
  }
  (globalThis as any).process.env.ICNS_JWT_DEV_SECRET = TEST_SECRET;
  (globalThis as any).process.env.ICNS_JWT_MODE = "dev";
});

afterAll(() => {
  (globalThis as any).process.env.ICNS_JWT_DEV_SECRET = PREVIOUS_SECRET;
});

// L'import doit suivre la définition de l'env pour éviter le throw au chargement.
const { signJWT, verifyJWT, generateSessionToken } = await import(
  "../convex/auth/jwt"
);

// ──────────────────────────────────────────────────────────────────────
// JWT — tests unitaires
// ──────────────────────────────────────────────────────────────────────

describe("signJWT / verifyJWT", () => {
  it("signe et vérifie un JWT roundtrip", async () => {
    const now = Date.now();
    const jwt = await signJWT({
      sub: "M-001",
      sid: generateSessionToken(),
      iat: now,
      exp: now + 15 * 60 * 1000,
      role: "officier_traitant",
      svc: "DGSS",
    });
    expect(jwt.split(".").length).toBe(3);

    const payload = await verifyJWT(jwt);
    expect(payload.sub).toBe("M-001");
    expect(payload.role).toBe("officier_traitant");
    expect(payload.svc).toBe("DGSS");
  });

  it("rejette un JWT expiré", async () => {
    const past = Date.now() - 16 * 60 * 1000;
    const jwt = await signJWT({
      sub: "M-001",
      sid: "abc",
      iat: past - 60_000,
      exp: past, // expiré il y a 16 min
      role: "officier_traitant",
      svc: "DGSS",
    });
    await expect(verifyJWT(jwt)).rejects.toThrow(/expir/i);
  });

  it("rejette un JWT dont la signature est altérée", async () => {
    const now = Date.now();
    const jwt = await signJWT({
      sub: "M-001",
      sid: "abc",
      iat: now,
      exp: now + 60_000,
      role: "officier_traitant",
      svc: "DGSS",
    });
    const parts = jwt.split(".");
    // Modifie le payload (2e partie) sans recalculer la signature
    const tampered = `${parts[0]}.${parts[1].slice(0, -3)}aaa.${parts[2]}`;
    await expect(verifyJWT(tampered)).rejects.toThrow(/invalide|illisible/i);
  });

  it("rejette un JWT dont l'algorithme du header n'est pas HS256 en mode dev", async () => {
    const now = Date.now();
    const jwt = await signJWT({
      sub: "M-001",
      sid: "abc",
      iat: now,
      exp: now + 60_000,
      role: "officier_traitant",
      svc: "DGSS",
    });
    // Falsifier le header (alg → none)
    const fakeHeader = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" }))
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    const parts = jwt.split(".");
    const fake = `${fakeHeader}.${parts[1]}.${parts[2]}`;
    await expect(verifyJWT(fake)).rejects.toThrow();
  });

  it("génère des sessionTokens uniques", () => {
    const tokens = new Set<string>();
    for (let i = 0; i < 100; i++) {
      tokens.add(generateSessionToken());
    }
    expect(tokens.size).toBe(100);
  });
});

// ──────────────────────────────────────────────────────────────────────
// Simulation in-memory du flux authenticate
// ──────────────────────────────────────────────────────────────────────

// Note : ces tests reproduisent la logique de `convex/auth/authenticate.ts`
// pour valider le comportement attendu sans nécessiter un déploiement
// Convex. Une suite d'intégration complète sera ajoutée en Phase 6 via
// `convex-test` (Prompt 6.1 — tests de charge).

type ServiceCode = "DGSS" | "DGR" | "B2";

interface MockUser {
  matricule: string;
  serviceCode: ServiceCode;
  role: string;
  actif: boolean;
}

interface MockCert {
  matricule: string;
  serialNumber: string;
  issuer: string;
  notBefore: number;
  notAfter: number;
}

interface AuthAttempt {
  utilisateurMatricule?: string;
  certificatSerialNumber: string;
  success: boolean;
  failureReason?: string;
  horodatage: number;
}

interface AccountLock {
  utilisateurMatricule: string;
  lockedAt: number;
  expiresAt: number;
  reason: string;
}

const FAILURE_WINDOW_MS = 30 * 60 * 1000;
const FAILURE_THRESHOLD = 5;
const LOCK_DURATION_MS = 24 * 60 * 60 * 1000;

class MockAuthService {
  users: Map<string, MockUser> = new Map();
  attempts: AuthAttempt[] = [];
  locks: AccountLock[] = [];

  registerUser(u: MockUser) {
    this.users.set(u.matricule, u);
  }

  async authenticate(args: {
    cert: MockCert;
    challenge: string;
    challengeSigne: string;
    now?: number;
  }): Promise<{ success: boolean; reason?: string; user?: MockUser }> {
    const now = args.now ?? Date.now();

    // 1. Validation cert
    if (!args.cert.issuer.startsWith("CN=PKI_SOUVERAINE")) {
      return await this._fail(args.cert, "certificat_inconnu", now, undefined);
    }
    if (now > args.cert.notAfter) {
      return await this._fail(args.cert, "certificat_expire", now, args.cert.matricule);
    }

    // 2. Fraîcheur challenge
    const [issuedAtStr] = args.challenge.split(".");
    const issuedAt = Number.parseInt(issuedAtStr, 10);
    if (Number.isNaN(issuedAt) || now - issuedAt > 60_000) {
      return await this._fail(args.cert, "signature_invalide", now, args.cert.matricule);
    }

    // 3. Signature
    if (args.challengeSigne !== `MOCK-SIGN:${args.challenge}`) {
      return await this._fail(args.cert, "signature_invalide", now, args.cert.matricule);
    }

    // 4. Utilisateur
    const user = this.users.get(args.cert.matricule);
    if (!user) return await this._fail(args.cert, "certificat_inconnu", now, args.cert.matricule);
    if (!user.actif) return await this._fail(args.cert, "compte_inactif", now, user.matricule);

    // 5. Verrouillage
    const lock = this.locks.find(
      (l) => l.utilisateurMatricule === user.matricule && l.expiresAt > now,
    );
    if (lock) return await this._fail(args.cert, "compte_verrouille", now, user.matricule);

    // 6. Succès
    this.attempts.push({
      utilisateurMatricule: user.matricule,
      certificatSerialNumber: args.cert.serialNumber,
      success: true,
      horodatage: now,
    });
    return { success: true, user };
  }

  private async _fail(
    cert: MockCert,
    reason: string,
    now: number,
    matricule: string | undefined,
  ) {
    this.attempts.push({
      utilisateurMatricule: matricule,
      certificatSerialNumber: cert.serialNumber,
      success: false,
      failureReason: reason,
      horodatage: now,
    });
    if (matricule) {
      const since = now - FAILURE_WINDOW_MS;
      const fails = this.attempts.filter(
        (a) => a.utilisateurMatricule === matricule && !a.success && a.horodatage >= since,
      ).length;
      const activeLock = this.locks.find(
        (l) => l.utilisateurMatricule === matricule && l.expiresAt > now,
      );
      if (fails >= FAILURE_THRESHOLD && !activeLock) {
        this.locks.push({
          utilisateurMatricule: matricule,
          lockedAt: now,
          expiresAt: now + LOCK_DURATION_MS,
          reason: `${FAILURE_THRESHOLD}_echecs_consecutifs`,
        });
      }
    }
    return { success: false, reason };
  }
}

function makeChallenge(now: number = Date.now()): string {
  return `${now}.${generateSessionToken()}`;
}

function makeValidCert(matricule: string): MockCert {
  const now = Date.now();
  return {
    matricule,
    serialNumber: `SN-${matricule}`,
    issuer: "CN=PKI_SOUVERAINE_DEV",
    notBefore: now - 86_400_000,
    notAfter: now + 86_400_000,
  };
}

describe("Flux authenticate — simulation in-memory", () => {
  it("authentification réussie pour un utilisateur valide", async () => {
    const svc = new MockAuthService();
    svc.registerUser({
      matricule: "DGSS-001",
      serviceCode: "DGSS",
      role: "officier_traitant",
      actif: true,
    });
    const cert = makeValidCert("DGSS-001");
    const challenge = makeChallenge();

    const r = await svc.authenticate({
      cert,
      challenge,
      challengeSigne: `MOCK-SIGN:${challenge}`,
    });

    expect(r.success).toBe(true);
    expect(r.user?.matricule).toBe("DGSS-001");
    expect(svc.attempts.filter((a) => a.success).length).toBe(1);
  });

  it("rejette un certificat expiré et trace l'échec", async () => {
    const svc = new MockAuthService();
    svc.registerUser({
      matricule: "DGSS-001",
      serviceCode: "DGSS",
      role: "officier_traitant",
      actif: true,
    });
    const expiredCert: MockCert = {
      matricule: "DGSS-001",
      serialNumber: "SN-OLD",
      issuer: "CN=PKI_SOUVERAINE_DEV",
      notBefore: Date.now() - 2 * 86_400_000,
      notAfter: Date.now() - 86_400_000, // expiré il y a 1 jour
    };
    const challenge = makeChallenge();

    const r = await svc.authenticate({
      cert: expiredCert,
      challenge,
      challengeSigne: `MOCK-SIGN:${challenge}`,
    });

    expect(r.success).toBe(false);
    expect(r.reason).toBe("certificat_expire");
    expect(svc.attempts).toHaveLength(1);
    expect(svc.attempts[0].failureReason).toBe("certificat_expire");
  });

  it("rejette un certificat dont l'issuer n'est pas la PKI souveraine", async () => {
    const svc = new MockAuthService();
    const malicious: MockCert = {
      ...makeValidCert("UNKNOWN-1"),
      issuer: "CN=AC_PIRATE",
    };
    const challenge = makeChallenge();

    const r = await svc.authenticate({
      cert: malicious,
      challenge,
      challengeSigne: `MOCK-SIGN:${challenge}`,
    });

    expect(r.success).toBe(false);
    expect(r.reason).toBe("certificat_inconnu");
  });

  it("rejette une signature de challenge invalide", async () => {
    const svc = new MockAuthService();
    svc.registerUser({
      matricule: "DGSS-001",
      serviceCode: "DGSS",
      role: "officier_traitant",
      actif: true,
    });
    const cert = makeValidCert("DGSS-001");
    const challenge = makeChallenge();

    const r = await svc.authenticate({
      cert,
      challenge,
      challengeSigne: "MAUVAISE-SIGNATURE",
    });

    expect(r.success).toBe(false);
    expect(r.reason).toBe("signature_invalide");
  });

  it("rejette un challenge périmé (> 1 min)", async () => {
    const svc = new MockAuthService();
    svc.registerUser({
      matricule: "DGSS-001",
      serviceCode: "DGSS",
      role: "officier_traitant",
      actif: true,
    });
    const cert = makeValidCert("DGSS-001");
    const old = Date.now() - 90_000; // challenge émis il y a 90s
    const challenge = makeChallenge(old);

    const r = await svc.authenticate({
      cert,
      challenge,
      challengeSigne: `MOCK-SIGN:${challenge}`,
    });

    expect(r.success).toBe(false);
    expect(r.reason).toBe("signature_invalide");
  });

  it("rejette un compte inactif", async () => {
    const svc = new MockAuthService();
    svc.registerUser({
      matricule: "INACTIF-001",
      serviceCode: "DGSS",
      role: "officier_traitant",
      actif: false,
    });
    const cert = makeValidCert("INACTIF-001");
    const challenge = makeChallenge();

    const r = await svc.authenticate({
      cert,
      challenge,
      challengeSigne: `MOCK-SIGN:${challenge}`,
    });

    expect(r.success).toBe(false);
    expect(r.reason).toBe("compte_inactif");
  });

  it("après 5 échecs consécutifs, le compte est verrouillé", async () => {
    const svc = new MockAuthService();
    svc.registerUser({
      matricule: "DGSS-001",
      serviceCode: "DGSS",
      role: "officier_traitant",
      actif: true,
    });

    for (let i = 0; i < 5; i++) {
      const cert = makeValidCert("DGSS-001");
      const challenge = makeChallenge();
      await svc.authenticate({
        cert,
        challenge,
        challengeSigne: "MAUVAISE-SIGNATURE",
      });
    }

    // Le 6e essai (même valide) doit être refusé : compte verrouillé
    const cert = makeValidCert("DGSS-001");
    const challenge = makeChallenge();
    const r = await svc.authenticate({
      cert,
      challenge,
      challengeSigne: `MOCK-SIGN:${challenge}`,
    });
    expect(r.success).toBe(false);
    expect(r.reason).toBe("compte_verrouille");
    expect(svc.locks).toHaveLength(1);
    expect(svc.locks[0].reason).toContain("5_echecs");
  });

  it("le verrouillage est idempotent (pas de doublon de verrou actif)", async () => {
    const svc = new MockAuthService();
    svc.registerUser({
      matricule: "DGSS-001",
      serviceCode: "DGSS",
      role: "officier_traitant",
      actif: true,
    });

    // 8 échecs consécutifs
    for (let i = 0; i < 8; i++) {
      const cert = makeValidCert("DGSS-001");
      const challenge = makeChallenge();
      await svc.authenticate({
        cert,
        challenge,
        challengeSigne: "MAUVAISE",
      });
    }
    expect(svc.locks).toHaveLength(1);
  });
});
