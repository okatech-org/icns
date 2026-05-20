// Helper centralisé : détecte si l'application tourne en « mode démo »,
// c'est-à-dire avec un backend Convex non joignable (URL placeholder dans
// `.env.local`).
//
// En mode démo, les hooks de données (iCorrespondance, iAsted, …) basculent
// sur des stores Zustand locaux pour permettre de naviguer, créer, partager
// et envoyer des éléments sans backend réel.
//
// Synchronisé avec la même heuristique dans `main.tsx`.

const PLACEHOLDER_MARKERS = [
  "perfect-bullfrog",
  "example",
  "preview",
  "placeholder",
  "icns-convex-disabled",
  "localhost.invalid",
];

export function isDemoMode(): boolean {
  const url = (import.meta.env.VITE_CONVEX_URL ?? "").toLowerCase();
  if (!url) return true;
  return PLACEHOLDER_MARKERS.some((m) => url.includes(m));
}
