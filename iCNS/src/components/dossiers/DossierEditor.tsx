// Vue d'édition d'un dossier (Prompt 3.3)
// Référence : NTSAGUI/CNS/CDC/2026/001 §3.3

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { useICNSAuth } from "../../auth/useICNSAuth";
import { ClassificationBanner, NoCopyArea } from "./ClassificationBanner";
import { SecureFileUploader } from "../idocument/SecureFileUploader";

export interface DossierEditorProps {
  dossierId: Id<"dossiers_renseignement">;
  onClose: () => void;
}

export function DossierEditor({ dossierId, onClose }: DossierEditorProps) {
  const jwt = useICNSAuth((s) => s.jwt);
  const role = useICNSAuth((s) => s.role);
  const data = useQuery(
    api.dossiers.queries.getDossier,
    jwt ? { jwt, dossierId } : "skip",
  );

  const [signatureBlob, setSignatureBlob] = useState("");
  const [motifRenvoi, setMotifRenvoi] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const soumettreSection = useMutation(api.dossiers.sign.soumettreSection);
  const soumettreDirection = useMutation(api.dossiers.sign.soumettreDirection);
  const transmettre = useMutation(api.dossiers.transmit.transmettreDossier);
  const renvoyer = useMutation(api.dossiers.return.renvoyerDossier);
  const suspendre = useMutation(api.dossiers.sign.suspendreDossier);
  const reprendre = useMutation(api.dossiers.sign.reprendreDossier);

  if (!jwt) return null;
  if (data === undefined) {
    return <p className="text-sm text-muted-foreground">Chargement…</p>;
  }
  if (data === null) {
    return (
      <div className="space-y-2 text-sm">
        <p className="text-destructive">Dossier inaccessible (introuvable ou habilitation insuffisante).</p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-input px-3 py-1"
        >
          Retour
        </button>
      </div>
    );
  }

  const { dossier, pieces, etapes } = data;

  const runAction = async (fn: () => Promise<unknown>) => {
    setActionError(null);
    try {
      await fn();
    } catch (e) {
      setActionError((e as Error).message);
    }
  };

  return (
    <div className="space-y-4">
      <ClassificationBanner classification={dossier.classification} />

      <NoCopyArea>
        <header className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold font-mono">{dossier.reference}</h2>
            <p className="text-sm text-muted-foreground">
              Statut : <strong>{dossier.statut.replace(/_/g, " ")}</strong> ·
              Service producteur : {dossier.serviceProducteurCode} ·
              Urgence : {dossier.urgence}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-input px-3 py-1 text-sm"
          >
            Retour
          </button>
        </header>

        {/* Parcours */}
        <section className="rounded-md border border-border p-3">
          <h3 className="mb-2 text-sm font-semibold">Parcours</h3>
          <ol className="space-y-1 text-sm">
            {etapes
              .sort((a, b) => a.etapeIndex - b.etapeIndex)
              .map((e) => (
                <li
                  key={`${e.etapeIndex}-${e.dateEntree}`}
                  className="flex items-center gap-2"
                >
                  <span
                    className={
                      "inline-block h-2 w-2 rounded-full " +
                      (e.etat === "terminee"
                        ? "bg-emerald-500"
                        : e.etat === "suspendue"
                          ? "bg-amber-500"
                          : "bg-blue-500")
                    }
                  />
                  <span>
                    {e.etapeIndex + 1}. {e.etapeLabel}
                  </span>
                  {e.dateSortie && (
                    <span className="text-xs text-muted-foreground">
                      → {e.motifSortie} ({new Date(e.dateSortie).toLocaleString("fr-FR")})
                    </span>
                  )}
                </li>
              ))}
          </ol>
        </section>

        {/* Pièces */}
        <section className="rounded-md border border-border p-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Pièces ({pieces.length})</h3>
            {(role === "officier_traitant" || role === "chef_section") && (
              <span className="text-xs text-muted-foreground">
                Ajouter une pièce ci-dessous (chiffrement local)
              </span>
            )}
          </div>
          {pieces.length === 0 && (
            <p className="text-xs text-muted-foreground">Aucune pièce attachée.</p>
          )}
          <ul className="space-y-1 text-sm">
            {pieces.map((p) => (
              <li key={p._id} className="flex items-center gap-2">
                <span className="rounded bg-muted px-1 text-xs">{p.typePiece}</span>
                <span>{p.libelle}</span>
                {p.fileName && (
                  <span className="text-xs text-muted-foreground">
                    ({p.fileName}, {Math.ceil((p.fileSize ?? 0) / 1024)} Ko)
                  </span>
                )}
                <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                  {p.hashIntegrite.slice(0, 12)}…
                </span>
              </li>
            ))}
          </ul>
          {(role === "officier_traitant" || role === "chef_section") &&
            dossier.statut === "constitution" && (
              <div className="mt-3">
                <SecureFileUploader
                  jwt={jwt}
                  dossierId={dossierId}
                  typePiece="piece_probante"
                  onUploaded={() => {
                    // Le useQuery réagit automatiquement
                  }}
                />
              </div>
            )}
        </section>

        {/* Actions */}
        <section className="rounded-md border border-border p-3">
          <h3 className="mb-2 text-sm font-semibold">Actions disponibles</h3>
          {actionError && (
            <div className="mb-2 rounded-md border border-destructive/50 bg-destructive/10 p-2 text-xs text-destructive">
              {actionError}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {role === "officier_traitant" && dossier.statut === "constitution" && (
              <button
                type="button"
                onClick={() => runAction(() => soumettreSection({ jwt, dossierId }))}
                className="rounded-md bg-primary px-3 py-1 text-sm text-primary-foreground"
              >
                Soumettre au chef de section
              </button>
            )}
            {role === "chef_section" && dossier.statut === "validation_section" && (
              <button
                type="button"
                onClick={() => runAction(() => soumettreDirection({ jwt, dossierId }))}
                className="rounded-md bg-primary px-3 py-1 text-sm text-primary-foreground"
              >
                Soumettre au directeur
              </button>
            )}
            {role === "directeur_service" && dossier.statut === "validation_direction" && (
              <div className="flex w-full flex-col gap-2 rounded-md border border-border p-2">
                <label className="text-xs font-medium">
                  Signature qualifiée (blob HSM)
                </label>
                <input
                  type="text"
                  className="rounded-md border border-input bg-background px-2 py-1 text-xs font-mono"
                  value={signatureBlob}
                  onChange={(e) => setSignatureBlob(e.target.value)}
                  placeholder="MOCK-SIGN:dossier:xxx (dev) — branchera HSM en prod"
                />
                <button
                  type="button"
                  onClick={() =>
                    runAction(() =>
                      transmettre({
                        jwt,
                        dossierId,
                        signatureQualifieeBlob: signatureBlob,
                      }),
                    )
                  }
                  disabled={signatureBlob.length < 16}
                  className="rounded-md bg-primary px-3 py-1 text-sm text-primary-foreground disabled:opacity-50"
                >
                  Signer et transmettre au CNS
                </button>
              </div>
            )}

            {/* Renvoi */}
            {(role === "chef_section" || role === "directeur_service" || role === "sg_cns" || role === "analyste_cns") &&
              (dossier.statut === "validation_section" ||
                dossier.statut === "validation_direction" ||
                dossier.statut === "transmis_cns") && (
                <div className="flex w-full flex-col gap-2 rounded-md border border-border p-2">
                  <label className="text-xs font-medium">Motif de renvoi</label>
                  <input
                    type="text"
                    className="rounded-md border border-input bg-background px-2 py-1 text-xs"
                    value={motifRenvoi}
                    onChange={(e) => setMotifRenvoi(e.target.value)}
                  />
                  <div className="flex gap-2">
                    {dossier.statut === "transmis_cns" ? (
                      <button
                        type="button"
                        onClick={() =>
                          runAction(() =>
                            renvoyer({
                              jwt,
                              dossierId,
                              cible: "service_producteur",
                              motif: motifRenvoi,
                            }),
                          )
                        }
                        disabled={motifRenvoi.trim().length < 3}
                        className="rounded-md border border-amber-500 px-3 py-1 text-sm text-amber-700 disabled:opacity-50"
                      >
                        Renvoyer (incomplet)
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          runAction(() =>
                            renvoyer({
                              jwt,
                              dossierId,
                              cible: "constitution",
                              motif: motifRenvoi,
                            }),
                          )
                        }
                        disabled={motifRenvoi.trim().length < 3}
                        className="rounded-md border border-amber-500 px-3 py-1 text-sm text-amber-700 disabled:opacity-50"
                      >
                        Renvoyer en constitution
                      </button>
                    )}
                  </div>
                </div>
              )}

            {/* Suspendre / reprendre */}
            {(role === "directeur_service" || role === "sg_cns") && dossier.statut !== "suspendu" && (
              <button
                type="button"
                onClick={() =>
                  runAction(() =>
                    suspendre({
                      jwt,
                      dossierId,
                      motif: motifRenvoi || "Suspension administrative",
                    }),
                  )
                }
                className="rounded-md border border-input px-3 py-1 text-sm"
              >
                Suspendre
              </button>
            )}
            {(role === "directeur_service" || role === "sg_cns") && dossier.statut === "suspendu" && (
              <button
                type="button"
                onClick={() => runAction(() => reprendre({ jwt, dossierId }))}
                className="rounded-md bg-primary px-3 py-1 text-sm text-primary-foreground"
              >
                Reprendre
              </button>
            )}
          </div>
        </section>
      </NoCopyArea>
    </div>
  );
}
