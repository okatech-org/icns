// Section iArchive utilisable inline dans un espace utilisateur (sans header).

import { useState } from "react";
import { Plus, Archive, Vault, AlertTriangle, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArchiveList } from "@/components/iarchive/ArchiveList";
import { ArchiveUploadDialog } from "@/components/iarchive/ArchiveUploadDialog";
import { useArchiveCategories, useArchiveStats } from "@/hooks/useIArchive";

interface IArchiveSectionProps {
    /** Affiche un en-tête + bouton interne. */
    showHeader?: boolean;
}

export function IArchiveSection({ showHeader = false }: IArchiveSectionProps) {
    const [uploadOpen, setUploadOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<string>("all");

    const { data: categories } = useArchiveCategories();
    const { data: stats } = useArchiveStats();

    return (
        <div className="space-y-6">
            {showHeader ? (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary/10">
                            <Archive className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">iArchive</h2>
                            <p className="text-sm text-muted-foreground">
                                Archivage executif avec retention OHADA
                            </p>
                        </div>
                    </div>
                    <Button onClick={() => setUploadOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nouvelle archive
                    </Button>
                </div>
            ) : (
                <div className="flex justify-end">
                    <Button onClick={() => setUploadOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nouvelle archive
                    </Button>
                </div>
            )}

            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard icon={<Archive className="h-5 w-5" />} label="Total" value={stats.total} />
                    <StatCard icon={<FileCheck className="h-5 w-5 text-green-600" />} label="Actives" value={stats.active} />
                    <StatCard icon={<AlertTriangle className="h-5 w-5 text-amber-600" />} label="Expirent (90j)" value={stats.expiring_soon} />
                    <StatCard icon={<Vault className="h-5 w-5" />} label="Coffre-fort" value={stats.vault} />
                </div>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="flex-wrap h-auto">
                    <TabsTrigger value="all">Toutes</TabsTrigger>
                    <TabsTrigger value="vault">
                        <Vault className="h-3.5 w-3.5 mr-1.5" />
                        Coffre-fort
                    </TabsTrigger>
                    {(categories ?? [])
                        .filter((c) => !c.is_perpetual)
                        .map((c) => (
                            <TabsTrigger key={c.id} value={c.slug}>
                                {c.name}
                            </TabsTrigger>
                        ))}
                </TabsList>

                <TabsContent value="all" className="mt-4">
                    <ArchiveList />
                </TabsContent>

                <TabsContent value="vault" className="mt-4">
                    <ArchiveList isVault />
                </TabsContent>

                {(categories ?? []).map((c) => (
                    <TabsContent key={c.id} value={c.slug} className="mt-4">
                        <ArchiveList categorySlug={c.slug} />
                    </TabsContent>
                ))}
            </Tabs>

            <ArchiveUploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />
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

export default IArchiveSection;
