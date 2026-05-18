import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ShieldAlert, RefreshCw, Search, Filter } from 'lucide-react';

interface AuditLog {
    id: string;
    user_id: string;
    action: string;
    resource: string;
    details: any;
    ip_address: string;
    created_at: string;
}

export const AuditLogSection = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const { data, error } = await (supabase as any)
                .from('audit_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) throw error;
            setLogs(data as any[]);
        } catch (error: any) {
            console.error('Error fetching logs:', error);
            toast({
                title: "Erreur",
                description: "Impossible de charger les logs d'audit",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const getActionBadge = (action: string) => {
        if (action.includes('DELETE')) return <Badge variant="destructive">{action}</Badge>;
        if (action.includes('UPDATE')) return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">{action}</Badge>;
        if (action.includes('CREATE')) return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">{action}</Badge>;
        return <Badge variant="outline">{action}</Badge>;
    };

    const filteredLogs = logs.filter(log =>
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Logs d'Audit</h2>
                    <p className="text-muted-foreground">
                        Traçabilité des actions sensibles sur la plateforme.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Filtrer les logs..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8 w-[250px]"
                        />
                    </div>
                    <Button variant="outline" size="icon" onClick={fetchLogs}>
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>Utilisateur (ID)</TableHead>
                                <TableHead>Ressource</TableHead>
                                <TableHead>IP</TableHead>
                                <TableHead>Détails</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredLogs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        Aucun log trouvé.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredLogs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                            {new Date(log.created_at).toLocaleString()}
                                        </TableCell>
                                        <TableCell>{getActionBadge(log.action)}</TableCell>
                                        <TableCell className="font-mono text-xs">{log.user_id?.substring(0, 8)}...</TableCell>
                                        <TableCell className="text-sm">{log.resource}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{log.ip_address || '-'}</TableCell>
                                        <TableCell className="text-xs max-w-[200px] truncate" title={JSON.stringify(log.details, null, 2)}>
                                            {JSON.stringify(log.details)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};
