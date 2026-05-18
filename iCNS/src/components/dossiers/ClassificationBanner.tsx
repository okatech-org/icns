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

const CLASS_COLOR: Record<Classification, string> = {
  DR: "bg-amber-500 text-black",
  CD: "bg-orange-600 text-white",
  SD: "bg-red-700 text-white",
  TSD: "bg-fuchsia-900 text-white border-2 border-amber-300",
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
