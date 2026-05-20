// Bandeau permanent indiquant la classification du contenu affiché
// Référence : NTSAGUI/CNS/CDC/2026/001 §3.3 (ET-03.4) — Prompt 3.3

import type { ReactNode } from "react";

export type Classification = "DR" | "CD" | "SD" | "TSD";

const CLASS_LABEL: Record<Classification, string> = {
  DR: "DIFFUSION RESTREINTE",
  CD: "CONFIDENTIEL DÉFENSE",
  SD: "SECRET DÉFENSE",
  TSD: "TRÈS SECRET DÉFENSE",
};

// Palette rouge opaque subtile (aligne sur les tokens danger du design system).
// Garde une progression d'intensite : DR (ambre clair) < CD (rose-rouge) <
// SD (rouge muted) < TSD (rouge fonce opaque).
const CLASS_COLOR: Record<Classification, string> = {
  DR: "bg-amber-100/95 text-amber-900 border-y border-amber-300/60 dark:bg-amber-950/80 dark:text-amber-100 dark:border-amber-800/60",
  CD: "bg-rose-100/95 text-rose-900 border-y border-rose-300/60 dark:bg-rose-950/80 dark:text-rose-100 dark:border-rose-800/60",
  SD: "bg-red-200/90 text-red-900 border-y border-red-400/60 dark:bg-red-950/85 dark:text-red-100 dark:border-red-800/70",
  TSD: "bg-[#7a1f1c]/95 text-white border-y border-[#a52a2a]/40 dark:bg-[#5a1818]/95 dark:text-red-50 dark:border-red-900/60",
};

export interface ClassificationBannerProps {
  classification: Classification;
  /** Position : `top` (par défaut, sticky en haut) ou `inline`. */
  position?: "top" | "inline";
  children?: ReactNode;
}

export function ClassificationBanner({
  classification,
  position = "top",
  children,
}: ClassificationBannerProps) {
  return (
    <div
      role="status"
      aria-label={`Classification : ${CLASS_LABEL[classification]}`}
      className={
        (position === "top"
          ? "sticky top-0 z-50 w-full "
          : "inline-block ") +
        "px-3 py-1 text-center text-xs font-bold tracking-widest uppercase " +
        CLASS_COLOR[classification]
      }
    >
      ▲ {CLASS_LABEL[classification]} ▲
      {children}
    </div>
  );
}

/**
 * Wrapper qui empêche la sélection / copie sur du contenu sensible.
 * Combine avec `ClassificationBanner` autour de chaque vue de dossier.
 */
export function NoCopyArea({ children }: { children: ReactNode }) {
  return (
    <div
      className="select-none"
      style={
        {
          userSelect: "none",
          WebkitUserSelect: "none",
          MozUserSelect: "none",
          msUserSelect: "none",
        } as React.CSSProperties
      }
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
    </div>
  );
}
