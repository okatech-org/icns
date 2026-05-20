// Pill colorée indiquant la politique de visibilité d'un dossier.
//   private  → 🔒 Privé        (gris)
//   shared   → 👥 Partagé      (bleu)
//   service  → 🏛️ Service       (indigo)
//   cns_wide → 🌐 CNS           (violet)

import { Globe, Landmark, Lock, Users } from "lucide-react";
import type { VaultVisibility } from "@/types/idocument";

interface FolderVisibilityBadgeProps {
  visibility: VaultVisibility;
  serviceLabel?: string;
  className?: string;
}

export function FolderVisibilityBadge({
  visibility,
  serviceLabel,
  className,
}: FolderVisibilityBadgeProps) {
  const base =
    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium";

  switch (visibility.kind) {
    case "private":
      return (
        <span
          title="Visible uniquement par vous"
          className={`${base} border-slate-400/40 bg-slate-400/15 text-slate-700 dark:text-slate-200 ${className ?? ""}`}
        >
          <Lock className="h-3 w-3" />
          Privé
        </span>
      );
    case "shared": {
      const count =
        visibility.matricules.length +
        visibility.roles.length +
        visibility.services.length;
      return (
        <span
          title={`Partagé avec ${count} cible(s)`}
          className={`${base} border-blue-500/40 bg-blue-500/15 text-blue-700 dark:text-blue-300 ${className ?? ""}`}
        >
          <Users className="h-3 w-3" />
          Partagé · {count}
        </span>
      );
    }
    case "service":
      return (
        <span
          title={`Visible par tout le service ${serviceLabel ?? visibility.service}`}
          className={`${base} border-indigo-500/40 bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 ${className ?? ""}`}
        >
          <Landmark className="h-3 w-3" />
          {serviceLabel ?? visibility.service}
        </span>
      );
    case "cns_wide":
      return (
        <span
          title="Visible par tout iCNS authentifié"
          className={`${base} border-purple-500/40 bg-purple-500/15 text-purple-700 dark:text-purple-300 ${className ?? ""}`}
        >
          <Globe className="h-3 w-3" />
          CNS
        </span>
      );
  }
}
