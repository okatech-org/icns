// Badge affichant l etat du cycle de vie d une archive

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Clock, AlertTriangle, ShieldCheck, Vault, XCircle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { IArchArchive, IArchStatus } from "@/types/iarchive";

const STATUS_LABEL: Record<IArchStatus, string> = {
    active: "Actif",
    semi_active: "Semi-actif",
    archived: "Archive",
    expired: "Expire",
    destroyed: "Detruit",
};

const STATUS_CLASSES: Record<IArchStatus, string> = {
    active: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
    semi_active: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
    archived: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
    expired: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
    destroyed: "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

interface RetentionBadgeProps {
    archive: Pick<IArchArchive, "status" | "retention_expires_at" | "is_vault" | "legal_hold_applied_at">;
}

export function RetentionBadge({ archive }: RetentionBadgeProps) {
    if (archive.is_vault) {
        return (
            <Badge variant="secondary" className="bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
                <Vault className="h-3 w-3 mr-1" />
                Coffre-fort
            </Badge>
        );
    }

    if (archive.legal_hold_applied_at) {
        return (
            <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200">
                <ShieldCheck className="h-3 w-3 mr-1" />
                Sous scelle
            </Badge>
        );
    }

    const isExpiringSoon =
        archive.retention_expires_at &&
        new Date(archive.retention_expires_at).getTime() - Date.now() < 90 * 24 * 60 * 60 * 1000;

    const Icon =
        archive.status === "destroyed"
            ? XCircle
            : isExpiringSoon
            ? AlertTriangle
            : Clock;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Badge variant="secondary" className={STATUS_CLASSES[archive.status]}>
                        <Icon className="h-3 w-3 mr-1" />
                        {STATUS_LABEL[archive.status]}
                        {isExpiringSoon && archive.status !== "destroyed" && (
                            <span className="ml-1 text-[10px]">expire bientot</span>
                        )}
                    </Badge>
                </TooltipTrigger>
                {archive.retention_expires_at && (
                    <TooltipContent>
                        <p className="text-xs">
                            Expiration : {format(new Date(archive.retention_expires_at), "d MMMM yyyy", { locale: fr })}
                        </p>
                    </TooltipContent>
                )}
            </Tooltip>
        </TooltipProvider>
    );
}
