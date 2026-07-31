import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * Returns the Supabase auth tokens stored in HTTP-only cookies.
 * The browser Supabase client can't read HTTP-only cookies directly,
 * so the AuthProvider calls this endpoint after mount to hydrate
 * its session from the server-side cookie-based auth.
 */
export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('sb-access-token')?.value ?? null;
  const refreshToken = cookieStore.get('sb-refresh-token')?.value ?? null;

  return NextResponse.json({ accessToken, refreshToken });
}
