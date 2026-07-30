import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const adminEmail = process.env.ADMIN_EMAIL ?? '';

/**
 * Create a Supabase client scoped to the current request's cookies.
 * This lets us read the logged-in user's session on the server.
 */
export async function createServerClient() {
  const cookieStore = await cookies();

  // Read all Supabase auth tokens from cookies
  const accessToken = cookieStore.get('sb-access-token')?.value;
  const refreshToken = cookieStore.get('sb-refresh-token')?.value;

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : {},
    },
  });

  // If we have tokens in cookies, set the session
  if (accessToken && refreshToken) {
    await client.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }

  return client;
}

export interface SessionUser {
  id: string;
  email: string;
  isAdmin: boolean;
}

/**
 * Get the current authenticated user + admin status.
 * Returns null if not logged in.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const client = await createServerClient();
  const { data: { user }, error } = await client.auth.getUser();

  if (error || !user || !user.email) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    isAdmin: user.email.toLowerCase() === adminEmail.toLowerCase(),
  };
}
