// Badge de statut iDocument

import { Badge } from "@/components/ui/badge";
import type { IDocStatus } from "@/types/idocument";

const VARIANTS: Record<IDocStatus, { label: string; className: string }> = {
    draft: { label: "Brouillon", className: "bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-200" },
    published: { label: "Publie", className: "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-950 dark:text-green-200" },
    archived: { label: "Archive", className: "bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-200" },
    trashed: { label: "Corbeille", className: "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-950 dark:text-red-200" },
};

export function StatusBadge({ status }: { status: IDocStatus }) {
    const cfg = VARIANTS[status];
    return <Badge variant="secondary" className={cfg.className}>{cfg.label}</Badge>;
}
