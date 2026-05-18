import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/integrations/firebase/auth';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { hasIAstedAccess, getRoleContext, SPACE_CONTEXTS, type AppRole, type RoleContext, type SpaceContext } from '@/config/role-contexts';

export interface UserProfile {
    id: string;
    user_id: string;
    gender: 'male' | 'female' | 'other';
    preferred_title: string | null;
    full_name: string | null;
    tone_preference: 'formal' | 'professional';
}

export interface UserContext {
    userId: string | null;
    role: AppRole | null;
    profile: UserProfile | null;
    roleContext: RoleContext | null;
    spaceContext: SpaceContext | null;
    hasIAstedAccess: boolean;
    isLoading: boolean;
}

interface UseUserContextOptions {
    spaceName?: string;
}

/**
 * Hook to get user context (role, profile, permissions)
 * Migrated from Supabase to Firebase Auth + Convex
 */
export function useUserContext(options: UseUserContextOptions = {}): UserContext {
    const { spaceName } = options;
    const { user: firebaseUser, isLoading: authLoading } = useAuth();

    const uid = firebaseUser?.uid ?? 'anonymous';

    // Fetch user from Convex
    const convexUser = useQuery(
        api.users.getByFirebaseUid,
        firebaseUser ? { firebaseUid: uid } : 'skip'
    );

    // Fetch roles from Convex
    const convexRoles = useQuery(
        api.users.getUserRoles,
        firebaseUser ? { firebaseUid: uid } : 'skip'
    );

    // Determine primary role
    const role = useMemo((): AppRole | null => {
        if (!convexRoles || convexRoles.length === 0) return null;

        const rolePriority: AppRole[] = [
            'president', 'admin', 'dgr', 'cabinet_private',
            'sec_gen', 'dgss', 'protocol', 'minister',
            'courrier', 'reception', 'user'
        ];

        const userRoleStrings = convexRoles.map(r => r.role);
        return rolePriority.find(r => userRoleStrings.includes(r)) || (userRoleStrings[0] as AppRole) || null;
    }, [convexRoles]);

    // Build profile from Convex user
    const profile = useMemo((): UserProfile | null => {
        if (!convexUser || !firebaseUser) return null;
        return {
            id: convexUser._id,
            user_id: firebaseUser.uid,
            gender: (convexUser.gender as 'male' | 'female' | 'other') || 'male',
            preferred_title: convexUser.preferredTitle || null,
            full_name: convexUser.fullName || null,
            tone_preference: (convexUser.tonePreference as 'formal' | 'professional') || 'formal',
        };
    }, [convexUser, firebaseUser]);

    const roleContext = useMemo(() => getRoleContext(role), [role]);
    const spaceContext = useMemo(() => {
        if (!spaceName) return null;
        return SPACE_CONTEXTS[spaceName] || null;
    }, [spaceName]);

    const hasAccess = useMemo(() => hasIAstedAccess(role), [role]);

    const isLoading = authLoading || (firebaseUser !== null && convexRoles === undefined);

    return {
        userId: firebaseUser?.uid || null,
        role,
        profile,
        roleContext,
        spaceContext,
        hasIAstedAccess: hasAccess,
        isLoading,
    };
}
