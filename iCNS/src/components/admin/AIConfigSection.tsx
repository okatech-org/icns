import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Bot, Mic, Save, RefreshCw } from 'lucide-react';
import { IASTED_AUTHORIZED_ROLES, type AppRole } from '@/config/role-contexts';

export const AIConfigSection = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [selectedRole, setSelectedRole] = useState<AppRole>('president');
    const [systemPrompts, setSystemPrompts] = useState<Record<string, string>>({});
    const [voiceConfig, setVoiceConfig] = useState({
        voice: 'alloy',
        model: 'gpt-4o-realtime-preview-2024-10-01',
        temperature: 0.7
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
                .in('key', ['ai_system_prompts', 'ai_voice_config']);

            if (error) throw error;

            if (data) {
                const prompts = data.find((d: any) => d.key === 'ai_system_prompts')?.value;
                const voice = data.find((d: any) => d.key === 'ai_voice_config')?.value;

                if (prompts) setSystemPrompts(prompts as Record<string, string>);
                if (voice) setVoiceConfig(voice as any);
            }
        } catch (error: any) {
            console.error('Error fetching AI config:', error);
            toast({
                title: "Erreur",
                description: "Impossible de charger la configuration IA",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSavePrompts = async () => {
        setLoading(true);
        try {
            const { error } = await (supabase as any)
                .from('system_config')
                .upsert({
                    key: 'ai_system_prompts',
                    value: systemPrompts,
                    description: 'System prompts for each role'
                });

            if (error) throw error;

            toast({
                title: "Succès",
                description: "Prompts système mis à jour"
            });
        } catch (error: any) {
            toast({
                title: "Erreur",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveVoiceConfig = async () => {
        setLoading(true);
        try {
            const { error } = await (supabase as any)
                .from('system_config')
                .upsert({
                    key: 'ai_voice_config',
                    value: voiceConfig,
                    description: 'OpenAI Realtime voice configuration'
                });

            if (error) throw error;

            toast({
                title: "Succès",
                description: "Configuration vocale mise à jour"
            });
        } catch (error: any) {
            toast({
                title: "Erreur",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Tabs defaultValue="prompts" className="w-full">
                <TabsList>
                    <TabsTrigger value="prompts" className="flex items-center gap-2">
                        <Bot className="h-4 w-4" /> Prompts Système
                    </TabsTrigger>
                    <TabsTrigger value="voice" className="flex items-center gap-2">
                        <Mic className="h-4 w-4" /> Voix & Modèle
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="prompts" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Personnalisation des Agents</CardTitle>
                            <CardDescription>
                                Définissez le comportement de l'IA pour chaque rôle.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-4">
                                <div className="w-1/3 space-y-2">
                                    <Label>Rôle Cible</Label>
                                    <Select
                                        value={selectedRole}
                                        onValueChange={(v) => setSelectedRole(v as AppRole)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {IASTED_AUTHORIZED_ROLES.map(role => (
                                                <SelectItem key={role} value={role}>
                                                    {role.charAt(0).toUpperCase() + role.slice(1)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="w-2/3 space-y-2">
                                    <Label>Prompt Système</Label>
                                    <Textarea
                                        className="min-h-[300px] font-mono text-sm"
                                        value={systemPrompts[selectedRole] || ''}
                                        onChange={(e) => setSystemPrompts({
                                            ...systemPrompts,
                                            [selectedRole]: e.target.value
                                        })}
                                        placeholder="Vous êtes un assistant intelligent..."
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <Button onClick={handleSavePrompts} disabled={loading}>
                                    <Save className="mr-2 h-4 w-4" /> Enregistrer
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="voice" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Configuration OpenAI Realtime</CardTitle>
                            <CardDescription>
                                Paramètres globaux pour le moteur vocal et le modèle.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Modèle OpenAI</Label>
                                    <Select
                                        value={voiceConfig.model}
                                        onValueChange={(v) => setVoiceConfig({ ...voiceConfig, model: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="gpt-4o-realtime-preview-2024-10-01">GPT-4o Realtime (Preview)</SelectItem>
                                            <SelectItem value="gpt-4o-mini-realtime-preview-2024-12-17">GPT-4o Mini Realtime</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Voix par défaut</Label>
                                    <Select
                                        value={voiceConfig.voice}
                                        onValueChange={(v) => setVoiceConfig({ ...voiceConfig, voice: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="alloy">Alloy (Neutre)</SelectItem>
                                            <SelectItem value="echo">Echo (Masculin)</SelectItem>
                                            <SelectItem value="shimmer">Shimmer (Féminin)</SelectItem>
                                            <SelectItem value="ash">Ash (Neutre)</SelectItem>
                                            <SelectItem value="ballad">Ballad (Neutre)</SelectItem>
                                            <SelectItem value="coral">Coral (Féminin)</SelectItem>
                                            <SelectItem value="sage">Sage (Neutre)</SelectItem>
                                            <SelectItem value="verse">Verse (Neutre)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Température ({voiceConfig.temperature})</Label>
                                    <Input
                                        type="number"
                                        min="0.6"
                                        max="1.2"
                                        step="0.1"
                                        value={voiceConfig.temperature}
                                        onChange={(e) => setVoiceConfig({ ...voiceConfig, temperature: parseFloat(e.target.value) })}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Plus la valeur est élevée, plus l'IA est créative (0.6 - 1.2 recommandé).
                                    </p>
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <Button onClick={handleSaveVoiceConfig} disabled={loading}>
                                    <Save className="mr-2 h-4 w-4" /> Enregistrer la configuration
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};
