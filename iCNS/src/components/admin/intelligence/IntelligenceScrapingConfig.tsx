import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Play, Clock, DollarSign, Bot } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface ScrapingConfig {
  id: string;
  enabled: boolean;
  frequency_hours: number;
  next_run_at: string | null;
  last_run_at: string | null;
  max_cost_limit: number;
  ai_providers: string[];
  social_networks: {
    facebook: boolean;
    tiktok: boolean;
    youtube: boolean;
    x: boolean;
  };
}

export function IntelligenceScrapingConfig() {
  const [config, setConfig] = useState<ScrapingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [triggering, setTriggering] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from("intelligence_scraping_config")
        .select("*")
        .single();

      if (error) throw error;

      // Conversion du type Json en objet typé
      const typedConfig: ScrapingConfig = {
        ...data,
        social_networks: (data as any).social_networks as unknown as ScrapingConfig['social_networks'],
        max_cost_limit: (data as any).max_cost_limit || 10.0,
        ai_providers: (data as any).ai_providers || ['gpt']
      } as unknown as ScrapingConfig;

      setConfig(typedConfig);
    } catch (error: any) {
      console.error("Error loading config:", error);
      toast.error("Erreur lors du chargement de la configuration");
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!config) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("intelligence_scraping_config")
        .update({
          enabled: config.enabled,
          frequency_hours: config.frequency_hours,
          social_networks: config.social_networks,
          max_cost_limit: config.max_cost_limit,
          ai_providers: config.ai_providers,
        })
        .eq("id", config.id);

      if (error) throw error;
      toast.success("Configuration enregistrée");
    } catch (error: any) {
      console.error("Error saving config:", error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const triggerScraping = async () => {
    setTriggering(true);
    try {
      const { data, error } = await supabase.functions.invoke("trigger-intelligence-scraping");

      if (error) throw error;
      toast.success("Collecte lancée avec succès");
      loadConfig(); // Recharger pour voir la nouvelle date
    } catch (error: any) {
      console.error("Error triggering scraping:", error);
      toast.error("Erreur lors du lancement de la collecte");
    } finally {
      setTriggering(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!config) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuration du Scraping Automatique</CardTitle>
        <CardDescription>
          Paramétrez la collecte automatique d'informations stratégiques
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Activation */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Système actif</Label>
            <p className="text-sm text-muted-foreground">
              Active ou désactive la collecte automatique
            </p>
          </div>
          <Switch
            checked={config.enabled}
            onCheckedChange={(checked) =>
              setConfig({ ...config, enabled: checked })
            }
          />
        </div>

        {/* Fréquence */}
        <div className="space-y-2">
          <Label>Fréquence de collecte (heures)</Label>
          <Input
            type="number"
            min="1"
            max="720"
            value={config.frequency_hours}
            onChange={(e) =>
              setConfig({
                ...config,
                frequency_hours: parseInt(e.target.value) || 1,
              })
            }
          />
          <p className="text-xs text-muted-foreground">
            Actuellement: tous les {config.frequency_hours} heures (
            {Math.round(config.frequency_hours / 24)} jours)
          </p>
        </div>

        {/* Limite de Coût */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Limite de coût par exécution ($)
          </Label>
          <Input
            type="number"
            min="0"
            step="0.1"
            value={config.max_cost_limit || 0}
            onChange={(e) =>
              setConfig({
                ...config,
                max_cost_limit: parseFloat(e.target.value) || 0,
              })
            }
          />
          <p className="text-xs text-muted-foreground">
            Le scraping s'arrêtera si le coût estimé dépasse ce montant.
          </p>
        </div>

        {/* Fournisseurs IA */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Modèles d'IA à utiliser
          </Label>
          <div className="grid grid-cols-2 gap-4">
            {['gpt', 'gemini', 'claude', 'mistral'].map((provider) => (
              <div key={provider} className="flex items-center space-x-2">
                <Checkbox
                  id={`provider-${provider}`}
                  checked={config.ai_providers?.includes(provider)}
                  onCheckedChange={(checked) => {
                    const current = config.ai_providers || [];
                    const updated = checked
                      ? [...current, provider]
                      : current.filter((p) => p !== provider);
                    setConfig({ ...config, ai_providers: updated });
                  }}
                />
                <Label htmlFor={`provider-${provider}`} className="capitalize cursor-pointer">
                  {provider}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Réseaux sociaux */}
        <div className="space-y-3">
          <Label>Réseaux sociaux à surveiller</Label>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(config.social_networks).map(([network, enabled]) => (
              <div key={network} className="flex items-center space-x-2">
                <Switch
                  checked={enabled}
                  onCheckedChange={(checked) =>
                    setConfig({
                      ...config,
                      social_networks: {
                        ...config.social_networks,
                        [network]: checked,
                      },
                    })
                  }
                />
                <Label className="capitalize">{network}</Label>
              </div>
            ))}
          </div>
        </div>

        {/* Informations de statut */}
        <div className="space-y-2 rounded-lg border p-4">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4" />
            <span className="font-medium">Dernière collecte:</span>
            <span className="text-muted-foreground">
              {config.last_run_at
                ? new Date(config.last_run_at).toLocaleString("fr-FR")
                : "Jamais"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4" />
            <span className="font-medium">Prochaine collecte:</span>
            <span className="text-muted-foreground">
              {config.next_run_at
                ? new Date(config.next_run_at).toLocaleString("fr-FR")
                : "Non planifiée"}
            </span>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex gap-3">
          <Button onClick={saveConfig} disabled={saving} className="flex-1">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer
          </Button>
          <Button
            onClick={triggerScraping}
            disabled={triggering || !config.enabled}
            variant="outline"
          >
            {triggering ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            Lancer maintenant
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
