// Popup unifie iAsted — 5 onglets : iChat, iAppel, iContact, iReunion, Reglages.
// Remplace IAstedChatModal dans le contexte iCNS Workspace.

import { useState } from "react";
import {
    X,
    Brain,
    MessageSquare,
    Phone,
    Users,
    Video,
    Settings as SettingsIcon,
    Mic,
    Volume2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { IAstedChatPanel } from "@/components/iasted/IAstedChatPanel";
import { IAppelJournal } from "@/components/iasted/IAppelJournal";
import { IContactAnnuaire } from "@/components/iasted/IContactAnnuaire";
import { IReunionList } from "@/components/iasted/IReunionList";
import { useSuperAdmin } from "@/contexts/SuperAdminContext";
import { cn } from "@/lib/utils";

interface IAstedPopupProps {
    isOpen: boolean;
    onClose: () => void;
    defaultTab?: "ichat" | "iappel" | "icontact" | "ireunion" | "reglages";
}

type TabId = "ichat" | "iappel" | "icontact" | "ireunion" | "reglages";

const TAB_META: Record<TabId, { label: string; icon: typeof MessageSquare }> = {
    ichat: { label: "iChat", icon: MessageSquare },
    iappel: { label: "iAppel", icon: Phone },
    icontact: { label: "iContact", icon: Users },
    ireunion: { label: "iRéunion", icon: Video },
    reglages: { label: "Réglages", icon: SettingsIcon },
};

export function IAstedPopup({
    isOpen,
    onClose,
    defaultTab = "ichat",
}: IAstedPopupProps) {
    const [tab, setTab] = useState<TabId>(defaultTab);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ y: 40, opacity: 0, scale: 0.97 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: 40, opacity: 0, scale: 0.97 }}
                    transition={{ type: "spring", damping: 22, stiffness: 260 }}
                    className="dash-v2 w-full max-w-3xl h-[88vh] sm:h-[80vh] bg-background border border-border rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="v2-icon-box">
                                <Brain className="h-5 w-5 text-primary" />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-base font-semibold leading-tight truncate">
                                    Assistant iAsted
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                    Agent intelligent iCNS · {TAB_META[tab].label}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            aria-label="Fermer"
                            className="shrink-0"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Tabs */}
                    <Tabs
                        value={tab}
                        onValueChange={(v) => setTab(v as TabId)}
                        className="flex-1 flex flex-col min-h-0"
                    >
                        <div className="border-b border-border px-2 py-2 bg-card">
                            <TabsList className="w-full grid grid-cols-5 h-auto p-1">
                                {(Object.keys(TAB_META) as TabId[]).map((k) => {
                                    const Icon = TAB_META[k].icon;
                                    return (
                                        <TabsTrigger
                                            key={k}
                                            value={k}
                                            className={cn(
                                                "flex flex-col sm:flex-row gap-1 sm:gap-2 items-center py-2 px-1 sm:px-3 text-xs",
                                            )}
                                        >
                                            <Icon className="h-4 w-4 shrink-0" />
                                            <span className="hidden sm:inline">
                                                {TAB_META[k].label}
                                            </span>
                                        </TabsTrigger>
                                    );
                                })}
                            </TabsList>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">
                            <TabsContent value="ichat" className="mt-0">
                                <IAstedChatPanel />
                            </TabsContent>
                            <TabsContent value="iappel" className="mt-0">
                                <IAppelJournal />
                            </TabsContent>
                            <TabsContent value="icontact" className="mt-0">
                                <IContactAnnuaire />
                            </TabsContent>
                            <TabsContent value="ireunion" className="mt-0">
                                <IReunionList />
                            </TabsContent>
                            <TabsContent value="reglages" className="mt-0">
                                <ReglagesPanel />
                            </TabsContent>
                        </div>
                    </Tabs>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

// ─── Panneau Reglages ─────────────────────────────────────────────────

function ReglagesPanel() {
    const { openaiRTC, selectedVoice } = useSuperAdmin();

    const handleVoiceChange = async (voice: "ash" | "shimmer") => {
        localStorage.setItem("iasted-voice-selection", voice);
        if (openaiRTC.isConnected) {
            await openaiRTC.disconnect();
            await openaiRTC.connect(voice);
        }
        // Triggers re-render via SuperAdminContext
        window.dispatchEvent(new CustomEvent("iasted-voice-changed", { detail: { voice } }));
    };

    const handleResetButton = () => {
        localStorage.removeItem("iasted-button-position");
        window.location.reload();
    };

    return (
        <div className="space-y-4 max-w-2xl mx-auto">
            <Card>
                <CardContent className="p-5 space-y-4">
                    <div className="flex items-center gap-2">
                        <Mic className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-semibold">Voix de l'assistant</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        La voix utilisée lors de la connexion WebRTC pour les réponses
                        synthétisées d'iAsted.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            variant={selectedVoice === "ash" ? "default" : "outline"}
                            onClick={() => handleVoiceChange("ash")}
                            className="justify-start"
                        >
                            <Volume2 className="h-4 w-4 mr-2" />
                            Homme (Ash)
                        </Button>
                        <Button
                            variant={selectedVoice === "shimmer" ? "default" : "outline"}
                            onClick={() => handleVoiceChange("shimmer")}
                            className="justify-start"
                        >
                            <Volume2 className="h-4 w-4 mr-2" />
                            Femme (Shimmer)
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-5 space-y-3">
                    <div className="flex items-center gap-2">
                        <SettingsIcon className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-semibold">Bouton flottant</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Le bouton sphérique iAsted est repositionnable par glisser-déposer.
                        Sa position est sauvegardée localement.
                    </p>
                    <Button variant="outline" onClick={handleResetButton} size="sm">
                        Réinitialiser la position (bas-droite)
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-5 space-y-3">
                    <Label className="text-sm font-semibold">État de la connexion vocale</Label>
                    <div className="flex items-center gap-2 text-sm">
                        <div
                            className={cn(
                                "h-2 w-2 rounded-full",
                                openaiRTC.isConnected ? "bg-emerald-500" : "bg-muted-foreground/50",
                            )}
                        />
                        <span className="text-muted-foreground">
                            {openaiRTC.isConnected ? "Connecté" : "Déconnecté"}
                        </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                        État : {openaiRTC.voiceState ?? "idle"} · Voix actuelle :{" "}
                        <span className="font-mono">{selectedVoice}</span>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

export default IAstedPopup;
