import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Save, Upload } from "lucide-react";

interface ServiceBrandingEditorProps {
    serviceRole: string;
    serviceName: string;
}

interface BrandingSettings {
    id?: string;
    header_text: string;
    sub_header_text: string;
    footer_text: string;
    logo_url: string;
    margins: {
        top: number;
        bottom: number;
        left: number;
        right: number;
    };
    primary_color: string;
    secondary_color: string;
}

const DEFAULT_SETTINGS: BrandingSettings = {
    header_text: '',
    sub_header_text: '',
    footer_text: '',
    logo_url: '',
    margins: { top: 20, bottom: 20, left: 20, right: 20 },
    primary_color: '#000000',
    secondary_color: '#666666'
};

export const ServiceBrandingEditor: React.FC<ServiceBrandingEditorProps> = ({ serviceRole, serviceName }) => {
    const [settings, setSettings] = useState<BrandingSettings>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        fetchSettings();
    }, [serviceRole]);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('service_document_settings' as any)
                .select('*')
                .eq('service_role', serviceRole)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
                console.error('Error fetching settings:', error);
                toast({
                    title: "Erreur",
                    description: "Impossible de charger les paramètres.",
                    variant: "destructive"
                });
            }

            if (data) {
                const settingsData = data as any;
                setSettings({
                    id: settingsData.id,
                    header_text: settingsData.header_text || '',
                    sub_header_text: settingsData.sub_header_text || '',
                    footer_text: settingsData.footer_text || '',
                    logo_url: settingsData.logo_url || '',
                    margins: (settingsData.margins as any) || DEFAULT_SETTINGS.margins,
                    primary_color: settingsData.primary_color || DEFAULT_SETTINGS.primary_color,
                    secondary_color: settingsData.secondary_color || DEFAULT_SETTINGS.secondary_color
                });
            } else {
                setSettings(DEFAULT_SETTINGS);
            }
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                service_role: serviceRole,
                header_text: settings.header_text,
                sub_header_text: settings.sub_header_text,
                footer_text: settings.footer_text,
                logo_url: settings.logo_url,
                margins: settings.margins,
                primary_color: settings.primary_color,
                secondary_color: settings.secondary_color
            };

            const { error } = await supabase
                .from('service_document_settings' as any)
                .upsert(payload, { onConflict: 'service_role' });

            if (error) throw error;

            toast({
                title: "Succès",
                description: "Paramètres enregistrés avec succès.",
            });
            fetchSettings(); // Refresh to get ID if it was a new insert
        } catch (error: any) {
            console.error('Error saving settings:', error);
            toast({
                title: "Erreur",
                description: "Erreur lors de l'enregistrement: " + error.message,
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (field: keyof BrandingSettings, value: any) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    const handleMarginChange = (side: keyof BrandingSettings['margins'], value: string) => {
        const numValue = parseInt(value) || 0;
        setSettings(prev => ({
            ...prev,
            margins: { ...prev.margins, [side]: numValue }
        }));
    };

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Personnalisation : {serviceName}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* En-tête */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">En-tête</h3>
                        <div className="space-y-2">
                            <Label>Titre Principal (En-tête)</Label>
                            <Input
                                value={settings.header_text}
                                onChange={(e) => handleChange('header_text', e.target.value)}
                                placeholder="ex: PRÉSIDENCE DE LA RÉPUBLIQUE"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Sous-titre</Label>
                            <Input
                                value={settings.sub_header_text}
                                onChange={(e) => handleChange('sub_header_text', e.target.value)}
                                placeholder="ex: Cabinet du Président"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>URL du Logo</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={settings.logo_url}
                                    onChange={(e) => handleChange('logo_url', e.target.value)}
                                    placeholder="https://..."
                                />
                                {/* Future: Add upload button */}
                            </div>
                        </div>
                    </div>

                    {/* Pied de page & Couleurs */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Pied de page & Style</h3>
                        <div className="space-y-2">
                            <Label>Texte du Pied de page</Label>
                            <Textarea
                                value={settings.footer_text}
                                onChange={(e) => handleChange('footer_text', e.target.value)}
                                placeholder="Adresse, Contact, Mentions légales..."
                                rows={3}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Couleur Primaire</Label>
                                <div className="flex gap-2 items-center">
                                    <Input
                                        type="color"
                                        value={settings.primary_color}
                                        onChange={(e) => handleChange('primary_color', e.target.value)}
                                        className="w-12 h-10 p-1"
                                    />
                                    <Input
                                        value={settings.primary_color}
                                        onChange={(e) => handleChange('primary_color', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Couleur Secondaire</Label>
                                <div className="flex gap-2 items-center">
                                    <Input
                                        type="color"
                                        value={settings.secondary_color}
                                        onChange={(e) => handleChange('secondary_color', e.target.value)}
                                        className="w-12 h-10 p-1"
                                    />
                                    <Input
                                        value={settings.secondary_color}
                                        onChange={(e) => handleChange('secondary_color', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Marges */}
                <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-medium">Mise en page (Marges en mm)</h3>
                    <div className="grid grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label>Haut</Label>
                            <Input
                                type="number"
                                value={settings.margins.top}
                                onChange={(e) => handleMarginChange('top', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Bas</Label>
                            <Input
                                type="number"
                                value={settings.margins.bottom}
                                onChange={(e) => handleMarginChange('bottom', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Gauche</Label>
                            <Input
                                type="number"
                                value={settings.margins.left}
                                onChange={(e) => handleMarginChange('left', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Droite</Label>
                            <Input
                                type="number"
                                value={settings.margins.right}
                                onChange={(e) => handleMarginChange('right', e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-6">
                    <Button onClick={handleSave} disabled={saving} className="w-full md:w-auto">
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Enregistrer les paramètres
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};
