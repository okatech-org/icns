// Gestion des DEK (Data Encryption Keys) iCNS
// Référence : NTSAGUI/CNS/CDC/2026/001 §3.2 (ET-02.2, ET-02.3) — Prompt 2.2
//
// Architecture à 2 niveaux (envelope encryption) :
//
//   ┌──────────────────────────────────────────────────────────────────┐
//   │  KEK (Key Encryption Key) — clé maître                          │
//   │  - PROD : stockée dans le HSM souverain (PKCS#11), ne sort pas. │
//   │  - DEV  : dérivée d'ICNS_KEK_DEV_PASSPHRASE via PBKDF2.         │
//   │  - Utilisée UNIQUEMENT pour wrapper/unwrap les DEK.             │
//   └──────────────────────────────────────────────────────────────────┘
//                          │ wrap / unwrap
//                          ▼
//   ┌──────────────────────────────────────────────────────────────────┐
//   │  DEK (Data Encryption Key) — une par pièce/dossier              │
//   │  - AES-256-GCM, générée à la création de l'élément.             │
//   │  - Stockée sous forme « wrapée par KEK » dans la table iCNS.    │
//   │  - Déchiffrée à la volée pour encrypt/decrypt du contenu.       │
//   └──────────────────────────────────────────────────────────────────┘
//
// Rotation : la KEK peut être tournée annuellement sans réchiffrer toutes
// les pièces. Il suffit de réchiffrer les DEK (qui sont petits) avec la
// nouvelle KEK — opération rapide, off-peak.

// ──────────────────────────────────────────────────────────────────────
// Outils d'encodage
// ──────────────────────────────────────────────────────────────────────

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// ──────────────────────────────────────────────────────────────────────
// Configuration KEK
// ──────────────────────────────────────────────────────────────────────

type CryptoMode = "dev" | "hsm";

function getMode(): CryptoMode {
  const m = (globalThis as { process?: { env?: Record<string, string | undefined> } })
    .process?.env?.ICNS_CRYPTO_MODE;
  return m === "hsm" ? "hsm" : "dev";
}

function getDevPassphrase(): string {
  const p = (globalThis as { process?: { env?: Record<string, string | undefined> } })
    .process?.env?.ICNS_KEK_DEV_PASSPHRASE;
  if (!p || p.length < 32) {
    throw new Error(
      "ICNS_KEK_DEV_PASSPHRASE non définie ou trop courte (≥ 32 caractères).",
    );
  }
  return p;
}

/** Salt fixe pour la dérivation PBKDF2 en dev. À garder constant — sinon
 *  la KEK change d'un déploiement à l'autre et les données existantes
 *  deviennent illisibles. En prod, la KEK vit dans le HSM, ce salt n'est
 *  pas utilisé. */
const DEV_KEK_SALT = new TextEncoder().encode("iCNS-DEV-KEK-SALT-v1");

let cachedDevKEK: CryptoKey | null = null;

/**
 * Récupère la KEK active.
 *
 * - DEV : dérive la KEK depuis ICNS_KEK_DEV_PASSPHRASE via PBKDF2.
 *   Le cache mémoise le résultat pour éviter le coût PBKDF2 à chaque appel.
 * - HSM : non encore implémenté — Convex actions appelleront un sidecar
 *   PKCS#11 (cf. docs/key-management.md §4).
 */
async function getKEK(): Promise<CryptoKey> {
  const mode = getMode();
  if (mode === "hsm") {
    throw new Error(
      "ICNS_CRYPTO_MODE=hsm : intégration HSM non encore disponible. À implémenter dans une Convex action (cf. docs/key-management.md).",
    );
  }
  if (cachedDevKEK) return cachedDevKEK;

  const passphrase = getDevPassphrase();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );
  const kek = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: DEV_KEK_SALT,
      iterations: 200_000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false, // non extractable — la KEK ne quitte jamais le module crypto
    ["encrypt", "decrypt"],
  );
  cachedDevKEK = kek;
  return kek;
}

// ──────────────────────────────────────────────────────────────────────
// Génération et wrap des DEK
// ──────────────────────────────────────────────────────────────────────

/**
 * Génère une nouvelle DEK AES-256-GCM, extractable (pour pouvoir la
 * wrapper) mais utilisable pour encrypt/decrypt.
 */
export async function generateDEK(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true, // extractable — nécessaire pour le wrap
    ["encrypt", "decrypt"],
  );
}

/**
 * Wrap une DEK par la KEK. Retourne un blob base64 contenant :
 *   `<iv-base64>:<wrappedKey-base64>`
 *
 * Le format est versionné par la version implicite de la KEK (cf.
 * `docs/key-management.md` pour la procédure de rotation).
 */
export async function wrapDEK(dek: CryptoKey): Promise<string> {
  const kek = await getKEK();
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Exporter la DEK en raw, puis l'encrypter avec la KEK (AES-GCM).
  const dekRaw = await crypto.subtle.exportKey("raw", dek);
  const wrapped = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    kek,
    dekRaw,
  );

  return `${bytesToBase64(iv)}:${bytesToBase64(new Uint8Array(wrapped))}`;
}

/**
 * Unwrap une DEK à partir de son blob wrappé.
 *
 * @throws si le blob est mal formé ou si la KEK actuelle ne peut pas
 *         déchiffrer (signature GCM invalide).
 */
export async function unwrapDEK(wrappedBlob: string): Promise<CryptoKey> {
  const [ivB64, wrappedB64] = wrappedBlob.split(":");
  if (!ivB64 || !wrappedB64) {
    throw new Error("Blob DEK wrappé mal formé.");
  }
  const iv = base64ToBytes(ivB64);
  const wrapped = base64ToBytes(wrappedB64);

  const kek = await getKEK();
  const dekRaw = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    kek,
    wrapped,
  );

  return await crypto.subtle.importKey(
    "raw",
    dekRaw,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

/**
 * Réchiffre un DEK wrappé sous l'ancienne KEK avec la nouvelle KEK.
 * Utilisé lors de la rotation annuelle (cf. docs).
 *
 * Note : cette fonction suppose qu'on dispose simultanément des deux KEK
 * (ancienne et nouvelle). En prod avec HSM, la rotation utilise une
 * fenêtre temporaire pendant laquelle les deux clés coexistent.
 */
export async function rewrapDEK(
  wrappedBlob: string,
  // Le caller fournit la fonction d'unwrap qui utilise l'ANCIENNE KEK.
  // Cette injection permet d'éviter de coder en dur la logique de
  // rotation dans ce module.
  unwrapWithOldKEK: (blob: string) => Promise<CryptoKey>,
): Promise<string> {
  const dek = await unwrapWithOldKEK(wrappedBlob);
  return await wrapDEK(dek);
}

// ──────────────────────────────────────────────────────────────────────
// Helpers de test (uniquement disponibles si exposés explicitement)
// ──────────────────────────────────────────────────────────────────────

/** Réinitialise le cache KEK — utile pour les tests qui changent la passphrase. */
export function _resetKEKCache(): void {
  cachedDevKEK = null;
}
