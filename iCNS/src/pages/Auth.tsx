import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Lock, ArrowLeft, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import emblemGabon from "@/assets/emblem_gabon.png";
import { usePrefetch } from "@/hooks/usePrefetch";
import { z } from "zod";
type AppRole = 'president' | 'admin' | 'dgss' | 'dgr' | 'cabinet_private' | 'sec_gen' | 'minister' | 'protocol' | 'courrier' | 'reception' | 'user';

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [initializingDemo, setInitializingDemo] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { prefetchPresidentSpace, prefetchDashboard } = usePrefetch();

  const authSchema = z.object({
    email: z.string().trim().email({ message: "Adresse email invalide" }).max(255, { message: "L'email doit faire moins de 255 caractères" }),
    password: z.string().min(8, { message: "Le mot de passe doit faire au moins 8 caractères" }).max(100, { message: "Le mot de passe doit faire moins de 100 caractères" })
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate inputs
      const validationResult = authSchema.safeParse({ email, password });
      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        toast({
          title: "Erreur de validation",
          description: firstError.message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: validationResult.data.email,
        password: validationResult.data.password,
      });

      if (error) throw error;

      // Récupérer TOUS les rôles de l'utilisateur
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id);

      // Déterminer la page de destination selon le rôle
      let destination = "/dashboard"; // Par défaut pour les utilisateurs standards

      if (roles && roles.length > 0) {
        // Hiérarchie des rôles: president > admin > autres
        const roleHierarchy: AppRole[] = ['president', 'admin', 'dgss', 'dgr', 'cabinet_private', 'sec_gen', 'minister', 'protocol', 'courrier', 'reception', 'user'];
        const userRoles = roles.map(r => r.role as AppRole);
        
        // Trouver le rôle le plus élevé dans la hiérarchie
        const userRole = roleHierarchy.find(role => userRoles.includes(role)) || 'user';

        switch (userRole) {
          case 'president':
            destination = "/president-space";
            break;
          case 'admin':
            destination = "/admin-space";
            break;
          case 'dgss':
            destination = "/dgss-space";
            break;
          case 'dgr':
            destination = "/cabinet-director-space";
            break;
          case 'minister':
            destination = "/protocol-director-space";
            break;
          case 'cabinet_private':
            destination = "/private-cabinet-director-space";
            break;
          case 'sec_gen':
            destination = "/secretariat-general-space";
            break;
          case 'courrier':
            destination = "/service-courriers-space";
            break;
          case 'reception':
            destination = "/service-reception-space";
            break;
          case 'protocol':
            destination = "/protocol-director-space";
            break;
          case 'user':
            destination = "/dashboard";
            break;
          default:
            destination = "/dashboard";
            break;
        }
      }

      toast({
        title: "Connexion réussie",
        description: "Bienvenue dans l'application Présidence",
      });

      // Redirection directe selon le rôle
      navigate(destination, { replace: true });
    } catch (error: any) {
      toast({
        title: "Erreur de connexion",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInitializeDemoAccounts = async () => {
    setInitializingDemo(true);

    try {
      console.log('🚀 Initialisation des comptes de démonstration...');

      const { data, error } = await supabase.functions.invoke('initialize-demo-accounts');

      if (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        throw error;
      }

      console.log('✅ Réponse reçue:', data);

      toast({
        title: "Comptes initialisés",
        description: `${data.results.created.length} comptes créés, ${data.results.existing.length} existants. Utilisez president@presidence.ga / President2025!`,
      });

      // Pré-remplir les identifiants du président
      setEmail("president@presidence.ga");
      setPassword("President2025!");

    } catch (error: any) {
      console.error('❌ Erreur complète:', error);
      toast({
        title: "Erreur d'initialisation",
        description: error.message || "Impossible d'initialiser les comptes",
        variant: "destructive",
      });
    } finally {
      setInitializingDemo(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary/90 to-secondary p-4">
      {/* Back Button */}
      <Button
        variant="ghost"
        className="fixed top-6 left-6 text-white hover:bg-white/10 z-50"
        onClick={() => navigate("/")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Retour à l'accueil
      </Button>

      <div className="w-full max-w-md">
        {/* Header with Republic emblem */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white p-2 mb-4 shadow-xl">
            <img
              src={emblemGabon}
              alt="Emblème de la République Gabonaise"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            PRÉSIDENCE DE LA RÉPUBLIQUE
          </h1>
          <p className="text-primary-foreground/80">
            République Gabonaise
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-elegant">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Connexion Sécurisée</CardTitle>
            <CardDescription className="text-center">
              Accès réservé aux membres autorisés
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Adresse email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre.email@presidence.ga"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full gradient-primary"
                disabled={loading}
                onMouseEnter={() => {
                  // Précharger les données des deux destinations possibles
                  prefetchPresidentSpace();
                  prefetchDashboard();
                }}
              >
                {loading ? "Connexion..." : "Se connecter"}
              </Button>

              <div className="space-y-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  onClick={handleInitializeDemoAccounts}
                  disabled={initializingDemo}
                >
                  <Users className="mr-2 h-4 w-4" />
                  {initializingDemo ? "Initialisation..." : "Initialiser les comptes de démonstration"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/demo")}
                >
                  Voir les comptes démo
                </Button>
              </div>
            </form>

            <div className="mt-6 pt-6 border-t text-center text-xs text-muted-foreground">
              <p className="flex items-center justify-center gap-1">
                <Lock className="h-3 w-3" />
                Connexion sécurisée et chiffrée
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-primary-foreground/60 mt-6">
          © 2025 Présidence de la République Gabonaise - Tous droits réservés
        </p>
      </div>
    </div>
  );
};

export default Auth;
