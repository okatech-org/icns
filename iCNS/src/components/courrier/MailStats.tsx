import { MailStats as MailStatsType } from "@/types/service-courriers-types";
import { FileText, AlertTriangle, CheckCircle, Inbox } from "lucide-react";

interface MailStatsProps {
    stats: MailStatsType;
}

export const MailStats = ({ stats }: MailStatsProps) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="neu-card p-6 flex items-center gap-4">
                <div className="neu-raised w-12 h-12 rounded-xl flex items-center justify-center text-blue-500">
                    <Inbox className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">Reçus aujourd'hui</p>
                    <h3 className="text-2xl font-bold">{stats.totalToday}</h3>
                </div>
            </div>

            <div className="neu-card p-6 flex items-center gap-4">
                <div className="neu-raised w-12 h-12 rounded-xl flex items-center justify-center text-red-500">
                    <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">Urgents en attente</p>
                    <h3 className="text-2xl font-bold">{stats.urgentPending}</h3>
                </div>
            </div>

            <div className="neu-card p-6 flex items-center gap-4">
                <div className="neu-raised w-12 h-12 rounded-xl flex items-center justify-center text-orange-500">
                    <FileText className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">À traiter</p>
                    <h3 className="text-2xl font-bold">{stats.toProcess}</h3>
                </div>
            </div>

            <div className="neu-card p-6 flex items-center gap-4">
                <div className="neu-raised w-12 h-12 rounded-xl flex items-center justify-center text-green-500">
                    <CheckCircle className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">Traités ce jour</p>
                    <h3 className="text-2xl font-bold">{stats.processedToday}</h3>
                </div>
            </div>
        </div>
    );
};
