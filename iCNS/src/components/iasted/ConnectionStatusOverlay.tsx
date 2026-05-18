import React from 'react';
import { Loader2, AlertCircle, CheckCircle2, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ConnectionStatusOverlayProps {
  status: 'connecting' | 'connected' | 'error' | 'disconnected';
  error?: string;
  onRetry?: () => void;
  onClose?: () => void;
}

export const ConnectionStatusOverlay: React.FC<ConnectionStatusOverlayProps> = ({
  status,
  error,
  onRetry,
  onClose,
}) => {
  if (status === 'connected') {
    return null;
  }

  return (
    <div className="absolute inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-6 max-w-md mx-auto p-8">
        {status === 'connecting' && (
          <>
            <div className="relative">
              <Loader2 className="w-16 h-16 text-primary animate-spin" />
              <Mic className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold text-foreground">
                Connexion à iAsted...
              </h3>
              <p className="text-sm text-muted-foreground">
                Initialisation de la connexion vocale
              </p>
            </div>
            <div className="flex gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full bg-primary animate-pulse",
                "animation-delay-0"
              )} />
              <div className={cn(
                "w-2 h-2 rounded-full bg-primary animate-pulse",
                "animation-delay-150"
              )} />
              <div className={cn(
                "w-2 h-2 rounded-full bg-primary animate-pulse",
                "animation-delay-300"
              )} />
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold text-foreground">
                Erreur de connexion
              </h3>
              <p className="text-sm text-muted-foreground">
                {error || "Impossible de se connecter à l'agent vocal. Veuillez réessayer."}
              </p>
            </div>
            <div className="flex gap-3">
              {onRetry && (
                <Button onClick={onRetry} className="gap-2">
                  <Loader2 className="w-4 h-4" />
                  Réessayer
                </Button>
              )}
              {onClose && (
                <Button onClick={onClose} variant="outline">
                  Fermer
                </Button>
              )}
            </div>
          </>
        )}

        {status === 'disconnected' && (
          <>
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <Mic className="w-8 h-8 text-muted-foreground" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold text-foreground">
                Déconnecté
              </h3>
              <p className="text-sm text-muted-foreground">
                La connexion vocale a été interrompue
              </p>
            </div>
            {onRetry && (
              <Button onClick={onRetry} className="gap-2">
                Reconnecter
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
