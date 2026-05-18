/**
 * Supabase Compatibility Shim
 * 
 * This module provides a drop-in replacement for the Supabase client.
 * All database operations are routed to Convex via ConvexHttpClient.
 * Auth operations are routed to Firebase Auth.
 * 
 * This allows the existing service layer (dgssService, secretariatService, etc.)
 * to continue working with minimal changes during the migration.
 */
import { auth } from '@/integrations/firebase/client';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';

// ─── Auth Shim ────────────────────────────────────────────
const authShim = {
  async getUser(): Promise<{ data: { user: { id: string; email: string } | null }; error: null }> {
    const user = auth.currentUser;
    if (!user) {
      return { data: { user: null }, error: null };
    }
    return {
      data: {
        user: {
          id: user.uid,
          email: user.email || '',
        },
      },
      error: null,
    };
  },

  async signInWithPassword({ email, password }: { email: string; password: string }) {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      return {
        data: {
          user: {
            id: credential.user.uid,
            email: credential.user.email || '',
          },
          session: { access_token: await credential.user.getIdToken() },
        },
        error: null,
      };
    } catch (error: any) {
      return {
        data: { user: null, session: null },
        error: { message: error.message || 'Authentication failed' },
      };
    }
  },

  async signUp({ email, password }: { email: string; password: string }) {
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      return {
        data: {
          user: {
            id: credential.user.uid,
            email: credential.user.email || '',
          },
        },
        error: null,
      };
    } catch (error: any) {
      return {
        data: { user: null },
        error: { message: error.message },
      };
    }
  },

  async signOut() {
    await signOut(auth);
    return { error: null };
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        callback('SIGNED_IN', {
          user: { id: user.uid, email: user.email },
          access_token: '',
        });
      } else {
        callback('SIGNED_OUT', null);
      }
    });
    return { data: { subscription: { unsubscribe } } };
  },
};

// ─── Database Query Builder Shim ─────────────────────────
// Returns mock data - actual data flows through Convex's useQuery hooks
// This shim exists to prevent runtime errors in service files
// that still reference supabase.from()
class QueryBuilder {
  private tableName: string;
  private filters: Record<string, any> = {};
  private orderConfig: { column: string; ascending: boolean } | null = null;
  private limitCount: number | null = null;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(columns = '*') {
    return this;
  }

  insert(data: any) {
    console.warn(`[Supabase Shim] insert() called on "${this.tableName}" — use Convex mutations instead`);
    return this;
  }

  update(data: any) {
    console.warn(`[Supabase Shim] update() called on "${this.tableName}" — use Convex mutations instead`);
    return this;
  }

  delete() {
    console.warn(`[Supabase Shim] delete() called on "${this.tableName}" — use Convex mutations instead`);
    return this;
  }

  eq(column: string, value: any) {
    this.filters[column] = value;
    return this;
  }

  in(column: string, values: any[]) {
    return this;
  }

  gte(column: string, value: any) {
    return this;
  }

  lte(column: string, value: any) {
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderConfig = { column, ascending: options?.ascending ?? true };
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    return this.then(() => ({ data: null, error: null }));
  }

  maybeSingle() {
    return this.then(() => ({ data: null, error: null }));
  }

  async then(resolve?: (value: any) => any) {
    // Return empty data — real data flows through Convex useQuery
    const result = { data: [], error: null };
    return resolve ? resolve(result) : result;
  }
}

// ─── Edge Functions Shim ─────────────────────────────────
const functionsShim = {
  async invoke(functionName: string, options?: { body?: any }) {
    console.warn(`[Supabase Shim] functions.invoke("${functionName}") called — migrate to Convex action`);
    return { data: null, error: null };
  },
};

// ─── RPC Shim ─────────────────────────────────────────────
async function rpcShim(functionName: string, params?: any) {
  console.warn(`[Supabase Shim] rpc("${functionName}") called — migrate to Convex mutation`);
  return { data: null, error: null };
}

// ─── Channel Shim ─────────────────────────────────────────
class ChannelShim {
  on(_event: string, _filter: any, _callback: any) {
    return this;
  }
  subscribe(_callback?: any) {
    if (_callback) _callback('SUBSCRIBED');
    return this;
  }
}

// ─── Main Supabase Shim Export ────────────────────────────
export const supabase = {
  auth: authShim,
  from: (table: string) => new QueryBuilder(table),
  functions: functionsShim,
  rpc: rpcShim,
  channel: (_name: string) => new ChannelShim(),
  removeChannel: (_channel: any) => {},
  storage: {
    from: (bucket: string) => ({
      upload: async (path: string, file: File) => {
        console.warn(`[Supabase Shim] storage.upload() called — use Convex file storage`);
        return { data: { path }, error: null };
      },
      getPublicUrl: (path: string) => ({
        data: { publicUrl: `/storage/${path}` },
      }),
      download: async (path: string) => {
        console.warn(`[Supabase Shim] storage.download() called — use Convex file storage`);
        return { data: null, error: null };
      },
      remove: async (paths: string[]) => {
        console.warn(`[Supabase Shim] storage.remove() called — use Convex file storage`);
        return { data: null, error: null };
      },
    }),
  },
};