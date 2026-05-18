// Lecteur de carte agent iCNS — composant React
// Référence : NTSAGUI/CNS/CDC/2026/001 §3.2 (ET-02.4) — Prompt 2.1
//
// Flux multi-facteurs :
//   1. Insertion de la carte agent → certificat X.509 lu
//   2. Saisie du PIN (vérifié LOCALEMENT par la carte, jamais envoyé)
//   3. Empreinte biométrique (vérifiée LOCALEMENT sur le poste)
//   4. Challenge serveur signé par la carte → mutation `authenticate`
//   5. Stockage en mémoire du JWT (jamais en localStorage / sessionStorage)
//
// STUB DEV : sans hardware carte, on simule via :
//   - une sélection d'agent dans un dropdown (chacun correspond à un
//     certificat de test) ;
//   - n'importe quel PIN à 4-8 chiffres ;
//   - un clic « confirmer empreinte » ;
//   - une signature de challenge fictive `MOCK-SIGN:<challenge>`.
//
// Le composant est conçu pour être branché directement à un état global
// d'auth (zustand / context) qui maintient le JWT en mémoire et déclenche
// le verrouillage automatique après 15 min d'inactivité.

import { useMutation, useQuery } from "convex/react";
import { useEffect, useMemo, useState } from "react";
import { api } from "../../convex/_generated/api";

// ──────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────

export interface MockCertificat {
  /** Libellé affiché dans le dropdown dev. */
  label: string;
  matricule: string;
  serialNumber: string;
  issuer: string;
  notBefore: number;
  notAfter: number;
}

interface AuthSuccess {
  jwt: string;
  expiresAt: number;
  role: string;
  service: string;
}

export interface LoginCardReaderProps {
  /** Liste des certificats de test pour le mode dev (vide en prod). */
  mockCertificats?: MockCertificat[];
  /** Callback invoqué après authentification réussie. */
  onAuthenticated: (auth: AuthSuccess) => void;
  /** Callback optionnel sur erreur (pour audit côté client). */
  onError?: (message: string) => void;
}

type FlowStep = "carte" | "pin" | "biometrie" | "signature" | "termine";

// ──────────────────────────────────────────────────────────────────────
// Certificats de test (dev uniquement)
// ──────────────────────────────────────────────────────────────────────

const NOW = Date.now();
const ONE_YEAR = 365 * 24 * 60 * 60 * 1000;

export const DEV_MOCK_CERTIFICATS: MockCertificat[] = [
  {
    label: "Lt-Col KOUMBA Jean — Officier traitant DGSS",
    matricule: "DGSS-001",
    serialNumber: "SN-0001",
    issuer: "CN=PKI_SOUVERAINE_DEV",
    notBefore: NOW - ONE_YEAR,
    notAfter: NOW + ONE_YEAR,
  },
  {
    label: "Col MOUSSAVOU Pierre — Directeur DGR",
    matricule: "DGR-DIR-001",
    serialNumber: "SN-0002",
    issuer: "CN=PKI_SOUVERAINE_DEV",
    notBefore: NOW - ONE_YEAR,
    notAfter: NOW + ONE_YEAR,
  },
  {
    label: "M. NDONG Alain — Analyste CNS",
    matricule: "CNS-ANA-001",
    serialNumber: "SN-0003",
    issuer: "CN=PKI_SOUVERAINE_DEV",
    notBefore: NOW - ONE_YEAR,
    notAfter: NOW + ONE_YEAR,
  },
  {
    label: "Gén. ESSONO Christian — Secrétaire Général CNS",
    matricule: "CNS-SG-001",
    serialNumber: "SN-0004",
    issuer: "CN=PKI_SOUVERAINE_DEV",
    notBefore: NOW - ONE_YEAR,
    notAfter: NOW + ONE_YEAR,
  },
];

// ──────────────────────────────────────────────────────────────────────
// Composant
// ──────────────────────────────────────────────────────────────────────

