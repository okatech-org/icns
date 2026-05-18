import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User, Bell, Globe, Palette, Lock, Download } from "lucide-react";
import { useTheme } from "next-themes";

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    userRole?: string;
}

export function SettingsModal({ isOpen, onClose, userRole = "president" }: SettingsModalProps) {
    const { toast } = useToast();
    const { theme, setTheme } = useTheme();

    // User Profile State
    const [profile, setProfile] = useState({
        fullName: "",
        email: "",
        phone: "",
        title: "",
    });

    // Notification Preferences
    const [notifications, setNotifications] = useState({
        emailNotifications: true,
        smsNotifications: false,
        inAppNotifications: true,
        documentSignatureAlerts: true,
        nominationAlerts: true,
        budgetAlerts: true,
        projectUpdates: true,
    });

    // Display Preferences
    const [displayPrefs, setDisplayPrefs] = useState({
        language: "fr",
        dateFormat: "dd/MM/yyyy",
        numberFormat: "fr-FR",
        timezone: "Africa/Libreville",
    });

    // Data Export Preferences
    const [exportPrefs, setExportPrefs] = useState({
        defaultFormat: "pdf",
        includeSignatures: true,
        includeTimestamps: true,
    });

    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    // Load user settings on mount
    useEffect(() => {
        if (isOpen) {
            loadUserSettings();
        }
    }, [isOpen]);

    const loadUserSettings = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                // Load user profile
                const { data: profileData } = await supabase
                    .from("user_profiles")
                    .select("*")
                    .eq("user_id", user.id)
                    .single();

                if (profileData) {
                    setProfile({
                        fullName: profileData.full_name || "",
                        email: user.email || "",
                        phone: "", // Not in database yet
                        title: profileData.preferred_title || "",
                    });

                    // Preferences are stored separately, not in user_profiles
                    // They could be loaded from user_preferences table if needed
                }
            } else {
                setProfile(prev => ({ ...prev, email: user.email || "" }));
            }
        } catch (error) {
            console.error("Error loading settings:", error);
            toast({
                title: "Erreur",
                description: "Impossible de charger les paramètres",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSettings = async () => {
        setSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                throw new Error("User not authenticated");
            }

            // Prepare preferences object
            const preferences = {
                notifications,
                display: displayPrefs,
                export: exportPrefs,
            };

            // Update user profile
            const { error } = await supabase
                .from("user_profiles")
                .upsert({
                    user_id: user.id,
                    full_name: profile.fullName,
                    phone: profile.phone,
                    title: profile.title,
                    preferences,
                    updated_at: new Date().toISOString(),
                });

            if (error) throw error;

            toast({
                title: "Paramètres sauvegardés",
                description: "Vos paramètres ont été mis à jour avec succès",
            });

            onClose();
        } catch (error: any) {
            console.error("Error saving settings:", error);
            toast({
                title: "Erreur",
                description: error.message || "Impossible de sauvegarder les paramètres",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        toast({
            title: "Changement de mot de passe",
            description: "Un email de réinitialisation va vous être envoyé",
        });

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(profile.email);

            if (error) throw error;

            toast({
                title: "Email envoyé",
                description: "Vérifiez votre boîte de réception",
            });
        } catch (error: any) {
            toast({
                title: "Erreur",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    if (loading) {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <div className="flex items-center justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Paramètres</DialogTitle>
                    <DialogDescription>
                        Gérez vos préférences et paramètres du compte
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="profile" className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="profile">
                            <User className="w-4 h-4 mr-2" />
                            Profil
                        </TabsTrigger>
                        <TabsTrigger value="notifications">
                            <Bell className="w-4 h-4 mr-2" />
                            Alertes
                        </TabsTrigger>
                        <TabsTrigger value="display">
                            <Palette className="w-4 h-4 mr-2" />
                            Affichage
                        </TabsTrigger>
                        <TabsTrigger value="security">
                            <Lock className="w-4 h-4 mr-2" />
                            Sécurité
                        </TabsTrigger>
                        <TabsTrigger value="export">
                            <Download className="w-4 h-4 mr-2" />
                            Export
                        </TabsTrigger>
                    </TabsList>

                    {/* Profile Tab */}
                    <TabsContent value="profile" className="space-y-4">
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="fullName">Nom complet</Label>
                                <Input
                                    id="fullName"
                                    value={profile.fullName}
                                    onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                                    placeholder="Votre nom complet"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={profile.email}
                                    disabled
                                    className="bg-muted"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="phone">Téléphone</Label>
                                <Input
                                    id="phone"
                                    value={profile.phone}
                                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                    placeholder="+241 XX XX XX XX"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="title">Titre / Fonction</Label>
                                <Input
                                    id="title"
                                    value={profile.title}
                                    onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                                    placeholder="Ex: Président de la République"
                                />
                            </div>
                        </div>
                    </TabsContent>

                    {/* Notifications Tab */}
                    <TabsContent value="notifications" className="space-y-4">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Notifications par email</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Recevoir des alertes par email
                                    </p>
                                </div>
                                <Switch
                                    checked={notifications.emailNotifications}
                                    onCheckedChange={(checked) =>
                                        setNotifications({ ...notifications, emailNotifications: checked })
                                    }
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Notifications par SMS</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Recevoir des alertes par SMS
                                    </p>
                                </div>
                                <Switch
                                    checked={notifications.smsNotifications}
                                    onCheckedChange={(checked) =>
                                        setNotifications({ ...notifications, smsNotifications: checked })
                                    }
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Notifications dans l'application</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Afficher les notifications dans l'app
                                    </p>
                                </div>
                                <Switch
                                    checked={notifications.inAppNotifications}
                                    onCheckedChange={(checked) =>
                                        setNotifications({ ...notifications, inAppNotifications: checked })
                                    }
                                />
                            </div>

                            <div className="border-t pt-4 mt-4">
                                <h4 className="font-semibold mb-4">Alertes spécifiques</h4>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label>Signature de documents</Label>
                                        <Switch
                                            checked={notifications.documentSignatureAlerts}
                                            onCheckedChange={(checked) =>
                                                setNotifications({ ...notifications, documentSignatureAlerts: checked })
                                            }
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <Label>Nominations en attente</Label>
                                        <Switch
                                            checked={notifications.nominationAlerts}
                                            onCheckedChange={(checked) =>
                                                setNotifications({ ...notifications, nominationAlerts: checked })
                                            }
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <Label>Alertes budgétaires</Label>
                                        <Switch
                                            checked={notifications.budgetAlerts}
                                            onCheckedChange={(checked) =>
                                                setNotifications({ ...notifications, budgetAlerts: checked })
                                            }
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <Label>Mises à jour de projets</Label>
                                        <Switch
                                            checked={notifications.projectUpdates}
                                            onCheckedChange={(checked) =>
                                                setNotifications({ ...notifications, projectUpdates: checked })
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Display Tab */}
                    <TabsContent value="display" className="space-y-4">
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="theme">Thème</Label>
                                <Select value={theme} onValueChange={setTheme}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="light">Clair</SelectItem>
                                        <SelectItem value="dark">Sombre</SelectItem>
                                        <SelectItem value="system">Système</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="language">Langue</Label>
                                <Select
                                    value={displayPrefs.language}
                                    onValueChange={(value) => setDisplayPrefs({ ...displayPrefs, language: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="fr">Français</SelectItem>
                                        <SelectItem value="en">English</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="dateFormat">Format de date</Label>
                                <Select
                                    value={displayPrefs.dateFormat}
                                    onValueChange={(value) => setDisplayPrefs({ ...displayPrefs, dateFormat: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="dd/MM/yyyy">JJ/MM/AAAA</SelectItem>
                                        <SelectItem value="MM/dd/yyyy">MM/JJ/AAAA</SelectItem>
                                        <SelectItem value="yyyy-MM-dd">AAAA-MM-JJ</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="numberFormat">Format de nombres</Label>
                                <Select
                                    value={displayPrefs.numberFormat}
                                    onValueChange={(value) => setDisplayPrefs({ ...displayPrefs, numberFormat: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="fr-FR">1 234 567,89 (FR)</SelectItem>
                                        <SelectItem value="en-US">1,234,567.89 (US)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Security Tab */}
                    <TabsContent value="security" className="space-y-4">
                        <div className="space-y-4">
                            <div className="rounded-lg border p-4">
                                <h4 className="font-semibold mb-2">Mot de passe</h4>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Changez votre mot de passe régulièrement pour sécuriser votre compte
                                </p>
                                <Button onClick={handleChangePassword} variant="outline">
                                    Changer le mot de passe
                                </Button>
                            </div>

                            <div className="rounded-lg border p-4">
                                <h4 className="font-semibold mb-2">Sessions actives</h4>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Gérez vos sessions actives sur différents appareils
                                </p>
                                <Button variant="outline" disabled>
                                    Voir les sessions (Bientôt disponible)
                                </Button>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Export Tab */}
                    <TabsContent value="export" className="space-y-4">
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="defaultFormat">Format d'export par défaut</Label>
                                <Select
                                    value={exportPrefs.defaultFormat}
                                    onValueChange={(value) => setExportPrefs({ ...exportPrefs, defaultFormat: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pdf">PDF</SelectItem>
                                        <SelectItem value="excel">Excel (XLSX)</SelectItem>
                                        <SelectItem value="csv">CSV</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Inclure les signatures</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Ajouter les signatures dans les exports
                                    </p>
                                </div>
                                <Switch
                                    checked={exportPrefs.includeSignatures}
                                    onCheckedChange={(checked) =>
                                        setExportPrefs({ ...exportPrefs, includeSignatures: checked })
                                    }
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Inclure les horodatages</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Ajouter les dates et heures dans les exports
                                    </p>
                                </div>
                                <Switch
                                    checked={exportPrefs.includeTimestamps}
                                    onCheckedChange={(checked) =>
                                        setExportPrefs({ ...exportPrefs, includeTimestamps: checked })
                                    }
                                />
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                    <Button variant="outline" onClick={onClose} disabled={saving}>
                        Annuler
                    </Button>
                    <Button onClick={handleSaveSettings} disabled={saving}>
                        {saving ? "Enregistrement..." : "Sauvegarder"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
