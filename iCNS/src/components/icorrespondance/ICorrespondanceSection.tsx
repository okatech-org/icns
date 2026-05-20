// Section iCorrespondance utilisable inline dans un espace utilisateur (sans header).

import { useState } from "react";
import { Plus, Mail, AlertCircle, Clock, CheckCircle, Send, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CorrespondanceList } from "@/components/icorrespondance/CorrespondanceList";
import { CorrespondanceComposer } from "@/components/icorrespondance/CorrespondanceComposer";
import { useICorrStats } from "@/hooks/useICorrespondance";

interface ICorrespondanceSectionProps {
    /** Affiche un en-tête + bouton interne. */
    showHeader?: boolean;
}

export function ICorrespondanceSection({ showHeader = false }: ICorrespondanceSectionProps) {
    const [composerOpen, setComposerOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<string>("all");

    const { data: stats } = useICorrStats();

    return (
        <div className="space-y-6">
            {showHeader ? (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary/10">
                            <Mail className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">iCorrespondance</h2>
                            <p className="text-sm text-muted-foreground">
                                Courriers officiels avec workflow d approbation
                            </p>
                        </div>
                    </div>
                    <Button onClick={() => setComposerOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nouvelle correspondance
                    </Button>
                </div>
            ) : (
                <div className="flex justify-end">
                    <Button onClick={() => setComposerOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nouvelle correspondance
                    </Button>
                </div>
            )}

            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <StatCard icon={<Inbox className="h-5 w-5" />} label="Total" value={stats.total} />
                    <StatCard icon={<Clock className="h-5 w-5 text-amber-600" />} label="En attente" value={stats.pending_approval} />
                    <StatCard icon={<CheckCircle className="h-5 w-5 text-green-600" />} label="Approuves" value={stats.approved} />
                    <StatCard icon={<Send className="h-5 w-5 text-blue-600" />} label="Envoyes" value={stats.sent} />
                    <StatCard icon={<AlertCircle className="h-5 w-5 text-red-600" />} label="Urgents" value={stats.urgent} />
                </div>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="all">Tous</TabsTrigger>
                    <TabsTrigger value="urgent">
                        <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
                        Urgents
                    </TabsTrigger>
                    <TabsTrigger value="DRAFT">Brouillons</TabsTrigger>
                    <TabsTrigger value="PENDING_APPROVAL">A approuver</TabsTrigger>
                    <TabsTrigger value="APPROVED">Approuves</TabsTrigger>
                    <TabsTrigger value="DELIVERED">Remis</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-4">
                    <CorrespondanceList />
                </TabsContent>
                <TabsContent value="urgent" className="mt-4">
                    <CorrespondanceList urgentOnly />
                </TabsContent>
                <TabsContent value="DRAFT" className="mt-4">
                    <CorrespondanceList statusFilter="DRAFT" />
                </TabsContent>
                <TabsContent value="PENDING_APPROVAL" className="mt-4">
                    <CorrespondanceList statusFilter="PENDING_APPROVAL" />
                </TabsContent>
                <TabsContent value="APPROVED" className="mt-4">
                    <CorrespondanceList statusFilter="APPROVED" />
                </TabsContent>
                <TabsContent value="DELIVERED" className="mt-4">
                    <CorrespondanceList statusFilter="DELIVERED" />
                </TabsContent>
            </Tabs>

            <CorrespondanceComposer open={composerOpen} onOpenChange={setComposerOpen} />
        </div>
    );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
    return (
        <Card>
            <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted shrink-0 text-muted-foreground">{icon}</div>
                <div>
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                </div>
            </CardContent>
        </Card>
    );
}

export default ICorrespondanceSection;
