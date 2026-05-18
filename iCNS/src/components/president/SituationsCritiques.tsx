import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Eye, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from 'zod';

const decisionSchema = z.object({
  motif: z.string()
    .trim()
    .min(5, 'Le motif doit contenir au moins 5 caractères')
    .max(500, 'Le motif ne peut pas dépasser 500 caractères'),
  decisionType: z.enum(['approuver_enquete', 'priorite_zero']),
});

export const SituationsCritiques = () => {
  const [signalements, setSignalements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchCriticalCases();
  }, []);

  const fetchCriticalCases = async () => {
    try {
      // Filtres d'inclusion côté serveur : montant > 2B, hauts fonctionnaires, score IA > 90, priorité zéro
      const { data } = await supabase
        .from('signalements')
        .select('*')
        .or('montant_fcfa.gte.2000000000,implique_haut_fonctionnaire.eq.true,score_priorite_ia.gte.90,statut.eq.priorite_zero')
        .order('score_priorite_ia', { ascending: false })
        .limit(10);
      
      setSignalements(data || []);
    } catch (error) {
      console.error("Error fetching critical cases:", error);
    } finally {
      setLoading(false);
    }
  };

  const enregistrerDecision = async (signalementId: string, decisionType: string) => {
    const motif = `Décision présidentielle sur cas critique`;
    
    // Validation avec zod
    try {
      decisionSchema.parse({ motif, decisionType });
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

      const { error } = await supabase
        .from('presidential_decisions')
        .insert({
          signalement_id: signalementId,
          decision_type: decisionType,
          president_user_id: user.id,
          motif,
        });

      if (error) throw error;

      // Mettre à jour le statut du signalement
      await supabase
        .from('signalements')
        .update({ 
          statut: decisionType === 'approuver_enquete' ? 'en_enquete' : 'priorite_zero'
        })
        .eq('id', signalementId);

      toast({
        title: "Décision enregistrée",
        description: "Votre décision présidentielle a été enregistrée avec succès.",
      });

      fetchCriticalCases();
    } catch (error) {
      console.error("Error recording decision:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer la décision",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Chargement des situations critiques...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="border-destructive/20 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Salle de Décision Présidentielle
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {signalements.length} cas nécessitant votre arbitrage personnel
          </p>
        </CardHeader>
      </Card>

      {signalements.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
            <p className="text-muted-foreground">Aucun cas critique ne nécessite votre arbitrage actuellement</p>
          </CardContent>
        </Card>
      ) : (
        signalements.map((cas) => (
          <Card key={cas.id} className="border-destructive/20">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{cas.code}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{cas.titre}</p>
                </div>
                <Badge variant={cas.statut === 'priorite_zero' ? 'destructive' : 'default'}>
                  {cas.statut}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Détails du Cas */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Montant :</span>
                  <span className="ml-2 font-semibold">
                    {(cas.montant_fcfa / 1000000000).toFixed(2)}B FCFA
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Score Priorité IA :</span>
                  <span className="ml-2 font-semibold text-destructive">{cas.score_priorite_ia}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Province :</span>
                  <span className="ml-2">{cas.province}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Secteur :</span>
                  <span className="ml-2">{cas.secteur}</span>
                </div>
                {cas.implique_haut_fonctionnaire && (
                  <div className="col-span-2">
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Haut Fonctionnaire : {cas.grade_fonctionnaire}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Analyse IA */}
              {cas.analyse_ia && (
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm font-semibold mb-1">Analyse IA :</p>
                  <p className="text-sm text-muted-foreground">{cas.analyse_ia}</p>
                </div>
              )}

              {/* Recommandation IA */}
              {cas.recommandation_ia && (
                <div className="bg-primary/10 p-3 rounded-lg border border-primary/20">
                  <p className="text-sm font-semibold mb-1">Recommandation :</p>
                  <p className="text-sm">{cas.recommandation_ia}</p>
                </div>
              )}

              {/* Boutons d'Action Présidentielle */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={() => enregistrerDecision(cas.id, 'approuver_enquete')}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approuver Enquête
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => enregistrerDecision(cas.id, 'ordonner_investigation')}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Ordonner Investigation
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => enregistrerDecision(cas.id, 'consulter_dossier')}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Consulter Dossier
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};
