import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifyToken, AUTH_COOKIE } from '@/lib/auth';

/**
 * Returns the authenticated user's info decoded from the JWT cookie.
 * The AuthProvider calls this endpoint after mount to hydrate its context.
 */
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;

  if (!token) {
    return NextResponse.json({ user: null });
  }

  const payload = await verifyToken(token);

  if (!payload) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({
    user: {
      id: payload.userId,
      email: payload.email,
    },
  });
}
