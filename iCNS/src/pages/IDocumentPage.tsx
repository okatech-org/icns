// Page standalone iDocument : wrapper autour de IDocumentSection.

import { FileText } from "lucide-react";
import { IDocumentSection } from "@/components/idocument/IDocumentSection";

export default function IDocumentPage() {
    return (
        <div className="min-h-screen bg-background">
            <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-20">
                <div className="container mx-auto px-6 py-4 flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10">
                        <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">iDocument</h1>
                        <p className="text-sm text-muted-foreground">
                            Gestion electronique des documents executifs
                        </p>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-6 py-6">
                <IDocumentSection />
            </div>
        </div>
    );
}
