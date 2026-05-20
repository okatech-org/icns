// Journal d'appels iAsted — liste filtrable + stats + détail.

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
    Phone,
    PhoneIncoming,
    PhoneOutgoing,
    PhoneMissed,
    Plus,
    Loader2,
    Clock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
    useAppelsList,
    useAppelsStats,
    useCreateAppel,
    formatAppelDuration,
    APPEL_STATUT_LABELS,
    useCurrentMatricule,
} from "@/hooks/useIAsted";
import { IAppelDetailSheet } from "@/components/iasted/IAppelDetailSheet";
import { toast } from "sonner";
import type { Id } from "@convex/_generated/dataModel";

type FilterTab = "all" | "incoming" | "outgoing" | "missed";

export function IAppelJournal() {
    const matricule = useCurrentMatricule();
    const appels = useAppelsList(200);
    const stats = useAppelsStats();
    const createAppel = useCreateAppel();
    const [filter, setFilter] = useState<FilterTab>("all");
    const [selectedId, setSelectedId] = useState<Id<"iasted_appels"> | null>(null);

    const filtered = useMemo(() => {
        if (!appels) return null;
        const m = matricule;
        return appels.filter((a) => {
            if (filter === "all") return true;
            if (filter === "missed") return a.statut === "manque";
            if (filter === "incoming") return a.direction === "entrant" || a.destinataireMatricule === m;
            if (filter === "outgoing") return a.direction === "sortant" || a.initiateurMatricule === m;
            return true;
        });
    }, [appels, filter, matricule]);

    async function handleDemoCall() {
        if (!matricule) {
            toast.error("Utilisateur non identifié.");
            return;
        }
        try {
            await createAppel({
                initiateurMatricule: matricule,
                destinataireMatricule: matricule, // stub : appel à soi-même pour démo
                direction: "sortant",
                statut: "termine",
                sujet: "Appel test",
            });
            toast.success("Appel ajouté au journal.");
        } catch (err) {
            toast.error("Erreur lors de la création", {
                description: err instanceof Error ? err.message : String(err),
            });
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-end">
                <Button variant="outline" onClick={handleDemoCall}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un appel
                </Button>
            </div>

            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatPill icon={<Phone className="h-4 w-4" />} label="Total" value={stats.total} />
                    <StatPill icon={<PhoneIncoming className="h-4 w-4 text-blue-600" />} label="Entrants" value={stats.entrants} />
                    <StatPill icon={<PhoneOutgoing className="h-4 w-4 text-green-600" />} label="Sortants" value={stats.sortants} />
                    <StatPill icon={<PhoneMissed className="h-4 w-4 text-red-600" />} label="Manqués" value={stats.manques} />
                </div>
            )}

            <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterTab)}>
                <TabsList>
                    <TabsTrigger value="all">Tous</TabsTrigger>
                    <TabsTrigger value="incoming">
                        <PhoneIncoming className="h-3.5 w-3.5 mr-1.5" />
                        Entrants
                    </TabsTrigger>
                    <TabsTrigger value="outgoing">
                        <PhoneOutgoing className="h-3.5 w-3.5 mr-1.5" />
                        Sortants
                    </TabsTrigger>
                    <TabsTrigger value="missed">
                        <PhoneMissed className="h-3.5 w-3.5 mr-1.5" />
                        Manqués
                    </TabsTrigger>
                </TabsList>
            </Tabs>

            <Card>
                <CardContent className="p-2">
                    {filtered === null ? (
                        <div className="flex items-center justify-center py-8 text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            Chargement…
                        </div>
                    ) : filtered.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                            Aucun appel.
                        </p>
                    ) : (
                        <ScrollArea className="max-h-[60vh]">
                            <div className="divide-y">
                                {filtered.map((a) => (
                                    <AppelRow
                                        key={a._id}
                                        appel={a}
                                        currentMatricule={matricule}
                                        onClick={() => setSelectedId(a._id)}
                                    />
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </CardContent>
            </Card>

            <IAppelDetailSheet
                appelId={selectedId}
                onOpenChange={(open) => !open && setSelectedId(null)}
            />
        </div>
    );
}

function StatPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
    return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
            {icon}
            <div className="text-xs">
                <p className="text-muted-foreground">{label}</p>
                <p className="font-semibold text-base">{value}</p>
            </div>
        </div>
    );
}

interface AppelRowProps {
    appel: {
        _id: Id<"iasted_appels">;
        initiateurMatricule: string;
        destinataireMatricule: string;
        direction: "entrant" | "sortant";
        statut: "manque" | "repondu" | "en_cours" | "termine";
        dureeSecondes?: number;
        startedAt: number;
        sujet?: string;
    };
    currentMatricule: string | null;
    onClick: () => void;
}

function AppelRow({ appel, currentMatricule, onClick }: AppelRowProps) {
    const isIncoming = appel.destinataireMatricule === currentMatricule;
    const counterparty = isIncoming ? appel.initiateurMatricule : appel.destinataireMatricule;
    const Icon = appel.statut === "manque" ? PhoneMissed : isIncoming ? PhoneIncoming : PhoneOutgoing;
    const iconColor =
        appel.statut === "manque" ? "text-red-600" : isIncoming ? "text-blue-600" : "text-green-600";

    return (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-3 px-3 py-3 hover:bg-muted/50 text-left transition-colors"
        >
            <Icon className={`h-5 w-5 shrink-0 ${iconColor}`} />
            <div className="flex-1 min-w-0">
                <p className="font-mono text-sm truncate">{counterparty}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{format(appel.startedAt, "dd MMM HH:mm", { locale: fr })}</span>
                    {appel.dureeSecondes !== undefined && (
                        <>
                            <span>·</span>
                            <span className="inline-flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatAppelDuration(appel.dureeSecondes)}
                            </span>
                        </>
                    )}
                    {appel.sujet && (
                        <>
                            <span>·</span>
                            <span className="truncate max-w-[200px]">{appel.sujet}</span>
                        </>
                    )}
                </div>
            </div>
            <Badge variant="outline" className="shrink-0 text-xs">
                {APPEL_STATUT_LABELS[appel.statut]}
            </Badge>
        </button>
    );
}

export default IAppelJournal;
