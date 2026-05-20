// Panel iChat — vue d'entrée pour la conversation iAsted.
//
// Réutilise le modal global (IAstedChatModal) et l'instance WebRTC via
// SuperAdminContext. Ce panel ne dupplique pas la logique de chat — il
// offre simplement un accès en plein écran et un résumé.

import { useMemo } from "react";
import { Bot, Mic, MicOff, MessageSquare, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSuperAdmin } from "@/contexts/SuperAdminContext";

export function IAstedChatPanel() {
    const {
        openaiRTC,
        selectedVoice,
        setIsChatOpen,
    } = useSuperAdmin();

    const voiceState: string = openaiRTC?.voiceState ?? "idle";
    const isConnected: boolean = openaiRTC?.isConnected ?? false;

    const stateLabel = useMemo(() => {
        switch (voiceState) {
            case "listening":
                return "À l'écoute…";
            case "speaking":
                return "Parle…";
            case "thinking":
                return "Réfléchit…";
            case "connecting":
                return "Connexion en cours…";
            default:
                return isConnected ? "Connecté" : "Déconnecté";
        }
    }, [voiceState, isConnected]);

    return (
        <div className="space-y-4">
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-primary/10 shrink-0">
                            <Bot className="h-8 w-8 text-primary" />
                        </div>
                        <div className="flex-1 space-y-3">
                            <div>
                                <h3 className="text-lg font-semibold">Assistant iAsted</h3>
                                <p className="text-sm text-muted-foreground">
                                    Conversation vocale et textuelle avec l'assistant intelligent iCNS.
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-sm">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted">
                                    {voiceState === "connecting" || voiceState === "thinking" ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : isConnected ? (
                                        <Mic className="h-3.5 w-3.5 text-green-600" />
                                    ) : (
                                        <MicOff className="h-3.5 w-3.5 text-muted-foreground" />
                                    )}
                                    {stateLabel}
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    Voix : {selectedVoice ?? "ash"}
                                </span>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-2">
                                <Button
                                    onClick={() => setIsChatOpen(true)}
                                    className="gap-2"
                                >
                                    <MessageSquare className="h-4 w-4" />
                                    Ouvrir la conversation
                                </Button>
                                <p className="text-xs text-muted-foreground self-center pl-2">
                                    Le bouton flottant iAsted reste également accessible partout.
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-6 space-y-3">
                    <h4 className="text-sm font-semibold">Capacités iAsted</h4>
                    <ul className="text-sm space-y-1.5 text-muted-foreground">
                        <li>• Recherche transverse dans iDocument, iCorrespondance et iArchive</li>
                        <li>• Génération de documents officiels (lettres, notes, décrets) en français</li>
                        <li>• Navigation contextuelle dans l'espace utilisateur</li>
                        <li>• Synthèse vocale et reconnaissance vocale temps réel (WebRTC)</li>
                        <li>• Coordination avec iAppel, iContact et iRéunion (onglets adjacents)</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}

export default IAstedChatPanel;
