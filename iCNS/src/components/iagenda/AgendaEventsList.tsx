// Liste chronologique des événements iAgenda (à venir + passés).

import { useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CalendarSearch } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAgendaAggregated } from "@/hooks/useIAgenda";
import { AgendaEventCard } from "@/components/iagenda/AgendaEventCard";
import { AGENDA_TYPE_LABELS, type AgendaEventType } from "@/types/iagenda";

interface AgendaEventsListProps {
    onItemClick?: (id: string, source: string) => void;
}

type RangeFilter = "upcoming_30" | "upcoming_90" | "past_30" | "past_90" | "all";
type SourceFilter = "all" | "evenement" | "reunion" | "dossier_flash";

const RANGE_OPTIONS: Record<RangeFilter, { label: string; daysFuture: number; daysPast: number }> = {
    upcoming_30: { label: "30 prochains jours", daysFuture: 30, daysPast: 0 },
    upcoming_90: { label: "90 prochains jours", daysFuture: 90, daysPast: 0 },
    past_30: { label: "30 derniers jours", daysFuture: 0, daysPast: 30 },
    past_90: { label: "90 derniers jours", daysFuture: 0, daysPast: 90 },
    all: { label: "30 j passés + 90 j à venir", daysFuture: 90, daysPast: 30 },
};

export function AgendaEventsList({ onItemClick }: AgendaEventsListProps) {
    const [range, setRange] = useState<RangeFilter>("upcoming_30");
    const [source, setSource] = useState<SourceFilter>("all");
    const [type, setType] = useState<AgendaEventType | "all">("all");

    const { fromMs, toMs } = useMemo(() => {
        const cfg = RANGE_OPTIONS[range];
        const now = Date.now();
        const day = 24 * 60 * 60 * 1000;
        return {
            fromMs: now - cfg.daysPast * day,
            toMs: now + cfg.daysFuture * day,
        };
    }, [range]);

    const items = useAgendaAggregated(fromMs, toMs);

    const filtered = useMemo(() => {
        if (!items) return null;
        return items.filter((i) => {
            if (source !== "all" && i.source !== source) return false;
            if (type !== "all" && i.source === "evenement" && i.type !== type) return false;
            return true;
        });
    }, [items, source, type]);

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
                <Select value={range} onValueChange={(v) => setRange(v as RangeFilter)}>
                    <SelectTrigger className="w-[220px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {(Object.keys(RANGE_OPTIONS) as RangeFilter[]).map((k) => (
                            <SelectItem key={k} value={k}>
                                {RANGE_OPTIONS[k].label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={source} onValueChange={(v) => setSource(v as SourceFilter)}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Toutes sources</SelectItem>
                        <SelectItem value="evenement">Événements</SelectItem>
                        <SelectItem value="reunion">Réunions iAsted</SelectItem>
                        <SelectItem value="dossier_flash">Dossiers flash</SelectItem>
                    </SelectContent>
                </Select>

                {source === "evenement" && (
                    <Select value={type} onValueChange={(v) => setType(v as AgendaEventType | "all")}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tous types</SelectItem>
                            {(Object.keys(AGENDA_TYPE_LABELS) as AgendaEventType[]).map((t) => (
                                <SelectItem key={t} value={t}>
                                    {AGENDA_TYPE_LABELS[t]}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </div>

            <Card>
                <CardContent className="p-4">
                    {filtered === null ? (
                        <div className="flex items-center justify-center py-8 text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            Chargement…
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <CalendarSearch className="h-10 w-10 mb-2 opacity-50" />
                            <p className="text-sm">Aucun événement pour cette plage.</p>
                        </div>
                    ) : (
                        <ScrollArea className="max-h-[70vh]">
                            <div className="space-y-3 pr-3">
                                {filtered.map((item) => (
                                    <AgendaEventCard
                                        key={item._id}
                                        item={item}
                                        onClick={() => onItemClick?.(item._id, item.source)}
                                    />
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default AgendaEventsList;
