import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { serverConfig } from '../config';

let supabaseClient: SupabaseClient | null = null;

/**
 * Returns a server-side Supabase client instance if configured.
 */
export function getBackendSupabase(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;
  if (!serverConfig.supabaseUrl) return null;

  const key = serverConfig.supabaseServiceKey || serverConfig.supabaseAnonKey;
  if (!key) return null;

  supabaseClient = createClient(serverConfig.supabaseUrl, key, {
    auth: { persistSession: false },
  });
  return supabaseClient;
}
