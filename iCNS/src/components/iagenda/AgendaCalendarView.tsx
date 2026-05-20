// Vue calendrier iAgenda : mini-calendrier + événements du jour sélectionné.

import { useMemo, useState } from "react";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { useAgendaAggregated } from "@/hooks/useIAgenda";
import { AgendaEventCard } from "@/components/iagenda/AgendaEventCard";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface AgendaCalendarViewProps {
    onItemClick?: (id: string, source: string) => void;
}

export function AgendaCalendarView({ onItemClick }: AgendaCalendarViewProps) {
    const [selected, setSelected] = useState<Date>(new Date());

    // Fenêtre = jour sélectionné (00:00 → 23:59) + 30 jours suivants pour la liste
    const { fromMs, toMs, dayStartMs, dayEndMs } = useMemo(() => {
        const dayStart = new Date(selected);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(selected);
        dayEnd.setHours(23, 59, 59, 999);
        const monthStart = new Date(selected);
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        const monthEnd = new Date(selected);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        monthEnd.setDate(0);
        monthEnd.setHours(23, 59, 59, 999);

        return {
            fromMs: monthStart.getTime(),
            toMs: monthEnd.getTime(),
            dayStartMs: dayStart.getTime(),
            dayEndMs: dayEnd.getTime(),
        };
    }, [selected]);

    const aggregated = useAgendaAggregated(fromMs, toMs);

    const itemsOfDay = useMemo(() => {
        if (!aggregated) return [];
        return aggregated.filter((i) => i.startsAt >= dayStartMs && i.startsAt <= dayEndMs);
    }, [aggregated, dayStartMs, dayEndMs]);

    // Dates ayant au moins un événement (pour marquer dans le calendrier)
    const datesWithEvents = useMemo(() => {
        if (!aggregated) return new Set<string>();
        return new Set(
            aggregated.map((i) => {
                const d = new Date(i.startsAt);
                return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
            }),
        );
    }, [aggregated]);

    const hasEvent = (date: Date) =>
        datesWithEvents.has(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Calendrier</CardTitle>
                </CardHeader>
                <CardContent>
                    <CalendarUI
                        mode="single"
                        selected={selected}
                        onSelect={(d) => d && setSelected(d)}
                        locale={fr}
                        modifiers={{ hasEvent }}
                        modifiersClassNames={{
                            hasEvent: "relative font-bold after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-1 after:w-1 after:rounded-full after:bg-primary",
                        }}
                        className="rounded-md"
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">
                        {format(selected, "EEEE d MMMM yyyy", { locale: fr })}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {aggregated === undefined ? (
                        <div className="flex items-center justify-center py-8 text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            Chargement…
                        </div>
                    ) : itemsOfDay.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                            Aucun événement ce jour.
                        </p>
                    ) : (
                        <ScrollArea className="max-h-[60vh]">
                            <div className="space-y-3 pr-3">
                                {itemsOfDay.map((item) => (
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

export default AgendaCalendarView;
