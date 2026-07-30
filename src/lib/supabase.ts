import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// ─── Browser client (for client components) ───
// Uses the public anon key — safe to expose in the browser.
// Row-Level Security on Supabase enforces access control.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function createBrowserClient(): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey);
}

// Singleton for convenience in client components
let _browserClient: SupabaseClient | null = null;

export function getBrowserClient(): SupabaseClient {
  if (!_browserClient) {
    _browserClient = createBrowserClient();
  }
  return _browserClient;
}

