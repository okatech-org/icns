// Page standalone iArchive : wrapper autour de IArchiveSection.

import { Archive } from "lucide-react";
import { IArchiveSection } from "@/components/iarchive/IArchiveSection";

export default function IArchivePage() {
    return (
        <div className="min-h-screen bg-background">
            <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-20">
                <div className="container mx-auto px-6 py-4 flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10">
                        <Archive className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">iArchive</h1>
                        <p className="text-sm text-muted-foreground">
                            Archivage executif avec retention OHADA
                        </p>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-6 py-6">
                <IArchiveSection />
            </div>
        </div>
    );
}
