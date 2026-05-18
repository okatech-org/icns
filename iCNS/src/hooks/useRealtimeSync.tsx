/**
 * Realtime Sync Hook - Convex Migration
 * 
 * Convex has built-in reactivity through useQuery(), so these hooks
 * are now no-ops that maintain API compatibility.
 * All data subscriptions happen automatically through Convex's reactive system.
 */

interface UseRealtimeSyncOptions {
  table: string;
  queryKey: string[];
  event?: "INSERT" | "UPDATE" | "DELETE" | "*";
  schema?: string;
  enabled?: boolean;
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
}

/**
 * No-op hook - Convex handles reactivity natively
 */
export const useRealtimeSync = (_options: UseRealtimeSyncOptions) => {
  // Convex useQuery() automatically subscribes to changes
};

export const useRealtimeNationalKPIs = (_enabled = true) => {};
export const useRealtimeSignalements = (_enabled = true) => {};
export const useRealtimeOpinionPublique = (_enabled = true) => {};
export const useRealtimeFeedbacks = (_enabled = true) => {};
export const useRealtimeIAstedConfig = (_enabled = true) => {};
export const useRealtimeConversationMessages = (_sessionId: string | null, _enabled = true) => {};
export const useRealtimePresidentialDecisions = (_enabled = true) => {};
export const useRealtimeUserRoles = (_userId: string | null, _enabled = true) => {};

export const useRealtimePresidentDashboard = (_enabled = true) => {
  // Convex subscriptions are automatic
};

export const useRealtimeAdminDashboard = (_enabled = true) => {
  // Convex subscriptions are automatic
};
