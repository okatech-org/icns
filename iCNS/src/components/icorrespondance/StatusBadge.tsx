// Badge de statut iCorrespondance

import { Badge } from "@/components/ui/badge";
import type { ICorrStatus } from "@/types/icorrespondance";

const VARIANTS: Record<ICorrStatus, { label: string; className: string }> = {
    DRAFT: { label: "Brouillon", className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
    PENDING_APPROVAL: { label: "En attente", className: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200" },
    APPROVED: { label: "Approuve", className: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200" },
    REJECTED: { label: "Rejete", className: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200" },
    READY_FOR_DELIVERY: { label: "Pret a remettre", className: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200" },
    DELIVERED: { label: "Remis", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200" },
    SENT: { label: "Envoye", className: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200" },
    ARCHIVED: { label: "Archive", className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
};

export function StatusBadge({ status }: { status: ICorrStatus }) {
    const cfg = VARIANTS[status];
    return <Badge variant="secondary" className={cfg.className}>{cfg.label}</Badge>;
}
