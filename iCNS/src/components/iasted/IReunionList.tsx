// Liste des réunions iAsted avec filtres + création.

import { useMemo, useState } from "react";
import { format, isFuture } from "date-fns";
import { fr } from "date-fns/locale";
import {
    Plus,
    Calendar,
    Loader2,
    Video,
    Clock,
    Users,
    ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
    useReunionsList,
    REUNION_STATUT_LABELS,
} from "@/hooks/useIAsted";
import { IReunionCreateDialog } from "@/components/iasted/IReunionCreateDialog";
import { IReunionDetailSheet } from "@/components/iasted/IReunionDetailSheet";
import type { Id } from "@convex/_generated/dataModel";
import type { ReunionStatut } from "@/types/iasted";

type FilterTab = "upcoming" | "past" | "all";

export function IReunionList() {
    const reunions = useReunionsList(undefined, 200);
    const [filter, setFilter] = useState<FilterTab>("upcoming");
    const [createOpen, setCreateOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<Id<"iasted_reunions"> | null>(null);

    const filtered = useMemo(() => {
        if (!reunions) return null;
        return reunions.filter((r) => {
            if (filter === "all") return true;
            if (filter === "upcoming") return isFuture(new Date(r.startsAt)) && r.statut !== "annulee";
            if (filter === "past") return !isFuture(new Date(r.startsAt));
            return true;
        });
    }, [reunions, filter]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterTab)}>
                    <TabsList>
                        <TabsTrigger value="upcoming">À venir</TabsTrigger>
                        <TabsTrigger value="past">Passées</TabsTrigger>
                        <TabsTrigger value="all">Toutes</TabsTrigger>
                    </TabsList>
                </Tabs>
                <Button onClick={() => setCreateOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle réunion
                </Button>
            </div>

            <Card>
                <CardContent className="p-2">
                    {filtered === null ? (
                        <div className="flex items-center justify-center py-8 text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            Chargement…
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <Calendar className="h-10 w-10 mb-2 opacity-50" />
                            <p className="text-sm">Aucune réunion.</p>
                        </div>
                    ) : (
                        <ScrollArea className="max-h-[60vh]">
                            <div className="divide-y">
                                {filtered.map((r) => (
                                    <ReunionRow
                                        key={r._id}
                                        reunion={r}
                                        onClick={() => setSelectedId(r._id)}
                                    />
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </CardContent>
            </Card>

            <IReunionCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
            <IReunionDetailSheet
                reunionId={selectedId}
                onOpenChange={(open) => !open && setSelectedId(null)}
            />
        </div>
    );
}

interface ReunionRowProps {
    reunion: {
        _id: Id<"iasted_reunions">;
        reference: string;
        titre: string;
        statut: ReunionStatut;
        classification: string;
        startsAt: number;
        endsAt: number;
        lieu?: string;
        participantsMatricules: string[];
    };
    onClick: () => void;
}

function ReunionRow({ reunion, onClick }: ReunionRowProps) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-3 px-3 py-3 hover:bg-muted/50 text-left transition-colors"
        >
            <Video className="h-5 w-5 shrink-0 text-muted-foreground" />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm truncate">{reunion.titre}</p>
                    <Badge variant="outline" className="text-[10px] uppercase shrink-0">
                        {reunion.classification}
                    </Badge>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{format(reunion.startsAt, "dd MMM yyyy HH:mm", { locale: fr })}</span>
                    <span>·</span>
                    <Users className="h-3 w-3" />
                    <span>{reunion.participantsMatricules.length} participant(s)</span>
                    {reunion.lieu && (
                        <>
                            <span>·</span>
                            <span className="truncate max-w-[200px]">{reunion.lieu}</span>
                        </>
                    )}
                </div>
            </div>
            <Badge variant="secondary" className="shrink-0 text-xs">
                {REUNION_STATUT_LABELS[reunion.statut]}
            </Badge>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </button>
    );
}

export default IReunionList;
