import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserContext } from "@/hooks/useUserContext";
import { AlertTriangle } from "lucide-react";

export const OpinionPublique = () => {
  const { role, isLoading: roleLoading } = useUserContext();
  const [opinion, setOpinion] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Vérifier si l'utilisateur a accès (président ou admin uniquement)
  const hasAccess = role === 'president' || role === 'admin';

  const fetchOpinion = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('opinion_publique')
        .select('*')
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      setOpinion(data);
    } catch (error) {
      console.error("Error fetching opinion:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasAccess) {
      fetchOpinion();
    } else if (!roleLoading) {
      setLoading(false);
    }
  }, [hasAccess, roleLoading, fetchOpinion]);

  const preoccupations = useMemo(() => 
    opinion?.preoccupations || [
      { nom: "Corruption", score: 85 },
      { nom: "Pouvoir d'achat", score: 78 },
      { nom: "Emploi des jeunes", score: 72 },
      { nom: "Santé publique", score: 68 },
      { nom: "Éducation", score: 65 }
    ],
    [opinion]
  );

  // Si en cours de chargement du rôle ou des données
  if (roleLoading || loading) {
    return (
      <div className="space-y-4">
        <Card className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </Card>
      </div>
    );
  }

  // Si l'utilisateur n'a pas accès
  if (!hasAccess) {
    return (
      <div className="space-y-4">
        <Card className="p-6 border-destructive/50 bg-destructive/5">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-destructive flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-lg mb-2">Accès restreint</h3>
              <p className="text-muted-foreground">
                Cette section contient des informations d'opinion publique issues de la veille des réseaux sociaux et du web.
              </p>
              <p className="text-muted-foreground mt-2">
                Seuls le <strong>Président de la République</strong> et les <strong>administrateurs système</strong> peuvent consulter ces données sensibles.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Jauge de Satisfaction Globale */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>Satisfaction Globale de la Population</CardTitle>
          <p className="text-sm text-muted-foreground">Confiance dans l'action de la Vème République</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-6xl font-bold text-primary">{opinion?.satisfaction_globale || 67}%</div>
              <p className="text-muted-foreground mt-2">de satisfaction</p>
            </div>
            <Progress value={opinion?.satisfaction_globale || 67} className="h-4" />
          </div>
        </CardContent>
      </Card>

      {/* Analyse de Sentiment */}
      <Card>
        <CardHeader>
          <CardTitle>Répartition des Sentiments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-success">{opinion?.sentiment_satisfaits || 45}%</div>
              <p className="text-sm text-muted-foreground mt-1">Satisfaits</p>
              <Progress value={opinion?.sentiment_satisfaits || 45} className="h-2 mt-2" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-muted-foreground">{opinion?.sentiment_neutres || 33}%</div>
              <p className="text-sm text-muted-foreground mt-1">Neutres</p>
              <Progress value={opinion?.sentiment_neutres || 33} className="h-2 mt-2" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-destructive">{opinion?.sentiment_insatisfaits || 22}%</div>
              <p className="text-sm text-muted-foreground mt-1">Insatisfaits</p>
              <Progress value={opinion?.sentiment_insatisfaits || 22} className="h-2 mt-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Préoccupations Citoyennes (Top 5) */}
      <Card>
        <CardHeader>
          <CardTitle>Préoccupations Citoyennes - Top 5</CardTitle>
          <p className="text-sm text-muted-foreground">
            Classement des griefs de la population
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {preoccupations.map((preoccupation: any, index: number) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">{index + 1}. {preoccupation.nom}</span>
                  <span className="text-sm font-bold">{preoccupation.score}%</span>
                </div>
                <Progress value={preoccupation.score} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Corrélation Signalements / Opinion */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle>Analyse de Corrélation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            <strong>Insight Stratégique :</strong> Les signalements de corruption dans le secteur public 
            représentent 85% des préoccupations citoyennes. L'action rapide sur les cas critiques améliore 
            directement l'indice de satisfaction de +12% en moyenne.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
