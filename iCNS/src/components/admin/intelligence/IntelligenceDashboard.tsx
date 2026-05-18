import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IntelligenceFeed } from './IntelligenceFeed';
import { IntelligenceSources } from './IntelligenceSources';
import { IntelligenceSearch } from './IntelligenceSearch';
import { IntelligenceScrapingConfig } from './IntelligenceScrapingConfig';
import { supabase } from "@/integrations/supabase/client";
import { Activity, Database, AlertCircle, ShieldAlert, Search as SearchIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const IntelligenceDashboard = () => {
    const [stats, setStats] = useState({
        totalItems: 0,
        activeSources: 0,
        alertsToday: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            const { count: totalItems } = await supabase.from('intelligence_items').select('*', { count: 'exact', head: true });
            const { count: activeSources } = await supabase.from('intelligence_sources').select('*', { count: 'exact', head: true }).eq('status', 'active');

            // Count items from last 24h with negative sentiment or security category
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            const { count: alertsToday } = await supabase
                .from('intelligence_items')
                .select('*', { count: 'exact', head: true })
                .gte('published_at', yesterday.toISOString())
                .or('sentiment.eq.negatif,sentiment.eq.peur,sentiment.eq.colere,category.eq.securite');

            setStats({
                totalItems: totalItems || 0,
                activeSources: activeSources || 0,
                alertsToday: alertsToday || 0
            });
        };

        fetchStats();
    }, []);

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold tracking-tight">Oeil de Lynx</h2>
                <p className="text-muted-foreground">Centre de Veille Stratégique & Intelligence Artificielle</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Données Capturées</CardTitle>
                        <Database className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalItems}</div>
                        <p className="text-xs text-muted-foreground">Total items vectorisés</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Sources Actives</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeSources}</div>
                        <p className="text-xs text-muted-foreground">Canaux d'écoute opérationnels</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Alertes (24h)</CardTitle>
                        <ShieldAlert className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{stats.alertsToday}</div>
                        <p className="text-xs text-muted-foreground">Signaux faibles ou critiques</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="feed" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="feed">Flux en Direct</TabsTrigger>
                    <TabsTrigger value="search">
                        <SearchIcon className="h-4 w-4 mr-2" />
                        Recherche IA
                    </TabsTrigger>
                    <TabsTrigger value="sources">Gestion des Sources</TabsTrigger>
                    <TabsTrigger value="config">Configuration</TabsTrigger>
                </TabsList>
                <TabsContent value="feed" className="space-y-4">
                    <IntelligenceFeed />
                </TabsContent>
                <TabsContent value="search" className="space-y-4">
                    <IntelligenceSearch />
                </TabsContent>
                <TabsContent value="sources" className="space-y-4">
                    <IntelligenceSources />
                </TabsContent>
                <TabsContent value="config">
                    <IntelligenceScrapingConfig />
                </TabsContent>
            </Tabs>
        </div>
    );
};
