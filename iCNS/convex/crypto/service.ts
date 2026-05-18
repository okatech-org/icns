// Service de chiffrement iCNS — AES-256-GCM
// Référence : NTSAGUI/CNS/CDC/2026/001 §3.2 (ET-02.2) — Prompt 2.2
//
// API minimale et opaque : seules `encrypt(payload, contextKey)` et
// `decrypt(ciphertext, contextKey)` sont exposées au code applicatif.
//
// Le `contextKey` est lié à la pièce/dossier concerné (ex. "piece:abc123")
// et permet de :
// - récupérer la DEK existante depuis le store (table `dek_store`) ou la
//   créer si absente ;
// - inclure le contextKey comme AAD (Additional Authenticated Data) dans
//   l'AES-GCM, ce qui empêche le « swap » d'un ciphertext entre deux
//   pièces (rejouage cross-record).
//
// Branchement HSM : en mode `hsm`, le service délègue le wrap/unwrap des
// DEK à une Convex action qui appelle le sidecar PKCS#11. Le reste du
// code applicatif n'est pas modifié.

import { generateDEK, unwrapDEK, wrapDEK } from "./dek_manager";

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
// Format de stockage
// ──────────────────────────────────────────────────────────────────────

/**
 * Représente un blob chiffré tel que stocké dans la base.
 *
 * Sérialisation : JSON compact (gardée lisible pour debug ; en prod on
 * pourrait passer en MessagePack pour gagner ~30%).
 *
 *   {
 *     v: 1,                                  // version du format
 *     ctx: "piece:abc",                      // contextKey pour AAD
 *     wrappedDEK: "<iv>:<wrapped>",          // DEK wrappée par KEK
 *     iv: "<base64>",                        // IV du chiffrement de contenu
 *     ct: "<base64>"                         // ciphertext (avec tag GCM)
 *   }
 */
interface EncryptedBlob {
  v: 1;
  ctx: string;
  wrappedDEK: string;
  iv: string;
  ct: string;
}

const BLOB_VERSION = 1;

// ──────────────────────────────────────────────────────────────────────
// API publique
// ──────────────────────────────────────────────────────────────────────

/**
 * Chiffre un payload UTF-8 (texte ou JSON) et retourne un blob string
 * sérialisable directement dans un champ `v.string()` du schéma Convex.
 *
 * @param payload Le contenu à chiffrer (UTF-8).
 * @param contextKey Identifiant logique de la donnée (ex. "piece:abc").
 *                   Inclus comme AAD pour empêcher le rejeu cross-record.
 */
export async function encrypt(payload: string, contextKey: string): Promise<string> {
  // 1. Nouvelle DEK pour chaque chiffrement — pas de réutilisation.
  //    C'est volontaire : un attaquant qui obtiendrait une DEK ne pourrait
  //    déchiffrer qu'un seul blob.
  const dek = await generateDEK();
  const wrappedDEK = await wrapDEK(dek);

  // 2. Chiffrement AES-GCM avec contextKey en AAD.
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(payload);
  const aad = new TextEncoder().encode(contextKey);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: aad, tagLength: 128 },
    dek,
    data,
  );

  // 3. Sérialisation du blob.
  const blob: EncryptedBlob = {
    v: BLOB_VERSION,
    ctx: contextKey,
    wrappedDEK,
    iv: bytesToBase64(iv),
    ct: bytesToBase64(new Uint8Array(ciphertext)),
  };
  return JSON.stringify(blob);
}

/**
 * Déchiffre un blob produit par `encrypt`.
 *
 * @throws si le blob est mal formé, si le contextKey ne correspond pas
 *         à celui utilisé à l'encryption (AAD mismatch — protection
 *         contre le rejeu cross-record), ou si l'intégrité GCM échoue.
 */
export async function decrypt(blobString: string, contextKey: string): Promise<string> {
  let blob: EncryptedBlob;
  try {
    blob = JSON.parse(blobString);
  } catch {
    throw new Error("Blob chiffré illisible (JSON invalide).");
  }
  if (blob.v !== BLOB_VERSION) {
    throw new Error(`Version de blob non supportée : ${blob.v}`);
  }
  if (blob.ctx !== contextKey) {
    throw new Error(
      `contextKey mismatch : attendu "${contextKey}", trouvé "${blob.ctx}". Tentative de rejeu cross-record ?`,
    );
  }

  // 1. Unwrap de la DEK.
  const dek = await unwrapDEK(blob.wrappedDEK);

  // 2. Déchiffrement AES-GCM. La vérification du tag GCM échoue si :
  //    - le ciphertext a été altéré ;
  //    - le contextKey (AAD) ne correspond pas ;
  //    - la DEK est fausse.
  const iv = base64ToBytes(blob.iv);
  const ct = base64ToBytes(blob.ct);
  const aad = new TextEncoder().encode(contextKey);

  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv, additionalData: aad, tagLength: 128 },
    dek,
    ct,
  );

  return new TextDecoder().decode(plain);
}

/**
 * Helper : chiffre un objet JSON en blob string.
 */
export async function encryptJSON<T>(obj: T, contextKey: string): Promise<string> {
  return await encrypt(JSON.stringify(obj), contextKey);
}

/**
 * Helper : déchiffre un blob string vers un objet JSON.
 */
export async function decryptJSON<T>(blobString: string, contextKey: string): Promise<T> {
  const plain = await decrypt(blobString, contextKey);
  return JSON.parse(plain) as T;
}
