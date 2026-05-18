/**
 * Firebase Auth + Convex integration hook
 * Replaces the Supabase auth pattern throughout the app
 */
import { useState, useEffect, useMemo, createContext, useContext, type ReactNode } from 'react';
import { auth } from '@/integrations/firebase/client';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';

interface AuthContextValue {
  user: FirebaseUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = useMemo(() => ({
    user,
    isLoading,
    isAuthenticated: !!user,
  }), [user, isLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

/**
 * Get current user's Firebase UID
 * Used throughout services as a replacement for supabase.auth.getUser()
 */
export function useCurrentUserId(): string | null {
  const { user } = useAuth();
  return user?.uid ?? null;
}

/**
 * Get user roles from Convex
 */
export function useCurrentUserRoles() {
  const { user } = useAuth();
  const uid = user?.uid ?? 'anonymous';
  const roles = useQuery(api.users.getUserRoles, user ? { firebaseUid: uid } : 'skip');
  return roles ?? [];
}
