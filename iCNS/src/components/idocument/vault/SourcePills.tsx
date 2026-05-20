// Filtre source de document : pills cliquables (correspondance / upload /
// inbound-email / scan + « toutes »).

import { FileScan, FileUp, Inbox, Mail } from "lucide-react";
import type { VaultDocumentSource } from "@/types/idocument";

export type SourceFilter = "all" | VaultDocumentSource;

const PILLS: Array<{
  key: SourceFilter;
  label: string;
  Icon: typeof Inbox;
}> = [
  { key: "all", label: "Toutes sources", Icon: Inbox },
  { key: "correspondance", label: "Courrier", Icon: Mail },
  { key: "upload", label: "Upload", Icon: FileUp },
  { key: "inbound-email", label: "Email", Icon: Mail },
  { key: "scan", label: "Scan", Icon: FileScan },
];

interface SourcePillsProps {
  value: SourceFilter;
  onChange: (v: SourceFilter) => void;
  className?: string;
}

export function SourcePills({ value, onChange, className }: SourcePillsProps) {
  return (
    <div
      role="tablist"
      aria-label="Filtrer par source"
      className={`flex flex-wrap items-center gap-1 ${className ?? ""}`}
    >
      {PILLS.map(({ key, label, Icon }) => {
        const active = value === key;
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(key)}
            className={
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors " +
              (active
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border bg-background text-muted-foreground hover:bg-muted")
            }
          >
            <Icon className="h-3 w-3" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
