// Pastille colorée de classification DR/CD/SD/TSD.
// Couleurs alignées sur la sémantique iCNS :
//   DR  → vert  (Diffusion Restreinte)
//   CD  → jaune (Confidentiel Défense)
//   SD  → orange (Secret Défense)
//   TSD → rouge (Très Secret Défense)

import type { Classification } from "@/data/icns-personas";

const CLASSIFICATION_STYLE: Record<
  Classification,
  { dot: string; chip: string; label: string }
> = {
  DR: {
    dot: "bg-emerald-500",
    chip: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    label: "Diffusion Restreinte",
  },
  CD: {
    dot: "bg-yellow-500",
    chip: "bg-yellow-500/15 text-yellow-800 dark:text-yellow-300 border-yellow-500/30",
    label: "Confidentiel Défense",
  },
  SD: {
    dot: "bg-orange-500",
    chip: "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30",
    label: "Secret Défense",
  },
  TSD: {
    dot: "bg-red-600",
    chip: "bg-red-600/15 text-red-700 dark:text-red-300 border-red-600/30",
    label: "Très Secret Défense",
  },
};

interface ClassificationDotProps {
  classification: Classification;
  /** Forme : `dot` (pastille seule) ou `chip` (badge avec label). */
  variant?: "dot" | "chip";
  className?: string;
}

export function ClassificationDot({
  classification,
  variant = "chip",
  className,
}: ClassificationDotProps) {
  const style = CLASSIFICATION_STYLE[classification];
  if (variant === "dot") {
    return (
      <span
        title={`${classification} — ${style.label}`}
        aria-label={`Classification ${classification}`}
        className={`inline-block h-2.5 w-2.5 rounded-full ${style.dot} ${className ?? ""}`}
      />
    );
  }
  return (
    <span
      title={style.label}
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold ${style.chip} ${className ?? ""}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden />
      {classification}
    </span>
  );
}
