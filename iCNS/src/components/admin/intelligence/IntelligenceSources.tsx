import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, RefreshCw, Smartphone, Globe, Youtube, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Source {
    id: string;
    name: string;
    type: 'whatsapp_group' | 'web_search' | 'youtube_channel' | 'rss_feed';
    url: string;
    status: 'active' | 'paused' | 'error';
    last_crawled_at: string | null;
    created_at: string;
    updated_at: string;
}

interface FormErrors {
    name?: string;
    url?: string;
}

export const IntelligenceSources = () => {
    const [sources, setSources] = useState<Source[]>([]);
    const [loading, setLoading] = useState(true);
    const [addLoading, setAddLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
    const [refreshLoading, setRefreshLoading] = useState<string | null>(null);
    const [newSource, setNewSource] = useState<{ name: string; type: string; url: string }>({ 
        name: '', 
        type: 'web_search', 
        url: '' 
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchSources = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('intelligence_sources')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            setSources((data || []) as Source[]);
        } catch (error) {
            console.error('Error fetching sources:', error);
            toast({
                title: "Erreur de chargement",
                description: "Impossible de récupérer les sources",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSources();

        // Realtime subscription
        const channel = supabase
            .channel('intelligence_sources_changes')
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'intelligence_sources' 
            }, () => {
                fetchSources();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const validateSource = (): boolean => {
        const newErrors: FormErrors = {};

        if (!newSource.name.trim()) {
            newErrors.name = "Le nom est requis";
        } else if (newSource.name.length < 3) {
            newErrors.name = "Le nom doit contenir au moins 3 caractères";
        } else if (newSource.name.length > 100) {
            newErrors.name = "Le nom ne peut pas dépasser 100 caractères";
        }

        if (!newSource.url.trim()) {
            newErrors.url = "L'URL ou l'identifiant est requis";
        } else if (newSource.type === 'rss_feed' || newSource.type === 'web_search') {
            // Validate URL format for RSS feeds
            if (newSource.type === 'rss_feed') {
                try {
                    new URL(newSource.url);
                } catch {
                    newErrors.url = "Format d'URL invalide pour un flux RSS";
                }
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleAddSource = async () => {
        if (!validateSource()) return;

        setAddLoading(true);
        setErrors({});

        try {
            const { error } = await supabase
                .from('intelligence_sources')
                .insert([{
                    name: newSource.name.trim(),
                    type: newSource.type,
                    url: newSource.url.trim(),
                    status: 'active'
                }] as any);

            if (error) throw error;

            toast({ 
                title: "Source ajoutée", 
                description: `"${newSource.name}" est maintenant surveillée` 
            });
            setNewSource({ name: '', type: 'web_search', url: '' });
            fetchSources();
        } catch (error: any) {
            console.error('Error adding source:', error);
            toast({ 
                title: "Erreur", 
                description: error.message || "Impossible d'ajouter la source", 
                variant: "destructive" 
            });
        } finally {
            setAddLoading(false);
        }
    };

    const handleToggleStatus = async (id: string, currentStatus: string) => {
        setRefreshLoading(id);
        try {
            const newStatus = currentStatus === 'active' ? 'paused' : 'active';
            const { error } = await supabase
                .from('intelligence_sources')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;

            toast({ 
                title: newStatus === 'active' ? "Source activée" : "Source mise en pause",
                description: `La surveillance est maintenant ${newStatus === 'active' ? 'active' : 'en pause'}`
            });
            fetchSources();
        } catch (error: any) {
            console.error('Error toggling status:', error);
            toast({ 
                title: "Erreur", 
                description: "Impossible de modifier le statut", 
                variant: "destructive" 
            });
        } finally {
            setRefreshLoading(null);
        }
    };

    const handleDeleteSource = async (id: string) => {
        setDeleteLoading(id);
        try {
            const { error } = await supabase
                .from('intelligence_sources')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast({ 
                title: "Source supprimée", 
                description: "La source a été retirée du système" 
            });
            setDeleteConfirm(null);
            fetchSources();
        } catch (error: any) {
            console.error('Error deleting source:', error);
            toast({ 
                title: "Erreur", 
                description: "Impossible de supprimer la source", 
                variant: "destructive" 
            });
        } finally {
            setDeleteLoading(null);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'whatsapp_group': return <Smartphone className="h-4 w-4 text-green-500" />;
            case 'youtube_channel': return <Youtube className="h-4 w-4 text-red-500" />;
            case 'rss_feed': return <RefreshCw className="h-4 w-4 text-orange-500" />;
            default: return <Globe className="h-4 w-4 text-blue-500" />;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active': 
                return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Actif</Badge>;
            case 'paused': 
                return <Badge variant="secondary">En pause</Badge>;
            case 'error': 
                return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Erreur</Badge>;
            default: 
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Ajouter une Source</CardTitle>
                    <CardDescription>Configurez de nouveaux points d'écoute pour le système.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Nom de la source *</label>
                                <Input
                                    placeholder="Ex: Gabon Politique"
                                    value={newSource.name}
                                    onChange={(e) => {
                                        setNewSource({ ...newSource, name: e.target.value });
                                        if (errors.name) setErrors({ ...errors, name: undefined });
                                    }}
                                    className={errors.name ? "border-red-500" : ""}
                                    disabled={addLoading}
                                />
                                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Type de source *</label>
                                <Select
                                    value={newSource.type}
                                    onValueChange={(v: any) => setNewSource({ ...newSource, type: v })}
                                    disabled={addLoading}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="web_search">🔍 Recherche Web (Mot-clé)</SelectItem>
                                        <SelectItem value="rss_feed">📰 Flux RSS</SelectItem>
                                        <SelectItem value="whatsapp_group">💬 Groupe WhatsApp</SelectItem>
                                        <SelectItem value="youtube_channel">📹 Chaîne YouTube</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">URL ou Identifiant *</label>
                                <Input
                                    placeholder={
                                        newSource.type === 'rss_feed' ? "https://example.com/feed" :
                                        newSource.type === 'web_search' ? "Gabon Économie" :
                                        "ID ou nom de la cible"
                                    }
                                    value={newSource.url}
                                    onChange={(e) => {
                                        setNewSource({ ...newSource, url: e.target.value });
                                        if (errors.url) setErrors({ ...errors, url: undefined });
                                    }}
                                    className={errors.url ? "border-red-500" : ""}
                                    disabled={addLoading}
                                />
                                {errors.url && <p className="text-xs text-red-500">{errors.url}</p>}
                            </div>
                        </div>
                        <Button 
                            onClick={handleAddSource} 
                            disabled={addLoading || !newSource.name || !newSource.url}
                            className="w-full md:w-auto"
                        >
                            {addLoading ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Ajout en cours...</>
                            ) : (
                                <><Plus className="mr-2 h-4 w-4" /> Ajouter la source</>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Sources Actives</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[60px]">Type</TableHead>
                                        <TableHead>Nom</TableHead>
                                        <TableHead>Cible</TableHead>
                                        <TableHead>Statut</TableHead>
                                        <TableHead>Dernière collecte</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sources.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                                                <div className="flex flex-col items-center gap-2">
                                                    <AlertCircle className="h-12 w-12 text-muted-foreground/50" />
                                                    <p className="font-medium">Aucune source configurée</p>
                                                    <p className="text-sm">Ajoutez votre première source pour commencer la collecte</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        sources.map((source) => (
                                            <TableRow key={source.id}>
                                                <TableCell>{getIcon(source.type)}</TableCell>
                                                <TableCell className="font-medium">{source.name}</TableCell>
                                                <TableCell className="text-muted-foreground text-sm max-w-[300px] truncate" title={source.url}>
                                                    {source.url}
                                                </TableCell>
                                                <TableCell>{getStatusBadge(source.status)}</TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {source.last_crawled_at 
                                                        ? formatDistanceToNow(new Date(source.last_crawled_at), { addSuffix: true, locale: fr })
                                                        : 'Jamais'
                                                    }
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon"
                                                            onClick={() => handleToggleStatus(source.id, source.status)}
                                                            disabled={refreshLoading === source.id}
                                                            title={source.status === 'active' ? 'Mettre en pause' : 'Activer'}
                                                        >
                                                            {refreshLoading === source.id ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <RefreshCw className={`h-4 w-4 ${source.status === 'active' ? 'text-green-500' : 'text-gray-400'}`} />
                                                            )}
                                                        </Button>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            onClick={() => setDeleteConfirm(source.id)}
                                                            disabled={deleteLoading === source.id}
                                                            title="Supprimer"
                                                        >
                                                            {deleteLoading === source.id ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <Trash2 className="h-4 w-4 text-red-500 hover:text-red-600" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
            <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                        <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer cette source ? Cette action est irréversible.
                            Les données déjà collectées seront conservées.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={!!deleteLoading}>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteConfirm && handleDeleteSource(deleteConfirm)}
                            disabled={!!deleteLoading}
                            className="bg-red-500 hover:bg-red-600"
                        >
                            {deleteLoading ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Suppression...</>
                            ) : (
                                'Supprimer'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
