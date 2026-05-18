import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface IastedConfig {
  agentId: string | null;
  presidentVoiceId: string;
  ministerVoiceId: string;
  defaultVoiceId: string;
}

export const useIastedAgent = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState<IastedConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOrCreateAgent();
  }, []);

  const loadOrCreateAgent = async () => {
    try {
      // Charger la configuration existante
      const { data: configData, error: configError } = await supabase
        .from('iasted_config')
        .select('*')
        .single();

      if (configError) throw configError;

      // Si l'agent n'existe pas, on ne bloque pas mais on log
      if (!configData.agent_id) {
        console.warn('No agent ID configured.');
      }

      setConfig({
        agentId: configData.agent_id,
        presidentVoiceId: configData.president_voice_id,
        ministerVoiceId: configData.minister_voice_id,
        defaultVoiceId: configData.default_voice_id,
      });

      setIsLoading(false);
    } catch (error) {
      console.error('Error loading agent:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger l'agent iAsted",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return { config, isLoading };
};
