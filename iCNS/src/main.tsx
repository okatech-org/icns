import { createRoot } from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { AuthProvider } from "@/integrations/firebase/auth";
import App from "./App.tsx";
import "./index.css";
import { ErrorBoundary } from "./components/ErrorBoundary";

const convex = new ConvexReactClient(
  import.meta.env.VITE_CONVEX_URL || ""
);

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <ConvexProvider client={convex}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ConvexProvider>
  </ErrorBoundary>
);
