import dotenv from 'dotenv';
dotenv.config();

/**
 * Server runtime configuration interface.
 */
export interface ServerConfig {
  port: number;
  openRouterApiKey: string;
  openRouterModel: string;
  ocrSpaceApiKey: string;
  aiTimeoutMs: number;
  supabaseUrl: string;
  supabaseServiceKey: string;
  supabaseAnonKey: string;
  nodeEnv: string;
}

/**
 * Validated server configuration object loaded from environment variables.
 */
export const serverConfig: ServerConfig = {
  port: parseInt(process.env.PORT || '3001', 10),
  openRouterApiKey: process.env.OPENROUTER_API_KEY || '',
  openRouterModel: process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
  ocrSpaceApiKey: process.env.OCR_SPACE_API_KEY || '',
  aiTimeoutMs: parseInt(process.env.AI_TIMEOUT_MS || '45000', 10),
  supabaseUrl: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
  nodeEnv: process.env.NODE_ENV || 'development',
};
