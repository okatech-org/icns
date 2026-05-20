// Section iAsted complète — surface inline avec 4 onglets :
// iChat, iAppel, iContact, iRéunion. Utilisée dans chaque espace utilisateur.

import { useState } from "react";
import { Bot, MessageSquare, Phone, Users, Video } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { IAstedChatPanel } from "@/components/iasted/IAstedChatPanel";
import { IAppelJournal } from "@/components/iasted/IAppelJournal";
import { IContactAnnuaire } from "@/components/iasted/IContactAnnuaire";
import { IReunionList } from "@/components/iasted/IReunionList";

interface IAstedSectionProps {
    showHeader?: boolean;
    defaultTab?: "ichat" | "iappel" | "icontact" | "ireunion";
}

export function IAstedSection({ showHeader = false, defaultTab = "ichat" }: IAstedSectionProps) {
    const [tab, setTab] = useState<string>(defaultTab);

    return (
        <div className="space-y-6">
            {showHeader && (
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10">
                        <Bot className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">Assistant iAsted</h2>
                        <p className="text-sm text-muted-foreground">
                            Conversation, appels, contacts et réunions — agent intelligent iCNS
                        </p>
                    </div>
                </div>
            )}

            <Tabs value={tab} onValueChange={setTab}>
                <TabsList>
                    <TabsTrigger value="ichat">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        iChat
                    </TabsTrigger>
                    <TabsTrigger value="iappel">
                        <Phone className="h-4 w-4 mr-2" />
                        iAppel
                    </TabsTrigger>
                    <TabsTrigger value="icontact">
                        <Users className="h-4 w-4 mr-2" />
                        iContact
                    </TabsTrigger>
                    <TabsTrigger value="ireunion">
                        <Video className="h-4 w-4 mr-2" />
                        iRéunion
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="ichat" className="mt-4">
                    <IAstedChatPanel />
                </TabsContent>

                <TabsContent value="iappel" className="mt-4">
                    <IAppelJournal />
                </TabsContent>

                <TabsContent value="icontact" className="mt-4">
                    <IContactAnnuaire />
                </TabsContent>

                <TabsContent value="ireunion" className="mt-4">
                    <IReunionList />
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default IAstedSection;
