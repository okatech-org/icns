import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook pour précharger les données lors du survol des liens
 */
export const usePrefetch = () => {
  const queryClient = useQueryClient();

  /**
   * Précharge les données pour la page Dashboard
   */
  const prefetchDashboard = () => {
    // Pas de données spécifiques à précharger pour le dashboard standard
    console.log("[Prefetch] Dashboard data ready");
  };

  /**
   * Précharge les données pour la page AdminDashboard
   */
  const prefetchAdminDashboard = () => {
    queryClient.prefetchQuery({
      queryKey: ["feedbacks"],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("role_feedback")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        return data || [];
      },
      staleTime: 2 * 60 * 1000,
    });
    console.log("[Prefetch] Admin dashboard data loading...");
  };

  /**
   * Précharge les données pour l'espace Président
   */
  const prefetchPresidentSpace = () => {
    // Précharger les KPIs nationaux
    queryClient.prefetchQuery({
      queryKey: ["national-kpis"],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("national_kpis")
          .select("*")
          .order("date", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        return data;
      },
      staleTime: 5 * 60 * 1000,
    });

    // Précharger les tendances mensuelles
    queryClient.prefetchQuery({
      queryKey: ["monthly-trends", 12],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("national_kpis")
          .select("*")
          .order("date", { ascending: false })
          .limit(12);

        if (error) throw error;
        return (data || []).reverse();
      },
      staleTime: 5 * 60 * 1000,
    });

    // Précharger les signalements
    queryClient.prefetchQuery({
      queryKey: ["signalements"],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("signalements")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        return data || [];
      },
      staleTime: 3 * 60 * 1000,
    });

    // Précharger l'opinion publique
    queryClient.prefetchQuery({
      queryKey: ["opinion-publique"],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("opinion_publique")
          .select("*")
          .order("date", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        return data;
      },
      staleTime: 5 * 60 * 1000,
    });

    console.log("[Prefetch] President space data loading...");
  };

  /**
   * Précharge les données pour la page iAsted
   */
  const prefetchIAsted = () => {
    queryClient.prefetchQuery({
      queryKey: ["iasted-config"],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("iasted_config")
          .select("*")
          .single();

        if (error) throw error;
        return data;
      },
      staleTime: 10 * 60 * 1000,
    });
    console.log("[Prefetch] iAsted config loading...");
  };

  /**
   * Fonction générique pour précharger selon la route
   */
  const prefetchRoute = (route: string) => {
    switch (route) {
      case "/dashboard":
        prefetchDashboard();
        break;
      case "/admin-dashboard":
        prefetchAdminDashboard();
        break;
      case "/president-space":
        prefetchPresidentSpace();
        break;
      case "/iasted":
      case "/iasted-config":
        prefetchIAsted();
        break;
      default:
        console.log(`[Prefetch] No prefetch defined for ${route}`);
    }
  };

  return {
    prefetchDashboard,
    prefetchAdminDashboard,
    prefetchPresidentSpace,
    prefetchIAsted,
    prefetchRoute,
  };
};
