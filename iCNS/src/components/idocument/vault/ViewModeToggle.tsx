// Bouton à 3 états — grille / liste / colonnes — utilisé en haut du Vault.

import { Columns3, LayoutGrid, List } from "lucide-react";

export type VaultViewMode = "grid" | "list" | "columns";

interface ViewModeToggleProps {
  value: VaultViewMode;
  onChange: (mode: VaultViewMode) => void;
  className?: string;
}

const MODES: Array<{
  key: VaultViewMode;
  label: string;
  Icon: typeof LayoutGrid;
}> = [
  { key: "grid", label: "Grille", Icon: LayoutGrid },
  { key: "list", label: "Liste", Icon: List },
  { key: "columns", label: "Colonnes", Icon: Columns3 },
];

export function ViewModeToggle({ value, onChange, className }: ViewModeToggleProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Mode d'affichage"
      className={`inline-flex items-center rounded-md border border-border bg-background p-0.5 ${className ?? ""}`}
    >
      {MODES.map(({ key, label, Icon }) => {
        const active = value === key;
        return (
          <button
            key={key}
            role="radio"
            aria-checked={active}
            aria-label={label}
            type="button"
            onClick={() => onChange(key)}
            className={
              "flex h-7 w-7 items-center justify-center rounded transition-colors " +
              (active
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-muted")
            }
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}
