import React from "react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("Root error boundary caught: ", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen grid place-items-center bg-background px-6">
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">Une erreur est survenue</h1>
            <p className="text-muted-foreground mb-6">
              Il semble qu’un module ait échoué à charger. Veuillez réessayer.
            </p>
            <button
              onClick={this.handleReload}
              className="inline-flex items-center justify-center rounded-md px-4 py-2 bg-primary text-primary-foreground hover:opacity-90 transition"
            >
              Recharger la page
            </button>
            {this.state.error && (
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
