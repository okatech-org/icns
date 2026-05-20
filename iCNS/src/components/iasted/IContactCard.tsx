// Fiche compacte d'un contact iAsted.

import { Star, Phone, Mail, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { useToggleFavori, useCreateAppel, useCurrentMatricule } from "@/hooks/useIAsted";
import { cn } from "@/lib/utils";
import type { Id } from "@convex/_generated/dataModel";

interface IContactCardProps {
    matricule: string;
    serviceId?: Id<"services">;
    role?: string;
    favori?: boolean;
    onClick?: () => void;
}

export function IContactCard({ matricule, serviceId, role, favori, onClick }: IContactCardProps) {
    const owner = useCurrentMatricule();
    const toggleFavori = useToggleFavori();
    const createAppel = useCreateAppel();

    async function handleToggleFavori(e: React.MouseEvent) {
        e.stopPropagation();
        if (!owner) return;
        try {
            await toggleFavori({
                ownerMatricule: owner,
                contactMatricule: matricule,
            });
            toast.success(favori ? "Retiré des favoris" : "Ajouté aux favoris");
        } catch (err) {
            toast.error("Erreur", {
                description: err instanceof Error ? err.message : String(err),
            });
        }
    }

    async function handleCall(e: React.MouseEvent) {
        e.stopPropagation();
        if (!owner) return;
        try {
            await createAppel({
                initiateurMatricule: owner,
                destinataireMatricule: matricule,
                direction: "sortant",
                statut: "repondu",
                sujet: "Appel via iContact",
            });
            toast.success("Appel enregistré dans iAppel");
        } catch (err) {
            toast.error("Erreur", {
                description: err instanceof Error ? err.message : String(err),
            });
        }
    }

    return (
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
            <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-full bg-muted shrink-0">
                    <User className="h-5 w-5 text-muted-foreground" />
                </div>

                <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm font-medium truncate">{matricule}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                        {role && <Badge variant="secondary" className="text-[10px]">{role}</Badge>}
                        {serviceId && (
                            <span className="font-mono truncate">{String(serviceId).slice(0, 8)}…</span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={handleCall}
                        title="Appeler"
                    >
                        <Phone className="h-4 w-4" />
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={handleToggleFavori}
                        title={favori ? "Retirer des favoris" : "Ajouter aux favoris"}
                    >
                        <Star
                            className={cn(
                                "h-4 w-4",
                                favori ? "fill-amber-400 text-amber-500" : "text-muted-foreground",
                            )}
                        />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

export default IContactCard;
