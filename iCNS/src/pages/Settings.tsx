import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "next-themes";
import { Moon, Sun, Laptop } from "lucide-react";

const Settings = () => {
    const { setTheme, theme } = useTheme();

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
                <p className="text-muted-foreground">
                    Gérez vos préférences d'application et de compte.
                </p>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Apparence</CardTitle>
                        <CardDescription>
                            Personnalisez l'apparence de l'application.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>Thème</Label>
                            <div className="grid grid-cols-3 gap-4">
                                <Button
                                    variant={theme === "light" ? "default" : "outline"}
                                    className="justify-start"
                                    onClick={() => setTheme("light")}
                                >
                                    <Sun className="mr-2 h-4 w-4" />
                                    Clair
                                </Button>
                                <Button
                                    variant={theme === "dark" ? "default" : "outline"}
                                    className="justify-start"
                                    onClick={() => setTheme("dark")}
                                >
                                    <Moon className="mr-2 h-4 w-4" />
                                    Sombre
                                </Button>
                                <Button
                                    variant={theme === "system" ? "default" : "outline"}
                                    className="justify-start"
                                    onClick={() => setTheme("system")}
                                >
                                    <Laptop className="mr-2 h-4 w-4" />
                                    Système
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Notifications</CardTitle>
                        <CardDescription>
                            Choisissez comment vous souhaitez être notifié.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="email-notifs" className="flex flex-col space-y-1">
                                <span>Notifications par email</span>
                                <span className="font-normal text-xs text-muted-foreground">
                                    Recevoir des emails pour les mises à jour importantes.
                                </span>
                            </Label>
                            <Switch id="email-notifs" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="push-notifs" className="flex flex-col space-y-1">
                                <span>Notifications Push</span>
                                <span className="font-normal text-xs text-muted-foreground">
                                    Recevoir des notifications sur votre appareil.
                                </span>
                            </Label>
                            <Switch id="push-notifs" defaultChecked />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Langue et Région</CardTitle>
                        <CardDescription>
                            Définissez vos préférences linguistiques.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>Langue</Label>
                            <Select defaultValue="fr">
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner une langue" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="fr">Français</SelectItem>
                                    <SelectItem value="en">English</SelectItem>
                                    <SelectItem value="es">Español</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Settings;
