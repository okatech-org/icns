import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Save } from "lucide-react";

const Profile = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState({
        full_name: "",
        email: "",
        preferred_title: "",
        gender: ""
    });

    useEffect(() => {
        getProfile();
    }, []);

    const getProfile = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) return;

            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error) {
                console.error(error);
            } else if (data) {
                setProfile({
                    full_name: data.full_name || "",
                    email: user.email || "",
                    preferred_title: data.preferred_title || "",
                    gender: data.gender || ""
                });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const updateProfile = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) throw new Error("No user");

            const updates = {
                user_id: user.id,
                full_name: profile.full_name,
                preferred_title: profile.preferred_title,
                gender: profile.gender,
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase
                .from('user_profiles')
                .upsert(updates);

            if (error) throw error;

            toast({
                title: "Profil mis à jour",
                description: "Vos informations ont été enregistrées avec succès.",
            });
        } catch (error) {
            toast({
                title: "Erreur",
                description: "Impossible de mettre à jour le profil.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Mon Profil</h1>
                <p className="text-muted-foreground">
                    Gérez vos informations personnelles et votre apparence publique.
                </p>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Informations Personnelles</CardTitle>
                        <CardDescription>
                            Ces informations seront visibles sur votre profil.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center gap-6">
                            <Avatar className="h-24 w-24">
                                <AvatarFallback className="text-lg">
                                    {profile.full_name?.charAt(0) || "U"}
                                </AvatarFallback>
                            </Avatar>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="fullName">Nom complet</Label>
                                <Input
                                    id="fullName"
                                    value={profile.full_name}
                                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                                    placeholder="Jean Dupont"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    value={profile.email}
                                    disabled
                                    className="bg-muted"
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="preferred_title">Titre préféré</Label>
                                <Input
                                    id="preferred_title"
                                    value={profile.preferred_title}
                                    onChange={(e) => setProfile({ ...profile, preferred_title: e.target.value })}
                                    placeholder="M., Mme, Dr..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="gender">Genre</Label>
                                <Input
                                    id="gender"
                                    value={profile.gender}
                                    onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                                    placeholder="Homme, Femme, Autre..."
                                />
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button onClick={updateProfile} disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {!loading && <Save className="mr-2 h-4 w-4" />}
                                Enregistrer les modifications
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Profile;
