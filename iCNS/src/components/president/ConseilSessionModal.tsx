import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Clock, MapPin, FileText, Plus, Trash2, CheckCircle, Users } from "lucide-react";

interface ConseilSessionModalProps {
    isOpen: boolean;
    onClose: () => void;
    sessionId: string | null;
}

export function ConseilSessionModal({ isOpen, onClose, sessionId }: ConseilSessionModalProps) {
    const { toast } = useToast();
    const [session, setSession] = useState<any>(null);
    const [agendaItems, setAgendaItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [newItem, setNewItem] = useState("");
    const [newItemMinistry, setNewItemMinistry] = useState("");

    useEffect(() => {
        if (isOpen && sessionId) {
            loadSessionData();
        } else {
            setSession(null);
            setAgendaItems([]);
        }
    }, [isOpen, sessionId]);

    const loadSessionData = async () => {
        setLoading(true);
        try {
            // Load session details
            const { data: sessionData, error: sessionError } = await supabase
                .from("conseil_ministres_sessions")
                .select("*")
                .eq("id", sessionId)
                .single();

            if (sessionError) throw sessionError;
            setSession(sessionData);

            // Load agenda items
            const { data: agendaData, error: agendaError } = await supabase
                .from("ordre_du_jour")
                .select("*")
                .eq("session_id", sessionId)
                .order("created_at", { ascending: true });

            if (agendaError) throw agendaError;
            setAgendaItems(agendaData || []);

        } catch (error: any) {
            console.error("Error loading session:", error);
            toast({
                title: "Erreur",
                description: "Impossible de charger les détails de la session",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = async () => {
        if (!newItem.trim() || !sessionId) return;

        try {
            const { data, error } = await supabase
                .from("ordre_du_jour")
                .insert({
                    session_id: sessionId,
                    title: newItem,
                    ministry: newItemMinistry || "Présidence",
                    status: "proposed"
                })
                .select()
                .single();

            if (error) throw error;

            setAgendaItems([...agendaItems, data]);
            setNewItem("");
            setNewItemMinistry("");
            toast({
                title: "Point ajouté",
                description: "Le point a été ajouté à l'ordre du jour",
            });
        } catch (error: any) {
            toast({
                title: "Erreur",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    const handleDeleteItem = async (itemId: string) => {
        try {
            const { error } = await supabase
                .from("ordre_du_jour")
                .delete()
                .eq("id", itemId);

            if (error) throw error;

            setAgendaItems(agendaItems.filter(item => item.id !== itemId));
            toast({
                title: "Point supprimé",
                description: "Le point a été retiré de l'ordre du jour",
            });
        } catch (error: any) {
            toast({
                title: "Erreur",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    if (!session && !loading) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-xl">Conseil des Ministres</DialogTitle>
                            <DialogDescription>
                                Détails de la session et ordre du jour
                            </DialogDescription>
                        </div>
                        <Badge variant={
                            session?.status === 'completed' ? 'default' :
                                session?.status === 'scheduled' ? 'secondary' :
                                    'outline'
                        }>
                            {session?.status === 'completed' ? 'Terminé' :
                                session?.status === 'scheduled' ? 'Prévu' :
                                    session?.status}
                        </Badge>
                    </div>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Session Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-muted/30 p-4 rounded-lg border flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-primary" />
                            <div>
                                <div className="text-sm text-muted-foreground">Date</div>
                                <div className="font-semibold">
                                    {session?.date ? new Date(session.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                                </div>
                            </div>
                        </div>
                        <div className="bg-muted/30 p-4 rounded-lg border flex items-center gap-3">
                            <Clock className="w-5 h-5 text-primary" />
                            <div>
                                <div className="text-sm text-muted-foreground">Heure</div>
                                <div className="font-semibold">{session?.time?.slice(0, 5) || '-'}</div>
                            </div>
                        </div>
                        <div className="bg-muted/30 p-4 rounded-lg border flex items-center gap-3">
                            <MapPin className="w-5 h-5 text-primary" />
                            <div>
                                <div className="text-sm text-muted-foreground">Lieu</div>
                                <div className="font-semibold">{session?.location || 'Palais Rénovation'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Agenda Section */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                Ordre du Jour
                            </h3>
                            <Badge variant="outline">{agendaItems.length} points</Badge>
                        </div>

                        <div className="bg-card border rounded-lg overflow-hidden">
                            <div className="p-4 bg-muted/30 border-b grid grid-cols-[1fr,auto] gap-4">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Nouveau point à l'ordre du jour..."
                                        value={newItem}
                                        onChange={(e) => setNewItem(e.target.value)}
                                        className="flex-1"
                                    />
                                    <Input
                                        placeholder="Ministère concerné"
                                        value={newItemMinistry}
                                        onChange={(e) => setNewItemMinistry(e.target.value)}
                                        className="w-48"
                                    />
                                </div>
                                <Button onClick={handleAddItem} disabled={!newItem.trim()}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Ajouter
                                </Button>
                            </div>

                            <ScrollArea className="h-[300px]">
                                {agendaItems.length === 0 ? (
                                    <div className="p-8 text-center text-muted-foreground">
                                        Aucun point inscrit à l'ordre du jour
                                    </div>
                                ) : (
                                    <div className="divide-y">
                                        {agendaItems.map((item) => (
                                            <div key={item.id} className="p-4 flex items-center justify-between hover:bg-muted/20 transition-colors">
                                                <div className="flex items-start gap-3">
                                                    <div className="mt-1">
                                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{item.title}</div>
                                                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                                                            <span className="bg-secondary px-2 py-0.5 rounded text-xs">
                                                                {item.ministry}
                                                            </span>
                                                            {item.presenter && (
                                                                <span className="flex items-center gap-1 text-xs">
                                                                    <Users className="w-3 h-3" />
                                                                    {item.presenter}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-muted-foreground hover:text-destructive"
                                                    onClick={() => handleDeleteItem(item.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Fermer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
