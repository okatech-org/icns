// Assistant de création d'un dossier (Prompt 3.3)
// Référence : NTSAGUI/CNS/CDC/2026/001 §2.1 (EF-01.1)

import { useMutation } from "convex/react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useICNSAuth } from "../../auth/useICNSAuth";
import { ClassificationBanner } from "./ClassificationBanner";

type Classification = "DR" | "CD" | "SD" | "TSD";
type Urgence = "routine" | "urgent" | "flash";

export interface NewDossierWizardProps {
  /** Types de dossier disponibles pour l'utilisateur (préchargés). */
  availableTypes: ReadonlyArray<{
    _id: Id<"types_dossier">;
    code: string;
    label: string;
    classificationMin: Classification;
  }>;
  onCreated: (dossierId: string, reference: string) => void;
  onCancel: () => void;
}

export function NewDossierWizard({
  availableTypes,
  onCreated,
  onCancel,
}: NewDossierWizardProps) {
  const jwt = useICNSAuth((s) => s.jwt);
  const createDossier = useMutation(api.dossiers.create.createDossier);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [typeDossierId, setTypeDossierId] = useState<Id<"types_dossier"> | "">("");
  const [classification, setClassification] = useState<Classification>("DR");
  const [urgence, setUrgence] = useState<Urgence>("routine");
  const [titre, setTitre] = useState("");
  const [synthese, setSynthese] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedType = availableTypes.find((t) => t._id === typeDossierId);
  const minOrder = { DR: 0, CD: 1, SD: 2, TSD: 3 };
  const allowedClass: Classification[] = selectedType
    ? (["DR", "CD", "SD", "TSD"] as Classification[]).filter(
        (c) => minOrder[c] >= minOrder[selectedType.classificationMin],
      )
    : ["DR", "CD", "SD", "TSD"];

  const submit = async () => {
    if (!jwt || !typeDossierId || !titre.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const r = await createDossier({
        jwt,
        typeDossierId: typeDossierId as Id<"types_dossier">,
        classification,
        urgence,
        titre: titre.trim(),
        synthese: synthese.trim() || undefined,
      });
      onCreated(r.dossierId, r.reference);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <ClassificationBanner classification={classification} />

      <header>
        <h2 className="text-xl font-semibold">Nouveau dossier de renseignement</h2>
        <p className="text-sm text-muted-foreground">
          Étape {step} sur 3 — la référence classifiée sera générée à la création.
        </p>
      </header>

      {/* Étape 1 — type + classification + urgence */}
      {step === 1 && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium">Type de dossier</label>
            <select
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={typeDossierId}
              onChange={(e) => setTypeDossierId(e.target.value as Id<"types_dossier"> | "")}
            >
              <option value="">— sélectionner —</option>
              {availableTypes.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.code} — {t.label} (min {t.classificationMin})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Classification</label>
            <div className="mt-1 flex gap-2">
              {allowedClass.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setClassification(c)}
                  className={
                    "rounded-md border px-3 py-1 text-sm " +
                    (classification === c
                      ? "border-primary bg-primary/10"
                      : "border-input")
                  }
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Urgence</label>
            <div className="mt-1 flex gap-2">
              {(["routine", "urgent", "flash"] as const).map((u) => (
                <button
                  type="button"
                  key={u}
                  onClick={() => setUrgence(u)}
                  className={
                    "rounded-md border px-3 py-1 text-sm " +
                    (urgence === u ? "border-primary bg-primary/10" : "border-input")
                  }
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md border border-input px-4 py-2 text-sm"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={!typeDossierId}
              onClick={() => setStep(2)}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        </div>
      )}

      {/* Étape 2 — titre + synthèse */}
      {step === 2 && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium">Titre du dossier</label>
            <input
              type="text"
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Sujet général du dossier"
              autoFocus
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Sera chiffré au serveur (AES-256-GCM via HSM).
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium">Synthèse (facultatif)</label>
            <textarea
              rows={5}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={synthese}
              onChange={(e) => setSynthese(e.target.value)}
              placeholder="Résumé de l'objet, du contexte, des principaux éléments…"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-md border border-input px-4 py-2 text-sm"
            >
              Retour
            </button>
            <button
              type="button"
              disabled={!titre.trim()}
              onClick={() => setStep(3)}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        </div>
      )}

      {/* Étape 3 — récapitulatif */}
      {step === 3 && (
        <div className="space-y-3">
          <h3 className="font-semibold">Récapitulatif</h3>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-muted-foreground">Type</dt>
            <dd>{selectedType ? `${selectedType.code} — ${selectedType.label}` : "?"}</dd>
            <dt className="text-muted-foreground">Classification</dt>
            <dd>{classification}</dd>
            <dt className="text-muted-foreground">Urgence</dt>
            <dd>{urgence}</dd>
            <dt className="text-muted-foreground">Titre</dt>
            <dd>{titre}</dd>
            {synthese && (
              <>
                <dt className="text-muted-foreground">Synthèse</dt>
                <dd className="whitespace-pre-wrap">{synthese}</dd>
              </>
            )}
          </dl>

          {error && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={submitting}
              className="rounded-md border border-input px-4 py-2 text-sm"
            >
              Retour
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={submit}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {submitting ? "Création…" : "Créer le dossier"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
