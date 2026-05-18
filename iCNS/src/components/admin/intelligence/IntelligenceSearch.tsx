import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Search, Loader2, Filter, X, Download, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SearchResult {
    id: string;
    content: string;
    summary: string;
    category: string;
    sentiment: string;
    entities: any;
    author: string;
    published_at: string;
    similarity: number;
}

interface SearchFilters {
    category?: string;
    sentiment?: string;
    dateFrom?: string;
    dateTo?: string;
    threshold?: number;
    limit?: number;
}

export const IntelligenceSearch = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState<SearchFilters>({
        threshold: 0.6,
        limit: 10
    });
    const [showFilters, setShowFilters] = useState(false);
    const { toast } = useToast();

    const handleSearch = async () => {
        if (!query.trim()) {
            toast({
                title: "Requête vide",
                description: "Veuillez saisir une question ou un mot-clé",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('search-intelligence', {
                body: { query: query.trim(), filters }
            });

            if (error) throw error;

            setResults(data.results || []);
            
            if (data.results.length === 0) {
                toast({
                    title: "Aucun résultat",
                    description: "Essayez de reformuler votre recherche ou d'ajuster les filtres",
                    variant: "default"
                });
            } else {
                toast({
                    title: "Recherche terminée",
                    description: `${data.results.length} résultat(s) trouvé(s)`
                });
            }
        } catch (error: any) {
            console.error('Search error:', error);
            toast({
                title: "Erreur de recherche",
                description: error.message || "Une erreur est survenue",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSearch();
        }
    };

    const clearFilters = () => {
        setFilters({ threshold: 0.6, limit: 10 });
    };

    const getSentimentColor = (sentiment: string) => {
        switch (sentiment) {
            case 'negatif':
            case 'colere':
            case 'peur': return 'bg-red-100 text-red-800 border-red-200';
            case 'positif':
            case 'joie': return 'bg-green-100 text-green-800 border-green-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getCategoryBadge = (category: string) => {
        const colors: Record<string, string> = {
            securite: 'bg-red-500',
            economie: 'bg-blue-500',
            social: 'bg-yellow-500',
            politique: 'bg-purple-500',
            rumeur: 'bg-orange-500',
            autre: 'bg-gray-500'
        };
        return (
            <Badge className={`${colors[category] || 'bg-gray-500'} hover:${colors[category]}`}>
                {category?.toUpperCase()}
            </Badge>
        );
    };

    const exportResults = () => {
        const csvContent = [
            ['Date', 'Catégorie', 'Sentiment', 'Résumé', 'Similarité'].join(','),
            ...results.map(r => [
                new Date(r.published_at).toLocaleDateString('fr-FR'),
                r.category,
                r.sentiment,
                `"${r.summary?.replace(/"/g, '""')}"`,
                (r.similarity * 100).toFixed(1) + '%'
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `intelligence_search_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Recherche Sémantique Intelligence</CardTitle>
                    <CardDescription>
                        Interrogez la base de connaissances avec du langage naturel
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Ex: Que dit-on sur la sécurité à Libreville ?"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyPress={handleKeyPress}
                                disabled={loading}
                                className="pl-10"
                            />
                        </div>
                        <Button onClick={handleSearch} disabled={loading || !query.trim()}>
                            {loading ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Recherche...</>
                            ) : (
                                <><Search className="mr-2 h-4 w-4" /> Rechercher</>
                            )}
                        </Button>
                        <Button 
                            variant="outline" 
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <Filter className="mr-2 h-4 w-4" />
                            Filtres
                        </Button>
                    </div>

                    {showFilters && (
                        <Card className="bg-muted/50">
                            <CardContent className="pt-6">
                                <div className="grid gap-4 md:grid-cols-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Catégorie</label>
                                        <Select
                                            value={filters.category || 'all'}
                                            onValueChange={(v) => setFilters({ 
                                                ...filters, 
                                                category: v === 'all' ? undefined : v 
                                            })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Toutes" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Toutes</SelectItem>
                                                <SelectItem value="securite">Sécurité</SelectItem>
                                                <SelectItem value="economie">Économie</SelectItem>
                                                <SelectItem value="social">Social</SelectItem>
                                                <SelectItem value="politique">Politique</SelectItem>
                                                <SelectItem value="rumeur">Rumeur</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Sentiment</label>
                                        <Select
                                            value={filters.sentiment || 'all'}
                                            onValueChange={(v) => setFilters({ 
                                                ...filters, 
                                                sentiment: v === 'all' ? undefined : v 
                                            })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Tous" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Tous</SelectItem>
                                                <SelectItem value="positif">Positif</SelectItem>
                                                <SelectItem value="negatif">Négatif</SelectItem>
                                                <SelectItem value="neutre">Neutre</SelectItem>
                                                <SelectItem value="colere">Colère</SelectItem>
                                                <SelectItem value="peur">Peur</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Seuil de pertinence</label>
                                        <Select
                                            value={filters.threshold?.toString() || '0.6'}
                                            onValueChange={(v) => setFilters({ 
                                                ...filters, 
                                                threshold: parseFloat(v) 
                                            })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="0.8">Très pertinent (80%)</SelectItem>
                                                <SelectItem value="0.6">Pertinent (60%)</SelectItem>
                                                <SelectItem value="0.4">Large (40%)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Nombre max</label>
                                        <Select
                                            value={filters.limit?.toString() || '10'}
                                            onValueChange={(v) => setFilters({ 
                                                ...filters, 
                                                limit: parseInt(v) 
                                            })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="5">5 résultats</SelectItem>
                                                <SelectItem value="10">10 résultats</SelectItem>
                                                <SelectItem value="20">20 résultats</SelectItem>
                                                <SelectItem value="50">50 résultats</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={clearFilters}
                                    className="mt-4"
                                >
                                    <X className="mr-2 h-4 w-4" />
                                    Réinitialiser les filtres
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </CardContent>
            </Card>

            {results.length > 0 && (
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>Résultats ({results.length})</CardTitle>
                                <CardDescription>Classés par pertinence</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" onClick={exportResults}>
                                <Download className="mr-2 h-4 w-4" />
                                Exporter CSV
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {results.map((result) => (
                            <Card key={result.id} className="overflow-hidden border-l-4" 
                                style={{ 
                                    borderLeftColor: result.sentiment === 'negatif' ? '#ef4444' : 
                                                    result.sentiment === 'positif' ? '#22c55e' : '#e5e7eb' 
                                }}>
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex gap-2">
                                            {getCategoryBadge(result.category || 'autre')}
                                            <Badge variant="outline" className={getSentimentColor(result.sentiment || 'neutre')}>
                                                {result.sentiment || 'neutre'}
                                            </Badge>
                                            <Badge variant="secondary">
                                                {(result.similarity * 100).toFixed(0)}% pertinent
                                            </Badge>
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(result.published_at), { 
                                                addSuffix: true, 
                                                locale: fr 
                                            })}
                                        </span>
                                    </div>
                                    <p className="text-sm font-medium mb-2">
                                        {result.summary || "En attente d'analyse..."}
                                    </p>
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                        {result.content}
                                    </p>
                                    {result.entities && Array.isArray(result.entities) && result.entities.length > 0 && (
                                        <div className="mt-3 flex gap-2 flex-wrap">
                                            <span className="text-xs font-medium text-muted-foreground">Entités:</span>
                                            {result.entities.slice(0, 5).map((entity: string, idx: number) => (
                                                <Badge key={idx} variant="outline" className="text-xs">
                                                    {entity}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
