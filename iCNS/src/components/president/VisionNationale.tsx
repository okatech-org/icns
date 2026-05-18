import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const VisionNationale = () => {
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const fetchInstitutions = async () => {
    try {
      const { data } = await supabase
        .from('institution_performance')
        .select('*')
        .order('score_performance', { ascending: false });
      
      setInstitutions(data || []);
    } catch (error) {
      console.error("Error fetching institutions:", error);
    } finally {
      setLoading(false);
    }
  };

  const genererRapport = async (type: string) => {
    toast({
      title: "Génération du rapport",
      description: `Le rapport ${type} est en cours de génération...`,
    });
  };

  const piliers = [
    { nom: "Transparence Administrative", score: 78 },
    { nom: "Justice Accessible", score: 62 },
    { nom: "Lutte Anti-Corruption", score: 85 },
    { nom: "Éthique Publique", score: 71 },
  ];

  if (loading) {
    return <div className="text-center py-8">Chargement des données...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Suivi des Piliers Stratégiques */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>Piliers Stratégiques du Gabon Émergent 2025</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {piliers.map((pilier, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">{pilier.nom}</span>
                  <span className="text-sm font-bold">{pilier.score}/100</span>
                </div>
                <Progress value={pilier.score} className="h-3" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance des Institutions - Le "Conseil des Ministres Numérique" */}
      <Card>
        <CardHeader>
          <CardTitle>Performance des Institutions</CardTitle>
          <p className="text-sm text-muted-foreground">
            Tableau de bord du Conseil des Ministres
          </p>
        </CardHeader>
        <CardContent>
          {institutions.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              Aucune donnée disponible
            </p>
          ) : (
            <div className="space-y-4">
              {institutions.map((institution) => (
                <div key={institution.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">{institution.institution_name}</p>
                      {institution.ministere && (
                        <p className="text-sm text-muted-foreground">{institution.ministere}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{institution.score_performance}/100</p>
                      <p className="text-xs text-muted-foreground">{institution.cas_traites} cas traités</p>
                    </div>
                  </div>
                  <Progress value={institution.score_performance} className="h-2" />
                  <div className="mt-2 text-sm">
                    <span className="text-muted-foreground">Taux de résolution : </span>
                    <span className="font-semibold">{institution.taux_resolution}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Synthèse & Rapport Officiel */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Rapports Officiels de la Présidence
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Générez le rapport officiel de la Présidence sur l'état de la lutte anti-corruption, 
            utilisable pour les communications au Parlement ou à la Nation.
          </p>
          <div className="flex gap-2">
            <Button 
              variant="default" 
              className="flex-1"
              onClick={() => genererRapport('mensuel')}
            >
              <Download className="h-4 w-4 mr-2" />
              Rapport Mensuel
            </Button>
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => genererRapport('trimestriel')}
            >
              <Download className="h-4 w-4 mr-2" />
              Rapport Trimestriel
            </Button>
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => genererRapport('annuel')}
            >
              <Download className="h-4 w-4 mr-2" />
              Rapport Annuel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
