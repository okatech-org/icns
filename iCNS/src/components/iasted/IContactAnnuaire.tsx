// Annuaire iContact : recherche, filtre par service, favoris.

import { useState } from "react";
import { Search, Star, Users, Loader2, UserSearch } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { useAnnuaire, useFavoris } from "@/hooks/useIAsted";
import { IContactCard } from "@/components/iasted/IContactCard";

export function IContactAnnuaire() {
    const [search, setSearch] = useState("");
    const [tab, setTab] = useState<"annuaire" | "favoris">("annuaire");

    const annuaire = useAnnuaire(search.trim() || undefined);
    const favoris = useFavoris();

    return (
        <div className="space-y-4">
            <Tabs value={tab} onValueChange={(v) => setTab(v as "annuaire" | "favoris")}>
                <TabsList>
                    <TabsTrigger value="annuaire">
                        <Users className="h-4 w-4 mr-2" />
                        Annuaire complet
                    </TabsTrigger>
                    <TabsTrigger value="favoris">
                        <Star className="h-4 w-4 mr-2" />
                        Favoris
                        {favoris && favoris.length > 0 && (
                            <span className="ml-2 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px]">
                                {favoris.length}
                            </span>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="annuaire" className="mt-4 space-y-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher par matricule…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    <Card>
                        <CardContent className="p-3">
                            {annuaire === undefined ? (
                                <div className="flex items-center justify-center py-8 text-muted-foreground">
                                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                    Chargement de l'annuaire…
                                </div>
                            ) : annuaire.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                    <UserSearch className="h-10 w-10 mb-2 opacity-50" />
                                    <p className="text-sm">Aucun utilisateur trouvé.</p>
                                </div>
                            ) : (
                                <ScrollArea className="max-h-[60vh]">
                                    <div className="space-y-2 pr-3">
                                        {annuaire.map((u) => (
                                            <IContactCard
                                                key={u._id}
                                                matricule={u.matricule}
                                                serviceId={u.serviceId}
                                                role={u.role}
                                            />
                                        ))}
                                    </div>
                                </ScrollArea>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="favoris" className="mt-4">
                    <Card>
                        <CardContent className="p-3">
                            {favoris === undefined ? (
                                <div className="flex items-center justify-center py-8 text-muted-foreground">
                                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                    Chargement…
                                </div>
                            ) : favoris.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                    <Star className="h-10 w-10 mb-2 opacity-50" />
                                    <p className="text-sm">Aucun contact favori pour le moment.</p>
                                </div>
                            ) : (
                                <ScrollArea className="max-h-[60vh]">
                                    <div className="space-y-2 pr-3">
                                        {favoris.map((c) => (
                                            <IContactCard
                                                key={c._id}
                                                matricule={c.contactMatricule}
                                                serviceId={c.serviceId}
                                                role={c.role}
                                                favori
                                            />
                                        ))}
                                    </div>
                                </ScrollArea>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default IContactAnnuaire;
