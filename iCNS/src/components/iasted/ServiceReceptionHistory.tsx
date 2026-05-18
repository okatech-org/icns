import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Printer, Eye, Search, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Mail {
    id: string;
    tracking_number: string;
    created_at: string;
    status: string;
    mail_ai_analysis: {
        sender_name?: string;
        sender_organization?: string;
        confidentiality_level?: string;
        summary?: string;
    }[];
}

export default function ServiceReceptionHistory() {
    const [searchTerm, setSearchTerm] = React.useState('');

    const { data: mails, isLoading } = useQuery({
        queryKey: ['reception-mails'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('mails')
                .select(`
                    *,
                    mail_ai_analysis (
                        sender_name,
                        sender_organization,
                        confidentiality_level,
                        summary
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as unknown as Mail[];
        }
    });

    const filteredMails = mails?.filter(mail => {
        const searchLower = searchTerm.toLowerCase();
        const analysis = mail.mail_ai_analysis?.[0] || {};
        return (
            mail.tracking_number?.toLowerCase().includes(searchLower) ||
            analysis.sender_name?.toLowerCase().includes(searchLower) ||
            analysis.sender_organization?.toLowerCase().includes(searchLower)
        );
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'scanning':
                return <Badge variant="secondary">Numérisation</Badge>;
            case 'analyzing':
                return <Badge variant="outline" className="text-blue-500 border-blue-500">Analyse IA</Badge>;
            case 'pending_validation':
                return <Badge variant="default" className="bg-orange-500 hover:bg-orange-600">À Valider</Badge>;
            case 'validated':
                return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Validé</Badge>;
            case 'distributed':
                return <Badge variant="default" className="bg-purple-500 hover:bg-purple-600">Distribué</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getConfidentialityBadge = (level: string) => {
        switch (level) {
            case 'public':
                return <Badge variant="outline" className="text-green-600 border-green-600">Public</Badge>;
            case 'restricted':
                return <Badge variant="outline" className="text-orange-600 border-orange-600">Restreint</Badge>;
            case 'secret':
                return <Badge variant="outline" className="text-red-600 border-red-600">Secret</Badge>;
            case 'top_secret':
                return <Badge variant="destructive">TRÈS SECRET</Badge>;
            default:
                return <span className="text-muted-foreground">-</span>;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="relative w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher un pli..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                </div>
                <div className="text-sm text-muted-foreground">
                    {filteredMails?.length || 0} plis trouvés
                </div>
            </div>

            <div className="neu-card overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>N° Suivi</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Expéditeur</TableHead>
                            <TableHead>Organisation</TableHead>
                            <TableHead>Confidentialité</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredMails?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    <div className="flex flex-col items-center gap-2">
                                        <FileText className="w-8 h-8 opacity-20" />
                                        <p>Aucun courrier trouvé</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredMails?.map((mail) => {
                                const analysis = mail.mail_ai_analysis?.[0] || {};
                                return (
                                    <TableRow key={mail.id} className="hover:bg-muted/50">
                                        <TableCell className="font-mono font-medium">
                                            {mail.tracking_number || '...'}
                                        </TableCell>
                                        <TableCell>
                                            {format(new Date(mail.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {analysis.sender_name || 'Non identifié'}
                                        </TableCell>
                                        <TableCell>
                                            {analysis.sender_organization || '-'}
                                        </TableCell>
                                        <TableCell>
                                            {getConfidentialityBadge(analysis.confidentiality_level)}
                                        </TableCell>
                                        <TableCell>
                                            {getStatusBadge(mail.status)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" title="Voir détails">
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" title="Imprimer Récépissé">
                                                    <Printer className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
