import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, MessageSquare, Globe, Youtube, AlertTriangle, CheckCircle, Clock, Eye, ExternalLink, Copy, Check } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from "@/hooks/use-toast";

interface IntelligenceItem {
    id: string;
    content: string;
    summary: string | null;
    category: 'securite' | 'economie' | 'social' | 'politique' | 'rumeur' | 'autre' | null;
    sentiment: 'positif' | 'negatif' | 'neutre' | 'colere' | 'peur' | 'joie' | null;
    entities: any;
    author: string | null;
    published_at: string;
    source_id: string | null;
}

export const IntelligenceFeed = () => {
    const [items, setItems] = useState<IntelligenceItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [selectedItem, setSelectedItem] = useState<IntelligenceItem | null>(null);
    const [copied, setCopied] = useState(false);
    const { toast } = useToast();

    const fetchItems = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('intelligence_items')
                .select('*')
                .order('published_at', { ascending: false })
                .limit(100);

            if (filter !== 'all') {
                query = query.eq('category', filter);
            }

            const { data, error } = await query;

            if (error) throw error;
            setItems(data as any || []);
        } catch (error) {
            console.error('Error fetching intelligence:', error);
            toast({
                title: "Erreur de chargement",
                description: "Impossible de récupérer les données",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();

        // Realtime subscription
        const channel = supabase
            .channel('intelligence_feed')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'intelligence_items' }, (payload) => {
                console.log('New intelligence item:', payload);
                setItems(prev => [payload.new as any, ...prev]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [filter]);

    const getSourceIcon = (author: string | null) => {
        if (!author) return <Globe className="h-4 w-4 text-gray-400" />;
        if (author.includes('whatsapp')) return <MessageSquare className="h-4 w-4 text-green-500" />;
        if (author.includes('youtube')) return <Youtube className="h-4 w-4 text-red-500" />;
        return <Globe className="h-4 w-4 text-blue-500" />;
    };

    const getSentimentColor = (sentiment: string | null) => {
        if (!sentiment) return 'bg-gray-100 text-gray-800 border-gray-200';
        switch (sentiment) {
            case 'negatif':
            case 'colere':
            case 'peur': return 'bg-red-100 text-red-800 border-red-200';
            case 'positif':
            case 'joie': return 'bg-green-100 text-green-800 border-green-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getCategoryBadge = (category: string | null) => {
        if (!category) return <Badge variant="outline">Non classé</Badge>;
        const colors: Record<string, string> = {
            securite: 'bg-red-500',
            economie: 'bg-blue-500',
            social: 'bg-yellow-500',
            politique: 'bg-purple-500',
            rumeur: 'bg-orange-500',
            autre: 'bg-gray-500'
        };
        return <Badge className={`${colors[category] || 'bg-gray-500'} hover:${colors[category]}`}>{category.toUpperCase()}</Badge>;
    };

    const handleCopyContent = async (content: string) => {
        try {
            await navigator.clipboard.writeText(content);
            setCopied(true);
            toast({ title: "Copié", description: "Le contenu a été copié dans le presse-papiers" });
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            toast({ title: "Erreur", description: "Impossible de copier le contenu", variant: "destructive" });
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Flux en Temps Réel</h3>
                <div className="flex gap-2">
                    {['all', 'securite', 'politique', 'social', 'rumeur'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1 text-xs rounded-full border ${filter === f ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}
                        >
                            {f === 'all' ? 'Tout' : f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <ScrollArea className="h-[600px] pr-4">
                {loading ? (
                    <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                ) : items.length === 0 ? (
                    <div className="text-center p-8 text-muted-foreground">Aucune donnée capturée pour le moment.</div>
                ) : (
                    <div className="space-y-4">
                        {items.map((item) => (
                            <Card key={item.id} className="overflow-hidden transition-all hover:shadow-md border-l-4" style={{ borderLeftColor: item.sentiment === 'negatif' ? '#ef4444' : item.sentiment === 'positif' ? '#22c55e' : '#e5e7eb' }}>
                                <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
                                    <div className="flex items-center gap-2">
                                        {getSourceIcon(item.author)}
                                        <span className="text-xs font-mono text-muted-foreground">
                                            {item.author || 'Source inconnue'}
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        {getCategoryBadge(item.category)}
                                        <Badge variant="outline" className={getSentimentColor(item.sentiment)}>
                                            {item.sentiment || 'neutre'}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 pt-2">
                                    <p className="text-sm font-medium mb-1">
                                        {item.summary || "En attente d'analyse..."}
                                    </p>
                                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                        {item.content}
                                    </p>
                                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {formatDistanceToNow(new Date(item.published_at), { addSuffix: true, locale: fr })}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={() => setSelectedItem(item)}
                                                className="h-6 px-2"
                                            >
                                                <Eye className="h-3 w-3 mr-1" />
                                                Détails
                                            </Button>
                                            {item.summary ? (
                                                <CheckCircle className="h-3 w-3 text-green-500" />
                                            ) : (
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </ScrollArea>

            <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {selectedItem && getSourceIcon(selectedItem.author)}
                            Détails de l'Intelligence
                        </DialogTitle>
                        <DialogDescription>
                            {selectedItem && formatDistanceToNow(new Date(selectedItem.published_at), { addSuffix: true, locale: fr })}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedItem && (
                        <div className="space-y-4">
                            <div className="flex gap-2 flex-wrap">
                                {getCategoryBadge(selectedItem.category)}
                                <Badge variant="outline" className={getSentimentColor(selectedItem.sentiment)}>
                                    {selectedItem.sentiment || 'neutre'}
                                </Badge>
                                <Badge variant="secondary">
                                    {selectedItem.author || 'Source inconnue'}
                                </Badge>
                            </div>
                            
                            {selectedItem.summary && (
                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium">Résumé IA</h3>
                                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                                        {selectedItem.summary}
                                    </p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-medium">Contenu complet</h3>
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleCopyContent(selectedItem.content)}
                                    >
                                        {copied ? (
                                            <><Check className="h-4 w-4 mr-2" /> Copié</>
                                        ) : (
                                            <><Copy className="h-4 w-4 mr-2" /> Copier</>
                                        )}
                                    </Button>
                                </div>
                                <div className="text-sm bg-muted p-4 rounded-lg whitespace-pre-wrap">
                                    {selectedItem.content}
                                </div>
                            </div>

                            {selectedItem.entities && Array.isArray(selectedItem.entities) && selectedItem.entities.length > 0 && (
                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium">Entités détectées</h3>
                                    <div className="flex gap-2 flex-wrap">
                                        {selectedItem.entities.map((entity: string, idx: number) => (
                                            <Badge key={idx} variant="outline">
                                                {entity}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 border-t">
                                <dl className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <dt className="text-muted-foreground">Date de publication</dt>
                                        <dd className="font-medium">
                                            {new Date(selectedItem.published_at).toLocaleString('fr-FR')}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-muted-foreground">ID</dt>
                                        <dd className="font-mono text-xs">{selectedItem.id}</dd>
                                    </div>
                                </dl>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};
