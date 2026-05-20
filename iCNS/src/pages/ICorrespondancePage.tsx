// Page standalone iCorrespondance : wrapper autour de ICorrespondanceSection.

import { Mail } from "lucide-react";
import { ICorrespondanceSection } from "@/components/icorrespondance/ICorrespondanceSection";

export default function ICorrespondancePage() {
    return (
        <div className="min-h-screen bg-background">
            <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-20">
                <div className="container mx-auto px-6 py-4 flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10">
                        <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">iCorrespondance</h1>
                        <p className="text-sm text-muted-foreground">
                            Courriers officiels avec workflow d approbation
                        </p>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-6 py-6">
                <ICorrespondanceSection />
            </div>
        </div>
    );
}