export function LoginCardReader({
  mockCertificats = DEV_MOCK_CERTIFICATS,
  onAuthenticated,
  onError,
}: LoginCardReaderProps) {
  const [step, setStep] = useState<FlowStep>("carte");
  const [cert, setCert] = useState<MockCertificat | null>(null);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Récupère un nouveau challenge à chaque entrée dans l'étape « signature »
  // pour garantir la fraîcheur. La query est invalidée à chaque refresh.
  const challenge = useQuery(
    api.auth.authenticate.issueChallenge,
    step === "signature" ? {} : "skip",
  );
  const authenticate = useMutation(api.auth.authenticate.authenticate);

  // Adresse IP et poste — à récupérer côté poste durci. En dev, valeurs
  // statiques injectées par variables d'environnement Vite.
  const adresseIP = useMemo(
    () => import.meta.env.VITE_POSTE_IP ?? "10.0.0.99",
    [],
  );
  const poste = useMemo(
    () => import.meta.env.VITE_POSTE_ID ?? "PDG-DEV-001",
    [],
  );

  // Lance l'appel `authenticate` dès qu'un challenge est disponible et
  // que l'utilisateur a validé biométrie + PIN.
  useEffect(() => {
    if (step !== "signature") return;
    if (!cert || !challenge) return;
    if (submitting) return;

    void (async () => {
      setSubmitting(true);
      setAuthError(null);
      try {
        const result = await authenticate({
          certificat: {
            matricule: cert.matricule,
            serialNumber: cert.serialNumber,
            issuer: cert.issuer,
            notBefore: cert.notBefore,
            notAfter: cert.notAfter,
          },
          challenge: challenge.challenge,
          // Mock — en prod, signature ECDSA via la carte agent.
          challengeSigne: `MOCK-SIGN:${challenge.challenge}`,
          adresseIP,
          poste,
        });
        setStep("termine");
        onAuthenticated(result);
      } catch (err) {
        const msg = (err as Error).message;
        setAuthError(msg);
        onError?.(msg);
        // On revient à l'étape carte pour un nouvel essai.
        setStep("carte");
        setCert(null);
        setPin("");
      } finally {
        setSubmitting(false);
      }
    })();
  }, [step, cert, challenge, submitting, authenticate, adresseIP, poste, onAuthenticated, onError]);

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <div className="mx-auto w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Connexion iCNS
        </h1>
        <p className="text-sm text-muted-foreground">
          Conseil National de Sécurité — Authentification multi-facteurs
        </p>
      </header>

      {/* Stepper visuel */}
      <ol className="mb-6 flex items-center gap-2 text-xs uppercase tracking-wide">
        <Step active={step === "carte"} done={step !== "carte"} label="Carte" />
        <Step
          active={step === "pin"}
          done={["biometrie", "signature", "termine"].includes(step)}
          label="PIN"
        />
        <Step
          active={step === "biometrie"}
          done={["signature", "termine"].includes(step)}
          label="Biométrie"
        />
        <Step
          active={step === "signature"}
          done={step === "termine"}
          label="Signature"
        />
      </ol>

      {/* Étape 1 — Carte */}
      {step === "carte" && (
        <div className="space-y-3">
          <label
            htmlFor="cert-select"
            className="block text-sm font-medium text-foreground"
          >
            Insérer la carte agent
          </label>
          <select
            id="cert-select"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={cert?.serialNumber ?? ""}
            onChange={(e) => {
              const c = mockCertificats.find(
                (m) => m.serialNumber === e.target.value,
              );
              setCert(c ?? null);
            }}
          >
            <option value="">— Aucune carte détectée —</option>
            {mockCertificats.map((c) => (
              <option key={c.serialNumber} value={c.serialNumber}>
                {c.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            En production, la carte est lue automatiquement par le lecteur USB
            du poste durci. Le menu déroulant ci-dessus est un stub de
            développement.
          </p>
          <button
            type="button"
            disabled={!cert}
            onClick={() => setStep("pin")}
            className="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            Continuer
          </button>
        </div>
      )}

      {/* Étape 2 — PIN */}
      {step === "pin" && cert && (
        <div className="space-y-3">
          <label htmlFor="pin-input" className="block text-sm font-medium">
            Saisir le code PIN
          </label>
          <input
            id="pin-input"
            type="password"
            inputMode="numeric"
            pattern="[0-9]{4,8}"
            maxLength={8}
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setPinError(null);
            }}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-center text-lg tracking-widest"
            autoFocus
            autoComplete="off"
          />
          {pinError && <p className="text-sm text-destructive">{pinError}</p>}
          <p className="text-xs text-muted-foreground">
            Le PIN est vérifié localement par la carte. Il n'est jamais
            transmis au serveur.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setStep("carte");
                setPin("");
              }}
              className="flex-1 rounded-md border border-input py-2 text-sm"
            >
              Retour
            </button>
            <button
              type="button"
              onClick={() => {
                if (!/^\d{4,8}$/.test(pin)) {
                  setPinError("Le PIN doit contenir 4 à 8 chiffres.");
                  return;
                }
                // En prod, cette étape déclenche la vérification du PIN par
                // la carte (commande APDU). En dev, on accepte.
                setStep("biometrie");
              }}
              className="flex-1 rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground"
            >
              Vérifier
            </button>
          </div>
        </div>
      )}

      {/* Étape 3 — Biométrie */}
      {step === "biometrie" && (
        <div className="space-y-3">
          <p className="text-sm text-foreground">
            Veuillez poser le doigt sur le lecteur biométrique du poste durci.
          </p>
          <div className="flex h-32 items-center justify-center rounded-md border border-dashed border-border bg-muted/50">
            <span className="text-3xl" aria-hidden>
              ✋
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            La vérification biométrique est locale au poste — aucune donnée
            biométrique n'est transmise au serveur iCNS.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep("pin")}
              className="flex-1 rounded-md border border-input py-2 text-sm"
            >
              Retour
            </button>
            <button
              type="button"
              onClick={() => setStep("signature")}
              className="flex-1 rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground"
            >
              Empreinte confirmée
            </button>
          </div>
        </div>
      )}

      {/* Étape 4 — Signature / authentification serveur */}
      {step === "signature" && (
        <div className="space-y-3 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm">
            Vérification du certificat et ouverture de la session…
          </p>
        </div>
      )}

      {/* Étape finale */}
      {step === "termine" && (
        <div className="space-y-3 text-center">
          <p className="text-sm font-medium text-foreground">
            Session ouverte ✓
          </p>
          <p className="text-xs text-muted-foreground">
            Redirection vers votre espace…
          </p>
        </div>
      )}

      {authError && (
        <div className="mt-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {authError}
        </div>
      )}

      <footer className="mt-6 text-center text-xs text-muted-foreground">
        Conseil National de Sécurité — République Gabonaise
        <br />
        CONFIDENTIEL DÉFENSE
      </footer>
    </div>
  );
}

function Step({
  active,
  done,
  label,
}: {
  active: boolean;
  done: boolean;
  label: string;
}) {
  return (
    <li
      className={
        "flex-1 rounded-md border px-2 py-1 text-center " +
        (active
          ? "border-primary bg-primary/10 text-primary"
          : done
            ? "border-border bg-muted text-muted-foreground"
            : "border-border text-muted-foreground")
      }
    >
      {label}
    </li>
  );
}
