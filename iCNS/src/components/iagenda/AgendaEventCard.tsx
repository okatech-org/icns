// Carte d'événement iAgenda — affichage compact.

import { Calendar, Clock, MapPin, Users, FileWarning, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { AggregatedAgendaItem } from "@/types/iagenda";
import { AGENDA_TYPE_COLORS, AGENDA_TYPE_LABELS, type AgendaEventType } from "@/types/iagenda";
import { cn } from "@/lib/utils";

interface AgendaEventCardProps {
    item: AggregatedAgendaItem;
    onClick?: () => void;
}

const SOURCE_ICONS = {
    evenement: Calendar,
    reunion: Video,
    dossier_flash: FileWarning,
} as const;

const SOURCE_LABELS = {
    evenement: "Événement",
    reunion: "Réunion iAsted",
    dossier_flash: "Dossier flash",
} as const;

export function AgendaEventCard({ item, onClick }: AgendaEventCardProps) {
    const SourceIcon = SOURCE_ICONS[item.source];
    const startDate = new Date(item.startsAt);
    const endDate = item.endsAt ? new Date(item.endsAt) : null;

    const typeColor =
        item.source === "evenement" && item.type
            ? AGENDA_TYPE_COLORS[item.type as AgendaEventType]
            : "bg-muted text-foreground";

    const typeLabel =
        item.source === "evenement" && item.type
            ? AGENDA_TYPE_LABELS[item.type as AgendaEventType]
            : SOURCE_LABELS[item.source];

    return (
        <Card
            className={cn(
                "transition-all hover:shadow-md cursor-pointer",
                item.source === "dossier_flash" && "border-red-500/50 bg-red-500/5",
            )}
            onClick={onClick}
        >
            <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        <SourceIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
                        <h3 className="font-semibold text-sm truncate">{item.titre}</h3>
                    </div>
                    <Badge variant="outline" className={cn("shrink-0 text-xs", typeColor)}>
                        {typeLabel}
                    </Badge>
                </div>

                <div className="space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{format(startDate, "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}</span>
                        {endDate && (
                            <span> — {format(endDate, "HH:mm", { locale: fr })}</span>
                        )}
                    </div>

                    {item.lieu && (
                        <div className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" />
                            <span className="truncate">{item.lieu}</span>
                        </div>
                    )}

                    {item.reference && (
                        <div className="flex items-center gap-1.5 font-mono">
                            <Users className="h-3.5 w-3.5" />
                            <span>{item.reference}</span>
                        </div>
                    )}
                </div>

                {item.classification && (
                    <Badge variant="secondary" className="text-xs uppercase tracking-wide">
                        {item.classification}
                    </Badge>
                )}
            </CardContent>
        </Card>
    );
}

export default AgendaEventCard;
