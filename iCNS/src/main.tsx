import { createRoot } from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { AuthProvider } from "@/integrations/firebase/auth";
import App from "./App.tsx";
import "./index.css";
import { ErrorBoundary } from "./components/ErrorBoundary";

// ── Convex : tolérance aux URLs placeholder du `.env.local` de preview ──
//
// Les instances par défaut (`example.convex.cloud`, `perfect-bullfrog-…`)
// répondent au handshake WebSocket avec un payload qui fait planter
// `ConvexReactClient` (`logFatalError("Couldn't parse deployment name
// example")`). On détecte les marqueurs placeholder pour bipasser la
// connexion réseau — les modules locaux continuent à fonctionner sans
// Convex.
const PLACEHOLDER_MARKERS = ["perfect-bullfrog", "example", "preview", "placeholder"];

function isConvexUrlUsable(url: string): boolean {
  if (!url) return false;
  if (!/^https?:\/\//i.test(url)) return false;
  const lower = url.toLowerCase();
  return !PLACEHOLDER_MARKERS.some((m) => lower.includes(m));
}

const rawConvexUrl = import.meta.env.VITE_CONVEX_URL || "";

let convex: ConvexReactClient;
if (isConvexUrlUsable(rawConvexUrl)) {
  convex = new ConvexReactClient(rawConvexUrl);
} else {
  // eslint-disable-next-line no-console
  console.warn(
    "[Convex] URL placeholder détectée — backend Convex désactivé pour cette preview.",
  );
  // Pointe le client vers un domaine inexistant : la WebSocket boucle en
  // retry de connexion (DNS fail) sans jamais recevoir le payload corrompu
  // qui ferait planter `logFatalError`. Toutes les `useQuery` / `useMutation`
  // restent en "loading" plutôt que de jeter une erreur fatale ou un
  // « ConvexReactClient has already been closed ».
  convex = new ConvexReactClient("https://icns-convex-disabled.invalid");
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <ConvexProvider client={convex}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ConvexProvider>
  </ErrorBoundary>
);
