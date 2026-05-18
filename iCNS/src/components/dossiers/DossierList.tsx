// Liste des dossiers visibles par l'utilisateur (Prompt 3.3)
// Référence : NTSAGUI/CNS/CDC/2026/001 §3.3

import { useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import { useICNSAuth } from "../../auth/useICNSAuth";

const STATUTS = [
  "constitution",
  "validation_section",
  "validation_direction",
  "transmis_cns",
  "renvoye_incomplet",
  "suspendu",
  "cloture_positif",
  "cloture_negatif",
  "cloture_administratif",
  "archive",
] as const;

export interface DossierListProps {
  onOpen: (dossierId: string) => void;
  onCreate: () => void;
}

export function DossierList({ onOpen, onCreate }: DossierListProps) {
  const jwt = useICNSAuth((s) => s.jwt);
  const role = useICNSAuth((s) => s.role);
  const [statutFilter, setStatutFilter] = useState<string>("");

  const dossiers = useQuery(
    api.dossiers.queries.listDossiers,
    jwt
      ? {
          jwt,
          statut: statutFilter || undefined,
          limit: 100,
        }
      : "skip",
  );

  if (!jwt) return null;

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Dossiers</h2>
        {(role === "officier_traitant" || role === "chef_section") && (
          <button
            type="button"
            onClick={onCreate}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Nouveau dossier
          </button>
        )}
      </header>

      <div className="flex items-center gap-2">
        <label htmlFor="statut-filter" className="text-sm">
          Filtrer par statut :
        </label>
        <select
          id="statut-filter"
          className="rounded-md border border-input bg-background px-2 py-1 text-sm"
          value={statutFilter}
          onChange={(e) => setStatutFilter(e.target.value)}
        >
          <option value="">Tous</option>
          {STATUTS.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>

      {dossiers === undefined && (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      )}
      {dossiers && dossiers.length === 0 && (
        <p className="text-sm text-muted-foreground">Aucun dossier visible.</p>
      )}
      {dossiers && dossiers.length > 0 && (
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-2">Référence</th>
              <th className="p-2">Classif.</th>
              <th className="p-2">Urgence</th>
              <th className="p-2">Statut</th>
              <th className="p-2">Service</th>
              <th className="p-2">Mis à jour</th>
              <th className="p-2" />
            </tr>
          </thead>
          <tbody>
            {dossiers.map((d) => (
              <tr key={d._id} className="border-t border-border hover:bg-muted/50">
                <td className="p-2 font-mono">{d.reference}</td>
                <td className="p-2">
                  <ClassificationPill classification={d.classification} />
                </td>
                <td className="p-2">
                  <UrgencePill urgence={d.urgence} />
                </td>
                <td className="p-2">{d.statut.replace(/_/g, " ")}</td>
                <td className="p-2">{d.serviceProducteurCode}</td>
                <td className="p-2 text-xs text-muted-foreground">
                  {new Date(d.updatedAt).toLocaleString("fr-FR")}
                </td>
                <td className="p-2 text-right">
                  <button
                    type="button"
                    onClick={() => onOpen(d._id)}
                    className="text-primary underline-offset-2 hover:underline"
                  >
                    Ouvrir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function ClassificationPill({
  classification,
}: {
  classification: "DR" | "CD" | "SD" | "TSD";
}) {
  const color = {
    DR: "bg-amber-500/20 text-amber-900 dark:text-amber-200",
    CD: "bg-orange-600/20 text-orange-900 dark:text-orange-200",
    SD: "bg-red-700/20 text-red-900 dark:text-red-200",
    TSD: "bg-fuchsia-900/30 text-fuchsia-100",
  }[classification];
  return (
    <span className={"rounded px-2 py-0.5 text-xs font-bold " + color}>
      {classification}
    </span>
  );
}

function UrgencePill({ urgence }: { urgence: "routine" | "urgent" | "flash" }) {
  const color = {
    routine: "bg-slate-500/20",
    urgent: "bg-amber-500/30",
    flash: "bg-red-500/40 text-red-200 animate-pulse",
  }[urgence];
  return (
    <span className={"rounded px-2 py-0.5 text-xs uppercase " + color}>
      {urgence}
    </span>
  );
}
