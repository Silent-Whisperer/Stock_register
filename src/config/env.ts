/**
 * Typed client-side environment configuration.
 * Exposes strictly public variables (Supabase URL and anon key).
 * Secret keys and AI keys are never present here.
 */
export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  isProduction: import.meta.env.PROD,
};
