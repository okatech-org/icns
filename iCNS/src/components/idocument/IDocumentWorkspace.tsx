// Workspace combiné iDocument — 3 sub-tabs :
//   • Dossiers de renseignement → vue par cellule contributrice CNS
//   • Documents → coffre documentaire vault (multi-comptes, classifications)
//   • iArchive → archivage post-clôture
//
// Source unique : `iDocVaultStore` (Zustand local) — un dossier par cellule
// du Conseil National de Sécurité (B2, DGDI, DGR, DGSS, GR, GN, FAGT, FAGA,
// FAGM, POL, SILAM, DGSP, DOUANE). Les agents CNS centraux voient les 13,
// les agents de cellule ne voient que leur dossier.

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FileText, Archive, FolderLock } from "lucide-react";
import { IDocumentSection } from "@/components/idocument/IDocumentSection";
import { IArchiveSection } from "@/components/iarchive/IArchiveSection";
import { CellulesDossiersSection } from "@/components/dossiers/CellulesDossiersSection";
import { useICNSAuth } from "@/auth/useICNSAuth";

interface IDocumentWorkspaceProps {
    /** Onglet initial. */
    defaultTab?: "dossiers" | "documents" | "archive";
}

export function IDocumentWorkspace({ defaultTab = "dossiers" }: IDocumentWorkspaceProps) {
    const [tab, setTab] = useState<string>(defaultTab);
    const isAuthenticatedInICNS = useICNSAuth((s) => s.isAuthenticated);

    return (
        <Tabs value={tab} onValueChange={setTab} className="space-y-4">
            <TabsList>
                <TabsTrigger value="dossiers">
                    <FolderLock className="h-4 w-4 mr-2" />
                    Dossiers de renseignement
                </TabsTrigger>
                <TabsTrigger value="documents">
                    <FileText className="h-4 w-4 mr-2" />
                    Documents
                </TabsTrigger>
                <TabsTrigger value="archive">
                    <Archive className="h-4 w-4 mr-2" />
                    iArchive
                </TabsTrigger>
            </TabsList>

            <TabsContent value="dossiers" className="mt-4">
                {!isAuthenticatedInICNS ? (
                    <div className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
                        <FolderLock className="h-8 w-8 mx-auto mb-3 opacity-40" />
                        <p>
                            Les dossiers de renseignement nécessitent une authentification iCNS
                            (carte agent + PIN + biométrie).
                        </p>
                        <p className="mt-2">
                            Connectez-vous via{" "}
                            <a href="/icns/login" className="text-primary underline">
                                /icns/login
                            </a>{" "}
                            pour accéder à cette section.
                        </p>
                    </div>
                ) : (
                    <CellulesDossiersSection />
                )}
            </TabsContent>

            <TabsContent value="documents" className="mt-4">
                <IDocumentSection />
            </TabsContent>

            <TabsContent value="archive" className="mt-4">
                <IArchiveSection />
            </TabsContent>
        </Tabs>
    );
}

export default IDocumentWorkspace;
