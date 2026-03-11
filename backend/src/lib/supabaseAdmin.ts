/**
 * Cliente Supabase com service_role para uso exclusivo no backend.
 * Nunca exponha SUPABASE_SERVICE_ROLE_KEY no frontend.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env.js';

let client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!client) {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
    }
    client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return client;
}
