import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Shield, Lock } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from 'zod';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const xr7Schema = z.object({
  motif: z.string()
    .trim()
    .min(5, 'Le motif doit contenir au moins 5 caractères')
    .max(500, 'Le motif ne peut pas dépasser 500 caractères'),
  pinCode: z.string().length(4, 'Le code PIN doit contenir 4 chiffres'),
});

export const ModuleXR7 = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pinCode, setPinCode] = useState("");
  const [selectedCase, setSelectedCase] = useState("");
  const [motif, setMotif] = useState("");
  const { toast } = useToast();

  const activerProtocoleXR7 = async () => {
    // Validation avec zod
    try {
      xr7Schema.parse({ motif, pinCode });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Erreur de validation",
          description: error.errors[0].message,
          variant: "destructive"
        });
        return;
      }
    }

    // Validation du code PIN (dans un vrai système, ce serait plus sécurisé)
    if (pinCode !== "2417") {
      toast({
        title: "Code PIN invalide",
        description: "L'authentification a échoué",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Erreur",
          description: "Session expirée",
          variant: "destructive"
        });
        return;
      }

      // Enregistrer la décision XR-7
      const { error } = await supabase
        .from('presidential_decisions')
        .insert({
          signalement_id: selectedCase || null,
          decision_type: 'protocole_xr7',
          president_user_id: user.id,
          motif: motif,
          decision_data: {
            activated_at: new Date().toISOString(),
            protocol: 'XR-7',
            level: 'CRITICAL'
          }
        });

      if (error) throw error;

      toast({
        title: "⚠️ PROTOCOLE XR-7 ACTIVÉ",
        description: "Le protocole d'état d'urgence a été enregistré dans l'audit trail présidentiel.",
        variant: "destructive"
      });

      setIsDialogOpen(false);
      setPinCode("");
      setSelectedCase("");
      setMotif("");
    } catch (error) {
      console.error("Error activating XR-7:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'activer le protocole XR-7",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <Card className="border-destructive bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Shield className="h-6 w-6" />
            MODULE XR-7 - PROTOCOLE D'ÉTAT
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Autorité Suprême | Activation Présidentielle Uniquement
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20">
            <p className="text-sm font-semibold mb-2">⚠️ PROTOCOLE D'URGENCE NATIONALE</p>
            <p className="text-sm text-muted-foreground">
              Ce module permet au Président d'activer des protocoles d'urgence sur un cas spécifique :
            </p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
              <li>Gel immédiat des avoirs</li>
              <li>Suspension d'un haut fonctionnaire</li>
              <li>Autorisation d'investigation spéciale</li>
              <li>Déploiement de la Cellule de Crise</li>
            </ul>
          </div>

          <Button 
            variant="destructive" 
            className="w-full"
            size="lg"
            onClick={() => setIsDialogOpen(true)}
          >
            <AlertTriangle className="h-5 w-5 mr-2" />
            ACTIVER LE PROTOCOLE XR-7
          </Button>

          <div className="text-xs text-muted-foreground text-center">
            <Lock className="h-3 w-3 inline mr-1" />
            Authentification biométrique requise | Audit trail présidentiel
          </div>
        </CardContent>
      </Card>

      {/* Dialog de confirmation avec PIN */}
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Activation du Protocole XR-7
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est <strong>irréversible</strong> et sera enregistrée dans l'audit trail présidentiel. 
              Veuillez confirmer avec votre code PIN.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Code cas (optionnel)</label>
              <Input 
                placeholder="Ex: SIG-2025-014"
                value={selectedCase}
                onChange={(e) => setSelectedCase(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Motif de l'activation</label>
              <Textarea 
                placeholder="Décrivez la raison de l'activation du protocole XR-7..."
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Code PIN Présidentiel</label>
              <Input 
                type="password"
                placeholder="****"
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                maxLength={4}
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setPinCode("");
              setSelectedCase("");
              setMotif("");
            }}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={activerProtocoleXR7}
              className="bg-destructive hover:bg-destructive/90"
            >
              Confirmer l'Activation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
