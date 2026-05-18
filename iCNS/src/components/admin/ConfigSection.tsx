import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Settings, Save, AlertCircle, Bell, Shield } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface PlatformConfig {
    maintenanceMode: boolean;
    systemNotification: string;
    featureFlags: {
        feedbacks: boolean;
        knowledge: boolean;
        documents: boolean;
        aiConfig: boolean;
    };
}

export const ConfigSection = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState<PlatformConfig>({
        maintenanceMode: false,
        systemNotification: '',
        featureFlags: {
            feedbacks: true,
            knowledge: true,
            documents: true,
            aiConfig: true
        }
    });

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        setLoading(true);
        try {
            const { data, error } = await (supabase as any)
                .from('system_config')
                .select('*')
                .eq('key', 'platform_config')
                .maybeSingle();

            if (error) throw error;
            if (data?.value) {
                setConfig(data.value as PlatformConfig);
            }
        } catch (error: any) {
            console.error('Error fetching config:', error);
            // Don't show error toast on initial load if config doesn't exist
        } finally {
            setLoading(false);
        }
    };

    const saveConfig = async () => {
        setSaving(true);
        try {
            const { error } = await (supabase as any)
                .from('system_config')
                .upsert({
                    key: 'platform_config',
                    value: config,
                    description: 'Platform-wide configuration'
                });

            if (error) throw error;

            toast({
                title: "Configuration enregistrée",
                description: "Les paramètres ont été mis à jour avec succès"
            });
        } catch (error: any) {
            toast({
                title: "Erreur",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-muted-foreground">Chargement de la configuration...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Configuration Système</h2>
                <p className="text-muted-foreground">
                    Gérez les paramètres globaux de la plateforme iAsted.
                </p>
            </div>

            {/* Maintenance Mode */}
            <Card className="neu-raised border-none">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-yellow-500" />
                        <CardTitle>Mode Maintenance</CardTitle>
                    </div>
                    <CardDescription>
                        Activez le mode maintenance pour bloquer l'accès à la plateforme
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                        <div className="space-y-0.5">
                            <Label className="text-base">Activer le mode maintenance</Label>
                            <p className="text-sm text-muted-foreground">
                                Seuls les administrateurs pourront accéder à la plateforme
                            </p>
                        </div>
                        <Switch
                            checked={config.maintenanceMode}
                            onCheckedChange={(checked) =>
                                setConfig({ ...config, maintenanceMode: checked })
                            }
                        />
                    </div>
                    {config.maintenanceMode && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                            <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                            <p className="text-sm text-yellow-700 dark:text-yellow-400">
                                Le mode maintenance est actuellement activé
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* System Notification */}
            <Card className="neu-raised border-none">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Bell className="h-5 w-5 text-blue-500" />
                        <CardTitle>Notification Système</CardTitle>
                    </div>
                    <CardDescription>
                        Affichez un message important à tous les utilisateurs de la plateforme
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Label htmlFor="notification">Message global</Label>
                        <Input
                            id="notification"
                            placeholder="ex: Maintenance programmée le 25/11 de 22h à 23h"
                            value={config.systemNotification}
                            onChange={(e) =>
                                setConfig({ ...config, systemNotification: e.target.value })
                            }
                        />
                        <p className="text-xs text-muted-foreground">
                            Ce message sera affiché dans une bannière en haut de toutes les pages
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Feature Flags */}
            <Card className="neu-raised border-none">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Settings className="h-5 w-5 text-primary" />
                        <CardTitle>Sections Activées</CardTitle>
                    </div>
                    <CardDescription>
                        Activez ou désactivez les sections de l'espace administrateur
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {Object.entries(config.featureFlags).map(([key, value], index) => (
                            <React.Fragment key={key}>
                                {index > 0 && <Separator />}
                                <div className="flex items-center justify-between py-2">
                                    <div className="space-y-0.5">
                                        <Label className="capitalize font-medium">
                                            {key === 'feedbacks' && 'Feedbacks'}
                                            {key === 'knowledge' && 'Base de Connaissances'}
                                            {key === 'documents' && 'Gestion Documents'}
                                            {key === 'aiConfig' && 'Configuration IA'}
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            {key === 'feedbacks' && 'Afficher la section de gestion des feedbacks'}
                                            {key === 'knowledge' && 'Afficher la section RAG et documents'}
                                            {key === 'documents' && 'Afficher les paramètres de documents'}
                                            {key === 'aiConfig' && 'Afficher la configuration IA et voix'}
                                        </p>
                                    </div>
                                    <Switch
                                        checked={value}
                                        onCheckedChange={(checked) =>
                                            setConfig({
                                                ...config,
                                                featureFlags: { ...config.featureFlags, [key]: checked }
                                            })
                                        }
                                    />
                                </div>
                            </React.Fragment>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end gap-2">
                <Button
                    variant="outline"
                    onClick={fetchConfig}
                    disabled={saving}
                >
                    Réinitialiser
                </Button>
                <Button
                    onClick={saveConfig}
                    disabled={saving}
                    className="gap-2"
                >
                    <Save className="h-4 w-4" />
                    {saving ? 'Enregistrement...' : 'Enregistrer la configuration'}
                </Button>
            </div>
        </div>
    );
};
