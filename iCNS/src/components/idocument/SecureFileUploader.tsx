// iDocument — SecureFileUploader (Prompt 3.1)
// Référence : NTSAGUI/CNS/CDC/2026/001 §2.5 (EF-05)
//
// Composant React qui chiffre le fichier côté navigateur AVANT upload :
//   1. Génère une DEK aléatoire AES-256-GCM
//   2. Calcule SHA-256 du plaintext
//   3. Chiffre le fichier (single-blob, IV 96 bits aléatoire)
//   4. Demande une URL d'upload Convex
//   5. Upload le ciphertext
//   6. Appelle `recordUpload` avec la DEK raw (b64) → wrappée serveur
//      immédiatement par la KEK (HSM en prod)
//
// Limite actuelle : single-blob (charge tout en mémoire). Pour > 50 Mo,
// passer en streaming chunké (à faire en Phase 4 si besoin opérationnel).

import { useMutation } from "convex/react";
import { useCallback, useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

// ──────────────────────────────────────────────────────────────────────
// Types / props
// ──────────────────────────────────────────────────────────────────────

export type TypePiece =
  | "note"
  | "fiche_individu"
  | "fiche_organisation"
  | "piece_probante"
  | "transcription"
  | "rapport"
  | "piece_procedure"
  | "avis";

export interface SecureFileUploaderProps {
  jwt: string;
  /** Si fourni, le fichier sera rattaché à ce dossier en tant que pièce. */
  dossierId?: Id<"dossiers_renseignement">;
  typePiece?: TypePiece;
  libelle?: string;
  /** Limite indicative côté client (côté serveur : DEFAULT_MAX_FILE_SIZE). */
  maxSizeBytes?: number;
  onUploaded?: (docId: Id<"idocDocuments">) => void;
  onError?: (message: string) => void;
}

interface ProgressState {
  step: "idle" | "hashing" | "encrypting" | "uploading" | "recording" | "done" | "error";
  progress: number; // 0-100
  message?: string;
}

// ──────────────────────────────────────────────────────────────────────
// Utilitaires crypto navigateur
// ──────────────────────────────────────────────────────────────────────

async function sha256HexFromBuffer(buf: ArrayBuffer): Promise<string> {
  const h = await crypto.subtle.digest("SHA-256", buf);
  const bytes = new Uint8Array(h);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, "0");
  return hex;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

async function encryptFile(
  plain: ArrayBuffer,
): Promise<{ ciphertext: ArrayBuffer; dekRawBase64: string; iv: Uint8Array }> {
  const dek = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, dek, plain);
  const dekRaw = new Uint8Array(await crypto.subtle.exportKey("raw", dek));
  return {
    ciphertext,
    dekRawBase64: bytesToBase64(dekRaw),
    iv,
  };
}

/**
 * Sérialise le blob chiffré pour l'upload : [12 octets IV][ciphertext].
 * Le récepteur (au download) sait extraire l'IV des 12 premiers octets.
 */
function serializeEncryptedBlob(iv: Uint8Array, ciphertext: ArrayBuffer): Blob {
  const out = new Uint8Array(iv.length + ciphertext.byteLength);
  out.set(iv, 0);
  out.set(new Uint8Array(ciphertext), iv.length);
  return new Blob([out], { type: "application/octet-stream" });
}

// ──────────────────────────────────────────────────────────────────────
// Composant
// ──────────────────────────────────────────────────────────────────────

const DEFAULT_MAX = 500 * 1024 * 1024;

export function SecureFileUploader({
  jwt,
  dossierId,
  typePiece,
  libelle,
  maxSizeBytes = DEFAULT_MAX,
  onUploaded,
  onError,
}: SecureFileUploaderProps) {
  const [state, setState] = useState<ProgressState>({ step: "idle", progress: 0 });
  const generateUploadUrl = useMutation(api.idocument.upload.generateUploadUrl);
  const recordUpload = useMutation(api.idocument.upload.recordUpload);

  const handleFile = useCallback(
    async (file: File) => {
      if (file.size > maxSizeBytes) {
        const msg = `Fichier trop volumineux : ${file.size} > ${maxSizeBytes} octets.`;
        setState({ step: "error", progress: 0, message: msg });
        onError?.(msg);
        return;
      }

      try {
        // 1. Lire le contenu en ArrayBuffer (en mémoire — limite ~500 Mo)
        setState({ step: "hashing", progress: 5, message: "Calcul du hash…" });
        const plain = await file.arrayBuffer();
        const hashPlaintext = await sha256HexFromBuffer(plain);

        // 2. Chiffrer
        setState({ step: "encrypting", progress: 25, message: "Chiffrement local…" });
        const { ciphertext, dekRawBase64, iv } = await encryptFile(plain);
        const encryptedBlob = serializeEncryptedBlob(iv, ciphertext);

        // 3. Demander URL d'upload
        setState({ step: "uploading", progress: 50, message: "Upload du ciphertext…" });
        const uploadUrl = await generateUploadUrl({ jwt });

        // 4. Upload via fetch POST direct vers Convex Storage
        const uploadResp = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": "application/octet-stream" },
          body: encryptedBlob,
        });
        if (!uploadResp.ok) {
          throw new Error(`Upload échoué (${uploadResp.status}).`);
        }
        const { storageId } = (await uploadResp.json()) as {
          storageId: Id<"_storage">;
        };

        // 5. Enregistrer le record côté serveur (DEK wrappée immédiatement)
        setState({ step: "recording", progress: 85, message: "Enregistrement…" });
        const { docId } = await recordUpload({
          jwt,
          storageId,
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          fileSize: file.size,
          hashPlaintext,
          dekRawBase64,
          dossierId,
          typePiece,
          libelle,
        });

        setState({ step: "done", progress: 100, message: "Fichier sécurisé ✓" });
        onUploaded?.(docId);
      } catch (err) {
        const msg = (err as Error).message;
        setState({ step: "error", progress: 0, message: msg });
        onError?.(msg);
      }
    },
    [
      jwt,
      generateUploadUrl,
      recordUpload,
      dossierId,
      typePiece,
      libelle,
      maxSizeBytes,
      onUploaded,
      onError,
    ],
  );

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border p-6 text-center hover:bg-muted/50">
        <span className="text-sm font-medium">
          Sélectionner un fichier à chiffrer et téléverser
        </span>
        <span className="text-xs text-muted-foreground">
          Le fichier est chiffré localement sur le poste avant envoi.
          {typePiece ? ` — Type: ${typePiece}` : ""}
        </span>
        <input
          type="file"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
          }}
        />
      </label>

      {state.step !== "idle" && (
        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span>{state.message ?? state.step}</span>
            <span>{state.progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={
                "h-full transition-all " +
                (state.step === "error"
                  ? "bg-destructive"
                  : state.step === "done"
                    ? "bg-emerald-500"
                    : "bg-primary")
              }
              style={{ width: `${state.progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
