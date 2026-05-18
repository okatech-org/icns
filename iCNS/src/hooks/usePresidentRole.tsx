import { useMemo } from "react";
import { useAuth } from "@/integrations/firebase/auth";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

export const usePresidentRole = () => {
  const { user, isLoading: authLoading } = useAuth();
  const uid = user?.uid ?? 'anonymous';

  const roles = useQuery(
    api.users.getUserRoles,
    user ? { firebaseUid: uid } : 'skip'
  );

  const loading = authLoading || (user !== null && roles === undefined);

  const { isPresident, isSuperAdmin } = useMemo(() => {
    if (!roles || roles.length === 0) {
      return { isPresident: false, isSuperAdmin: false };
    }

    const roleStrings = roles.map(r => r.role);
    const hasPresidentRole = roleStrings.includes('president');
    const hasAdminRole = roleStrings.includes('admin');

    return {
      isPresident: hasPresidentRole || hasAdminRole,
      isSuperAdmin: hasAdminRole,
    };
  }, [roles]);

  return { isPresident, isSuperAdmin, loading };
};
