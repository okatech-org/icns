import React from "react";
import { useICNSAuth } from "@/auth/useICNSAuth";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  authReset: boolean;
}

// Reconnaît les erreurs d'auth Convex iCNS qui doivent déclencher un
// nettoyage automatique du store (JWT bidon, session révoquée, etc.).
function isICNSAuthError(error: Error): boolean {
  const msg = error.message ?? "";
  return (
    msg.includes("AuthError") ||
    msg.includes("Header JWT illisible") ||
    msg.includes("jwt_invalide") ||
    msg.includes("jwt_manquant") ||
    msg.includes("session_inconnue") ||
    msg.includes("session_revoquee") ||
    msg.includes("session_expiree") ||
    msg.includes("JWT expiré") ||
    msg.includes("Signature JWT invalide")
  );
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, authReset: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, authReset: false };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("Root error boundary caught: ", error, errorInfo);

    // Si l'erreur vient d'un JWT corrompu ou d'une session côté backend
    // qui n'existe plus, on coupe l'auth iCNS immédiatement plutôt que
    // de laisser l'utilisateur bloqué sur l'écran d'erreur. Au prochain
    // render, la garde de ICNSWorkspace redirigera vers /icns/login.
    if (isICNSAuthError(error)) {
      try {
        useICNSAuth.getState().clearAuth("convex_auth_error");
      } catch {
        // store non monté — rien à faire
      }
      this.setState({ authReset: true });
      // Repli automatique vers la page de login après un court délai.
      setTimeout(() => {
        if (window.location.pathname.startsWith("/icns/")) {
          window.location.replace("/icns/login");
        } else {
          this.setState({ hasError: false, error: undefined, authReset: false });
        }
      }, 800);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleLoginRedirect = () => {
    useICNSAuth.getState().clearAuth("user_initiated_after_error");
    window.location.replace("/icns/login");
  };

  render() {
    if (this.state.hasError) {
      const isAuthErr = this.state.error && isICNSAuthError(this.state.error);
      return (
        <div className="min-h-screen grid place-items-center bg-background px-6">
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {isAuthErr ? "Session iCNS invalide" : "Une erreur est survenue"}
            </h1>
            <p className="text-muted-foreground mb-6">
              {isAuthErr
                ? this.state.authReset
                  ? "Votre session a été réinitialisée — redirection vers l'écran de connexion…"
                  : "Le jeton d'authentification est invalide ou expiré. Reconnectez-vous."
                : "Il semble qu'un module ait échoué à charger. Veuillez réessayer."}
            </p>
            {isAuthErr ? (
              <button
                onClick={this.handleLoginRedirect}
                className="inline-flex items-center justify-center rounded-md px-4 py-2 bg-primary text-primary-foreground hover:opacity-90 transition"
              >
                Aller à la connexion
              </button>
            ) : (
              <button
                onClick={this.handleReload}
                className="inline-flex items-center justify-center rounded-md px-4 py-2 bg-primary text-primary-foreground hover:opacity-90 transition"
              >
                Recharger la page
              </button>
            )}
            {this.state.error && !isAuthErr && (
              <pre className="text-left mt-6 p-3 bg-muted rounded text-xs overflow-auto max-h-60">
                {this.state.error.message}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export const LoadingScreen: React.FC = () => (
  <div className="min-h-screen grid place-items-center bg-background px-6">
    <div className="flex items-center gap-3 text-muted-foreground">
      <span className="inline-block h-3 w-3 rounded-full bg-primary animate-pulse" />
      <span>Chargement…</span>
    </div>
  </div>
);
