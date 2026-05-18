// Utilitaires JWT iCNS — runtime Convex (Web Crypto API)
// Référence : NTSAGUI/CNS/CDC/2026/001 §3.2 (ET-02.4, ET-02.6) — Prompt 2.1
//
// Format : JWT compact RFC 7519 — header.payload.signature en base64url.
//
// Algorithme :
// - DEV : HS256 (HMAC-SHA256) avec une clé symétrique lue depuis ICNS_JWT_DEV_SECRET.
// - PROD : RS256 (RSA-SHA256) signé par le HSM souverain — sera branché en
//   Prompt 2.2 via le service HSM PKCS#11.
//
// La distinction est tranchée par la variable d'environnement
// ICNS_JWT_MODE ("dev" | "hsm"). Voir `.env.example`.

// ──────────────────────────────────────────────────────────────────────
// Encodage base64url
// ──────────────────────────────────────────────────────────────────────

function bytesToBase64Url(bytes: Uint8Array): string {
  let b64 = "";
  // btoa attend une chaîne binaire (chaque char codé sur un octet).
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  // btoa est disponible dans les runtimes V8 (Convex) et navigateurs.
  b64 = btoa(binary);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? 0 : 4 - (b64.length % 4);
  const padded = b64 + "=".repeat(pad);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function strToBase64Url(s: string): string {
  return bytesToBase64Url(new TextEncoder().encode(s));
}

function base64UrlToStr(b64url: string): string {
  return new TextDecoder().decode(base64UrlToBytes(b64url));
}

// ──────────────────────────────────────────────────────────────────────
// Récupération du secret de dev
// ──────────────────────────────────────────────────────────────────────

function getDevSecret(): string {
  // Convex injecte les variables via `process.env` dans le runtime.
  const secret = (globalThis as { process?: { env?: Record<string, string | undefined> } })
    .process?.env?.ICNS_JWT_DEV_SECRET;
  if (!secret) {
    throw new Error(
      "ICNS_JWT_DEV_SECRET non défini. En dev, configurer la variable dans le déploiement Convex via `npx convex env set ICNS_JWT_DEV_SECRET <valeur>`.",
    );
  }
  if (secret.length < 32) {
    throw new Error(
      "ICNS_JWT_DEV_SECRET doit faire au moins 32 caractères (HMAC-SHA256).",
    );
  }
  return secret;
}

function getMode(): "dev" | "hsm" {
  const mode = (globalThis as { process?: { env?: Record<string, string | undefined> } })
    .process?.env?.ICNS_JWT_MODE;
  return mode === "hsm" ? "hsm" : "dev";
}

// ──────────────────────────────────────────────────────────────────────
// HMAC-SHA256 (Web Crypto API)
// ──────────────────────────────────────────────────────────────────────

async function hmacSha256Key(secret: string): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function hmacSign(secret: string, message: string): Promise<Uint8Array> {
  const key = await hmacSha256Key(secret);
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message),
  );
  return new Uint8Array(sig);
}

async function hmacVerify(secret: string, message: string, signature: Uint8Array): Promise<boolean> {
  const key = await hmacSha256Key(secret);
  return await crypto.subtle.verify(
    "HMAC",
    key,
    signature,
    new TextEncoder().encode(message),
  );
}

// ──────────────────────────────────────────────────────────────────────
// API publique
// ──────────────────────────────────────────────────────────────────────

export interface JWTPayload {
  /** Subject — matricule de l'utilisateur. */
  sub: string;
  /** Session ID — référence à la table `sessions`. */
  sid: string;
  /** Issued At — millis epoch. */
  iat: number;
  /** Expiration — millis epoch (typ. iat + 15 min). */
  exp: number;
  /** Rôle iCNS — copie pour éviter une lecture de la base à chaque check. */
  role: string;
  /** Service code — idem. */
  svc: string;
}

/**
 * Signe un payload et retourne un JWT compact.
 *
 * En mode `dev` (par défaut) : HS256.
 * En mode `hsm` : RS256 via le HSM (sera implémenté en Prompt 2.2).
 */
export async function signJWT(payload: JWTPayload): Promise<string> {
  const mode = getMode();
  if (mode === "hsm") {
    // Sera implémenté en Prompt 2.2 — pour l'instant on rejette explicitement
    // pour éviter qu'un déploiement non configuré ne tombe en HS256 silencieux.
    throw new Error(
      "ICNS_JWT_MODE=hsm : la signature HSM n'est pas encore disponible (Prompt 2.2 à venir).",
    );
  }
  const header = { alg: "HS256", typ: "JWT" };
  const headerB64 = strToBase64Url(JSON.stringify(header));
  const payloadB64 = strToBase64Url(JSON.stringify(payload));
  const message = `${headerB64}.${payloadB64}`;
  const signature = await hmacSign(getDevSecret(), message);
  const signatureB64 = bytesToBase64Url(signature);
  return `${message}.${signatureB64}`;
}

/**
 * Vérifie la signature et l'expiration d'un JWT et retourne le payload.
 * Lève une erreur en cas de signature invalide, JWT mal formé, ou expiré.
 */
export async function verifyJWT(jwt: string, now: number = Date.now()): Promise<JWTPayload> {
  const parts = jwt.split(".");
  if (parts.length !== 3) throw new Error("JWT mal formé (3 parties attendues).");
  const [headerB64, payloadB64, signatureB64] = parts;

  // 1. Header
  let header: { alg?: string; typ?: string };
  try {
    header = JSON.parse(base64UrlToStr(headerB64));
  } catch {
    throw new Error("Header JWT illisible.");
  }
  if (header.typ !== "JWT") throw new Error("Header.typ != 'JWT'.");

  const mode = getMode();
  if (mode === "dev" && header.alg !== "HS256") {
    throw new Error(`Algorithme JWT non supporté en dev : ${header.alg}.`);
  }
  if (mode === "hsm" && header.alg !== "RS256") {
    throw new Error(`Algorithme JWT non supporté en hsm : ${header.alg}.`);
  }

  // 2. Signature
  const message = `${headerB64}.${payloadB64}`;
  const signature = base64UrlToBytes(signatureB64);
  let valid: boolean;
  if (mode === "dev") {
    valid = await hmacVerify(getDevSecret(), message, signature);
  } else {
    throw new Error("Vérification HSM non encore disponible (Prompt 2.2).");
  }
  if (!valid) throw new Error("Signature JWT invalide.");

  // 3. Payload + expiration
  let payload: JWTPayload;
  try {
    payload = JSON.parse(base64UrlToStr(payloadB64));
  } catch {
    throw new Error("Payload JWT illisible.");
  }
  if (typeof payload.exp !== "number" || payload.exp <= now) {
    throw new Error("JWT expiré.");
  }
  return payload;
}

/**
 * Génère un identifiant de session opaque (256 bits, base64url).
 * Utilisé comme `sid` du JWT et clé d'index sur la table `sessions`.
 */
export function generateSessionToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}
