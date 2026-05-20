// Section iAgenda : calendrier + liste d'événements agrégés.
// Utilisée inline dans chaque espace utilisateur.

import { useState } from "react";
import { Plus, Calendar, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AgendaCalendarView } from "@/components/iagenda/AgendaCalendarView";
import { AgendaEventsList } from "@/components/iagenda/AgendaEventsList";
import { AgendaEventCreateDialog } from "@/components/iagenda/AgendaEventCreateDialog";

interface IAgendaSectionProps {
    showHeader?: boolean;
}

export function IAgendaSection({ showHeader = false }: IAgendaSectionProps) {
    const [createOpen, setCreateOpen] = useState(false);
    const [tab, setTab] = useState<string>("calendar");

    return (
        <div className="space-y-6">
            {showHeader ? (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary/10">
                            <Calendar className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">iAgenda</h2>
                            <p className="text-sm text-muted-foreground">
                                Agenda officiel iCNS — séances, audiences, réunions
                            </p>
                        </div>
                    </div>
                    <Button onClick={() => setCreateOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nouvel événement
                    </Button>
                </div>
            ) : (
                <div className="flex justify-end">
                    <Button onClick={() => setCreateOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nouvel événement
                    </Button>
                </div>
            )}

            <Tabs value={tab} onValueChange={setTab}>
                <TabsList>
                    <TabsTrigger value="calendar">
                        <Calendar className="h-4 w-4 mr-2" />
                        Calendrier
                    </TabsTrigger>
                    <TabsTrigger value="list">
                        <List className="h-4 w-4 mr-2" />
                        Liste
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="calendar" className="mt-4">
                    <AgendaCalendarView />
                </TabsContent>

                <TabsContent value="list" className="mt-4">
                    <AgendaEventsList />
                </TabsContent>
            </Tabs>

            <AgendaEventCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
        </div>
    );
}

export default IAgendaSection;
