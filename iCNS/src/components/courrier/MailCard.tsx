import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IncomingMail } from "@/types/service-courriers-types";
import { FileText, Clock, AlertCircle, CheckCircle2, Archive, ArrowRight } from "lucide-react";

interface MailCardProps {
    mail: IncomingMail;
    onView: (mail: IncomingMail) => void;
}

export const MailCard = ({ mail, onView }: MailCardProps) => {
    const getUrgencyColor = (urgency: string) => {
        switch (urgency) {
            case 'urgente': return 'text-red-600 bg-red-100 border-red-200';
            case 'haute': return 'text-orange-600 bg-orange-100 border-orange-200';
            case 'normale': return 'text-blue-600 bg-blue-100 border-blue-200';
            default: return 'text-gray-600 bg-gray-100 border-gray-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'recu': return <Clock className="h-4 w-4 text-blue-500" />;
            case 'en_traitement': return <AlertCircle className="h-4 w-4 text-orange-500" />;
            case 'distribue': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
            case 'archive': return <Archive className="h-4 w-4 text-gray-500" />;
            default: return <FileText className="h-4 w-4" />;
        }
    };

    return (
        <div className="neu-card p-6 hover:translate-y-[-2px] transition-all duration-300 group">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="neu-raised w-10 h-10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-lg line-clamp-1">{mail.subject}</h4>
                        <p className="text-sm text-muted-foreground">{mail.sender}</p>
                    </div>
                </div>
                <Badge variant="outline" className={`${getUrgencyColor(mail.urgency)} capitalize`}>
                    {mail.urgency}
                </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border/50">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-mono text-xs bg-accent/10 px-2 py-1 rounded">
                        #{mail.reference_number}
                    </span>
                </div>
                <div className="flex items-center justify-end gap-2 text-sm">
                    {getStatusIcon(mail.status)}
                    <span className="capitalize">{mail.status.replace('_', ' ')}</span>
                </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                    Reçu le {new Date(mail.received_date).toLocaleDateString('fr-FR')}
                </div>
                <Button
                    size="sm"
                    variant="ghost"
                    className="hover:bg-primary/10 hover:text-primary"
                    onClick={() => onView(mail)}
                >
                    Voir détails
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};
