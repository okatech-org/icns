import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Settings, Database, Shield, FileText, Activity, ArrowLeft } from "lucide-react";
import { systemSettingsService, type SystemSetting } from "@/services/systemSettingsService";
import { auditLogService, type AuditLog } from "@/services/auditLogService";
import { supabase } from "@/integrations/supabase/client";

export default function AdminSystemSettings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [settingsData, logsData] = await Promise.all([
        systemSettingsService.getAllSettings(),
        auditLogService.getLogs({ limit: 50 }),
      ]);
      setSettings(settingsData);
      setAuditLogs(logsData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await systemSettingsService.updateSetting(key, value, user?.id);
      await auditLogService.logEvent("update_setting", "system_settings", { key, value });
      toast.success("Paramètre mis à jour");
      loadData();
    } catch (error) {
      console.error("Error updating setting:", error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  const getSettingByKey = (key: string): SystemSetting | undefined => {
    return settings.find((s) => s.setting_key === key);
  };

  const renderStorageLimits = () => {
    const setting = getSettingByKey("storage_limits");
    if (!setting) return null;

    const value = setting.setting_value;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Limites de stockage
          </CardTitle>
          <CardDescription>
            Configuration de nettoyage automatique des conversations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre maximum de messages par conversation</Label>
            <Input
              type="number"
              value={value.max_conversation_messages}
              onChange={(e) =>
                updateSetting("storage_limits", {
                  ...value,
                  max_conversation_messages: parseInt(e.target.value),
                })
              }
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Nettoyage automatique activé</Label>
            <Switch
              checked={value.auto_cleanup_enabled}
              onCheckedChange={(checked) =>
                updateSetting("storage_limits", {
                  ...value,
                  auto_cleanup_enabled: checked,
                })
              }
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label>Supprimer les messages de plus de (jours)</Label>
            <Input
              type="number"
              value={value.cleanup_older_than_days}
              onChange={(e) =>
                updateSetting("storage_limits", {
                  ...value,
                  cleanup_older_than_days: parseInt(e.target.value),
                })
              }
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderPDFSettings = () => {
    const setting = getSettingByKey("pdf_generation");
    if (!setting) return null;

    const value = setting.setting_value;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Génération de documents PDF
          </CardTitle>
          <CardDescription>Paramètres de génération et d'export de documents</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Template par défaut</Label>
            <Input
              value={value.default_template}
              onChange={(e) =>
                updateSetting("pdf_generation", {
                  ...value,
                  default_template: e.target.value,
                })
              }
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Activer le filigrane</Label>
            <Switch
              checked={value.enable_watermark}
              onCheckedChange={(checked) =>
                updateSetting("pdf_generation", {
                  ...value,
                  enable_watermark: checked,
                })
              }
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label>Taille maximale du fichier (MB)</Label>
            <Input
              type="number"
              value={value.max_file_size_mb}
              onChange={(e) =>
                updateSetting("pdf_generation", {
                  ...value,
                  max_file_size_mb: parseInt(e.target.value),
                })
              }
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderAuditLogging = () => {
    const setting = getSettingByKey("audit_logging");
    if (!setting) return null;

    const value = setting.setting_value;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Logs d'audit
          </CardTitle>
          <CardDescription>Configuration de traçabilité et sécurité</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Logs d'audit activés</Label>
            <Switch
              checked={value.enabled}
              onCheckedChange={(checked) =>
                updateSetting("audit_logging", {
                  ...value,
                  enabled: checked,
                })
              }
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label>Durée de rétention (jours)</Label>
            <Input
              type="number"
              value={value.retention_days}
              onChange={(e) =>
                updateSetting("audit_logging", {
                  ...value,
                  retention_days: parseInt(e.target.value),
                })
              }
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>
    );
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive";
      case "error":
        return "destructive";
      case "warning":
        return "default";
      default:
        return "secondary";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Settings className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p>Chargement des paramètres...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Paramètres système</h1>
            <p className="text-muted-foreground">
              Configuration globale de l'application
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
          <TabsTrigger value="audit">
            <Activity className="h-4 w-4 mr-2" />
            Logs d'audit
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          {renderStorageLimits()}
          {renderPDFSettings()}
          {renderAuditLogging()}
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique des actions administratives</CardTitle>
              <CardDescription>
                50 dernières entrées du journal d'audit
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {auditLogs.map((log) => (
                  <div key={log.id} className="border-l-2 pl-4 py-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={getSeverityColor(log.severity)}>
                            {log.severity}
                          </Badge>
                          <span className="font-medium">{log.action}</span>
                          <span className="text-sm text-muted-foreground">
                            sur {log.resource}
                          </span>
                        </div>
                        {log.details && (
                          <p className="text-sm text-muted-foreground">
                            {JSON.stringify(log.details)}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.created_at).toLocaleString("fr-FR")}
                          {log.ip_address && ` • IP: ${log.ip_address}`}
                        </p>
                      </div>
                      <Badge variant={log.success ? "outline" : "destructive"}>
                        {log.success ? "Succès" : "Échec"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
