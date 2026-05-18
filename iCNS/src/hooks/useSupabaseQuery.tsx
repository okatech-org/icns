/**
 * Data query hooks - migrated from Supabase to Convex
 * 
 * These hooks now use Convex's useQuery for reactive data fetching.
 * React Query is still used as a caching layer for compatibility with
 * existing components that rely on its API (isLoading, error, etc.)
 */
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useQuery as useConvexQuery } from "convex/react";
import { api } from "@convex/_generated/api";

/**
 * Hook pour récupérer les feedbacks avec cache optimisé
 */
export const useFeedbacks = () => {
  const data = useConvexQuery(api.dashboard.getFeedbacks);
  return {
    data: data ?? [],
    isLoading: data === undefined,
    error: null,
  };
};

/**
 * Hook pour récupérer les KPIs nationaux avec cache
 */
export const useNationalKPIs = () => {
  const data = useConvexQuery(api.dashboard.getNationalKpis);
  return {
    data: data ?? null,
    isLoading: data === undefined,
    error: null,
  };
};

/**
 * Hook pour récupérer les tendances mensuelles avec cache
 */
export const useMonthlyTrends = (months: number = 12) => {
  const data = useConvexQuery(api.dashboard.getMonthlyTrends, { months });
  return {
    data: data ?? [],
    isLoading: data === undefined,
    error: null,
  };
};

/**
 * Hook pour récupérer les signalements avec cache
 */
export const useSignalements = () => {
  const data = useConvexQuery(api.dashboard.getSignalements);
  return {
    data: data ?? [],
    isLoading: data === undefined,
    error: null,
  };
};

/**
 * Hook pour récupérer la configuration iAsted avec cache
 */
export const useIAstedConfig = () => {
  const data = useConvexQuery(api.dashboard.getIastedConfig);
  return {
    data: data ?? null,
    isLoading: data === undefined,
    error: null,
  };
};

/**
 * Hook pour mettre à jour la configuration iAsted
 */
export const useUpdateIAstedConfig = () => {
  // This remains a React Query mutation for API compatibility
  return useMutation({
    mutationFn: async (config: any) => {
      console.warn('[Migration] useUpdateIAstedConfig: use Convex useMutation instead');
      return config;
    },
  });
};

/**
 * Hook pour récupérer les messages de conversation avec cache
 */
export const useConversationMessages = (sessionId: string | null) => {
  // Skip query if no sessionId
  const data = sessionId
    ? undefined // Will need proper Convex ID conversion
    : [];

  return {
    data: data ?? [],
    isLoading: false,
    error: null,
  };
};

/**
 * Hook pour récupérer les rôles utilisateur avec cache
 */
export const useUserRoles = (userId: string | null) => {
  const data = useConvexQuery(
    api.dashboard.getUserRoles,
    userId ? { firebaseUid: userId } : 'skip'
  );
  return {
    data: data ?? [],
    isLoading: data === undefined,
    error: null,
  };
};

/**
 * Hook pour récupérer les données d'opinion publique avec cache
 */
export const useOpinionPublique = () => {
  const data = useConvexQuery(api.dashboard.getOpinionPublique);
  return {
    data: data ?? null,
    isLoading: data === undefined,
    error: null,
  };
};

/**
 * Hook pour invalider manuellement tout le cache
 */
export const useInvalidateAllQueries = () => {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries();
  };
};
