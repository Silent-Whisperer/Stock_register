import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env';

/**
 * Initialized Supabase client instance using client-safe anonymous key.
 */
export const supabase: SupabaseClient = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/**
 * Checks whether the Supabase backend is reachable and responsive.
 * @returns Promise<boolean>
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('products').select('count', { count: 'exact', head: true });
    return !error;
  } catch {
    return false;
  }
}
