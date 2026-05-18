import { useState, useRef } from 'react';
import { Lock, Unlock, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AdminUnlockProps {
  onUnlocked: () => void;
}

export const AdminUnlock = ({ onUnlocked }: AdminUnlockProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const handleLockClick = () => {
    setClickCount(prev => prev + 1);

    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
    }

    clickTimerRef.current = setTimeout(() => {
      setClickCount(0);
    }, 500);

    if (clickCount + 1 === 2) {
      setIsDialogOpen(true);
      setClickCount(0);
    }
  };

  const handleUnlock = async () => {
    if (password.length !== 6) {
      toast({
        title: 'Erreur',
        description: 'Le mot de passe doit contenir exactement 6 chiffres',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: 'Erreur',
          description: 'Vous devez être connecté',
          variant: 'destructive',
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('secure-admin-access', {
        body: { password },
      });

      if (error) {
        throw error;
      }

      toast({
        title: '✅ Accès débloqué',
        description: (data as any)?.message ?? 'Accès admin accordé avec succès',
        duration: 3000,
      });

      setIsDialogOpen(false);
      setPassword('');
      
      // Refresh the page to update role
      setTimeout(() => {
        onUnlocked();
      }, 500);

    } catch (error: any) {
      console.error('Unlock error:', error);
      toast({
        title: 'Erreur de déblocage',
        description: error.message || 'Mot de passe incorrect',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && password.length === 6) {
      handleUnlock();
    }
  };

  return (
    <>
      <button
        onClick={handleLockClick}
        className="fixed bottom-6 left-6 z-50 neu-raised p-4 rounded-full hover:shadow-neo-lg transition-all duration-300 group"
        title="Double-clic pour débloquer l'accès admin"
      >
        <Lock className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
      </button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md neu-card">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="neu-inset p-4 rounded-full">
                <Shield className="w-12 h-12 text-primary" />
              </div>
            </div>
            <DialogTitle className="text-center text-2xl">Déblocage Admin</DialogTitle>
            <DialogDescription className="text-center">
              Entrez le code à 6 chiffres pour déverrouiller l'accès administrateur système
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="● ● ● ● ● ●"
                value={password}
                onChange={(e) => setPassword(e.target.value.replace(/\D/g, ''))}
                onKeyPress={handleKeyPress}
                className="text-center text-2xl tracking-widest neu-inset"
                disabled={isLoading}
                autoFocus
              />
              <p className="text-xs text-muted-foreground text-center">
                Code à 6 chiffres requis
              </p>
            </div>

            <Button
              onClick={handleUnlock}
              disabled={password.length !== 6 || isLoading}
              className="w-full neu-raised hover:shadow-neo-lg"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                  Vérification...
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4 mr-2" />
                  Déverrouiller
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
