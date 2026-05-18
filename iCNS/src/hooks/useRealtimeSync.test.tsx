/**
 * Guide d'utilisation de useRealtimeSync
 * 
 * Ce hook combine React Query avec Supabase Realtime pour synchroniser
 * automatiquement les données avec invalidation du cache.
 * 
 * EXEMPLES D'UTILISATION:
 * 
 * 1. Hook générique pour n'importe quelle table:
 * ```tsx
 * import { useRealtimeSync } from '@/hooks/useRealtimeSync';
 * 
 * function MyComponent() {
 *   useRealtimeSync({
 *     table: 'my_table',
 *     queryKey: ['my-data'],
 *     event: '*', // ou 'INSERT', 'UPDATE', 'DELETE'
 *     enabled: true,
 *   });
 * }
 * ```
 * 
 * 2. Hooks prédéfinis pour les tables principales:
 * ```tsx
 * import { 
 *   useRealtimeNationalKPIs,
 *   useRealtimeSignalements,
 *   useRealtimeOpinionPublique 
 * } from '@/hooks/useRealtimeSync';
 * 
 * function DashboardComponent() {
 *   // Activer la synchronisation temps réel
 *   useRealtimeNationalKPIs();
 *   useRealtimeSignalements();
 *   useRealtimeOpinionPublique();
 *   
 *   // Les données React Query seront automatiquement rafraîchies
 *   const { data } = useNationalKPIs();
 * }
 * ```
 * 
 * 3. Hook combiné pour tout le dashboard:
 * ```tsx
 * import { useRealtimePresidentDashboard } from '@/hooks/useRealtimeSync';
 * 
 * function PresidentSpace() {
 *   // Active toute la synchronisation temps réel du dashboard
 *   useRealtimePresidentDashboard();
 * }
 * ```
 * 
 * 4. Callbacks personnalisés:
 * ```tsx
 * useRealtimeSync({
 *   table: 'signalements',
 *   queryKey: ['signalements'],
 *   onInsert: (payload) => {
 *     console.log('Nouveau signalement:', payload.new);
 *     toast({ title: 'Nouveau signalement reçu!' });
 *   },
 *   onUpdate: (payload) => {
 *     console.log('Signalement mis à jour:', payload.new);
 *   },
 *   onDelete: (payload) => {
 *     console.log('Signalement supprimé:', payload.old);
 *   }
 * });
 * ```
 * 
 * FONCTIONNALITÉS:
 * - ✅ Synchronisation automatique avec Supabase Realtime
 * - ✅ Invalidation intelligente du cache React Query
 * - ✅ Support des événements INSERT, UPDATE, DELETE
 * - ✅ Callbacks personnalisables pour chaque type d'événement
 * - ✅ Nettoyage automatique à la destruction du composant
 * - ✅ Logs détaillés pour le debugging
 * - ✅ Hooks prédéfinis pour les tables courantes
 * 
 * PERFORMANCES:
 * - Les données sont rafraîchies uniquement quand nécessaire
 * - Le cache React Query évite les appels API inutiles
 * - La synchronisation peut être désactivée avec enabled: false
 */

export {};
