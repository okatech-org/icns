/**
 * useIAstedSoul — Hook React qui s'abonne à l'état du singleton iAstedSoul.
 *
 * Permet aux composants UI de réagir au changement de persona, de page,
 * ou de lifecycle (listening/speaking/...). À combiner avec un provider
 * de plus haut niveau (cf. IAstedContext) qui synchronise la route et
 * le rôle utilisateur dans le soul.
 */

import { useEffect, useState } from 'react';
import { iAstedSoul, type SoulState } from '@/lib/iasted/soul';

export function useIAstedSoul(): SoulState {
    const [state, setState] = useState<SoulState>(() => iAstedSoul.getState());

    useEffect(() => {
        const unsubscribe = iAstedSoul.subscribe((s) => setState({ ...s }));
        return unsubscribe;
    }, []);

    return state;
}
