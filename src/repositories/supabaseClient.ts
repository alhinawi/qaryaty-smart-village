// ─── Supabase client (loaded only when configured)
// Pages never import this. Only the supabase*Repo files do.
import type { SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL?.trim() ?? '';
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? '';

/** true when the app should talk to Supabase. Otherwise it runs on sample data. */
export const isSupabaseConfigured =
  import.meta.env.VITE_DATA_SOURCE !== 'mock' && url.length > 0 && anonKey.length > 0;

let clientPromise: Promise<SupabaseClient> | null = null;

/** Lazily imports supabase-js so the demo build doesn't download it. */
export function getSupabase(): Promise<SupabaseClient> {
  if (!isSupabaseConfigured) {
    return Promise.reject(new Error('Supabase is not configured'));
  }
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js')
      .then(({ createClient }) =>
        createClient(url, anonKey, {
          auth: { persistSession: true, autoRefreshToken: true, storageKey: 'qaryati_supabase_auth' },
        })
      )
      .catch((error: unknown) => {
        clientPromise = null; // try again next time (e.g. chunk failed offline)
        throw error;
      });
  }
  return clientPromise;
}
