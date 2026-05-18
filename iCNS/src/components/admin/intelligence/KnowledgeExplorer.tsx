import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Loader2, Tag, Brain, MessageSquare, MapPin, Users, Building } from 'lucide-react';

interface IntelligenceStat {
    category: string;
    count: number;
}

interface EntityStat {
    name: string;
    type: string;
    count: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export const KnowledgeExplorer = () => {
    const [loading, setLoading] = useState(true);
    const [categoryStats, setCategoryStats] = useState<IntelligenceStat[]>([]);
    const [sentimentStats, setSentimentStats] = useState<IntelligenceStat[]>([]);
    const [topEntities, setTopEntities] = useState<EntityStat[]>([]);
    const [recentItems, setRecentItems] = useState<any[]>([]);

    const [selectedItem, setSelectedItem] = useState<any | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        try {
            // Fetch raw data to aggregate locally (Supabase doesn't support complex aggregation easily via JS client without RPC)
            // For a production app with huge data, we should use an RPC function. For now, client-side aggregation is fine for < 1000 items.
            const { data, error } = await supabase
                .from('intelligence_items')
                .select('id, category, sentiment, entities, summary, content, author, published_at')
                .not('embedding', 'is', null)
                .order('published_at', { ascending: false })
                .limit(500);

            if (error) throw error;

            // Process Categories
            const catMap = new Map<string, number>();
            const sentMap = new Map<string, number>();
            const entityMap = new Map<string, { type: string, count: number }>();

            data.forEach(item => {
                // Categories
                if (item.category) {
                    catMap.set(item.category, (catMap.get(item.category) || 0) + 1);
                }
                // Sentiments
                if (item.sentiment) {
                    sentMap.set(item.sentiment, (sentMap.get(item.sentiment) || 0) + 1);
                }
                // Entities
                if (item.entities && Array.isArray(item.entities)) {
                    item.entities.forEach((ent: any) => {
                        // Assuming entity structure { name: "...", type: "..." } or similar from Gemini
                        // Adjust based on actual JSON structure. If it's just strings, handle that.
                        const name = ent.name || ent; // Fallback if simple string
                        const type = ent.type || 'unknown';
                        const key = `${name}::${type}`;

                        const current = entityMap.get(key) || { type, count: 0 };
                        entityMap.set(key, { type, count: current.count + 1 });
                    });
                }
            });

            // Format for Recharts
            const catStats = Array.from(catMap.entries())
                .map(([category, count]) => ({ category, count }))
                .sort((a, b) => b.count - a.count);

            const sentStats = Array.from(sentMap.entries())
                .map(([category, count]) => ({ category, count })) // reusing interface
                .sort((a, b) => b.count - a.count);

            const entStats = Array.from(entityMap.entries())
                .map(([key, val]) => {
                    const [name] = key.split('::');
                    return { name, type: val.type, count: val.count };
                })
                .sort((a, b) => b.count - a.count)
                .slice(0, 20); // Top 20 entities

            setCategoryStats(catStats);
            setSentimentStats(sentStats);
            setTopEntities(entStats);
            setRecentItems(data.slice(0, 50)); // Keep top 50 recent for list

        } catch (error) {
            console.error('Error fetching knowledge stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleItemClick = (item: any) => {
        setSelectedItem(item);
        setIsDetailOpen(true);
    };

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-6">
            {/* Detail Dialog */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Détail de l'information</DialogTitle>
                        <DialogDescription>
                            Données vectorisées et contextuelles
                        </DialogDescription>
                    </DialogHeader>
                    {selectedItem && (
                        <div className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                                <Badge>{selectedItem.category}</Badge>
                                <Badge variant="outline">{selectedItem.sentiment}</Badge>
                                <span className="text-sm text-muted-foreground ml-auto">
                                    {new Date(selectedItem.published_at).toLocaleString()}
                                </span>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-semibold text-sm text-muted-foreground">Résumé</h4>
                                <p className="text-sm bg-muted/50 p-3 rounded-md">{selectedItem.summary}</p>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-semibold text-sm text-muted-foreground">Contenu Complet</h4>
                                <p className="text-sm whitespace-pre-wrap">{selectedItem.content}</p>
                            </div>

                            {selectedItem.author && (
                                <div className="space-y-1">
                                    <h4 className="font-semibold text-sm text-muted-foreground">Source / Auteur</h4>
                                    <p className="text-sm">{selectedItem.author}</p>
                                </div>
                            )}

                            {selectedItem.entities && Array.isArray(selectedItem.entities) && selectedItem.entities.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-sm text-muted-foreground">Entités Détectées</h4>
                                    <div className="flex flex-wrap gap-1">
                                        {selectedItem.entities.map((ent: any, i: number) => (
                                            <Badge key={i} variant="secondary" className="text-xs">
                                                {ent.name || ent}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Theme Distribution */}
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Brain className="h-5 w-5" /> Répartition Thématique
                        </CardTitle>
                        <CardDescription>Distribution des informations par catégorie</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={categoryStats}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                <XAxis dataKey="category" />
                                <YAxis />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                                />
                                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                                    {categoryStats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Sentiment Analysis */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5" /> Analyse des Sentiments
                        </CardTitle>
                        <CardDescription>Tonalité globale des informations</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={sentimentStats}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="count"
                                    nameKey="category" // reusing field name
                                >
                                    {sentimentStats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex flex-wrap justify-center gap-2 mt-4">
                            {sentimentStats.map((stat, index) => (
                                <div key={stat.category} className="flex items-center gap-1 text-xs">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                    <span>{stat.category}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Entities Cloud */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" /> Entités Détectées
                    </CardTitle>
                    <CardDescription>Personnalités, Lieux et Organisations les plus cités</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        {topEntities.map((entity, index) => (
                            <Badge
                                key={index}
                                variant="secondary"
                                className="text-sm py-1 px-3 hover:bg-primary/20 cursor-pointer transition-colors"
                            >
                                {entity.type === 'person' && <Users className="h-3 w-3 mr-1 inline" />}
                                {entity.type === 'location' && <MapPin className="h-3 w-3 mr-1 inline" />}
                                {entity.type === 'organization' && <Building className="h-3 w-3 mr-1 inline" />}
                                {entity.name}
                                <span className="ml-2 text-xs opacity-50">({entity.count})</span>
                            </Badge>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Recent Contexts */}
            <Card>
                <CardHeader>
                    <CardTitle>Dernières Informations Contextualisées</CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[300px]">
                        <div className="space-y-4">
                            {recentItems.map((item, i) => (
                                <div
                                    key={i}
                                    className="flex flex-col gap-1 border-b border-border/50 pb-3 last:border-0 cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors"
                                    onClick={() => handleItemClick(item)}
                                >
                                    <div className="flex items-center justify-between">
                                        <Badge variant="outline" className="text-xs">{item.category || 'Non classé'}</Badge>
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(item.published_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-sm font-medium mt-1 line-clamp-2">{item.summary || item.content?.substring(0, 100) || "Pas de contenu"}</p>
                                    <div className="flex items-center justify-between mt-1">
                                        <div className="flex gap-2">
                                            {item.sentiment && (
                                                <Badge variant="secondary" className="text-[10px] h-5">
                                                    {item.sentiment}
                                                </Badge>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-primary underline">Voir le détail</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
};
