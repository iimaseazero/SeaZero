import { cookies } from 'next/headers';
import { verifyToken, AUTH_COOKIE, type TokenPayload } from '@/lib/auth';

const adminEmail = process.env.ADMIN_EMAIL ?? '';

export interface SessionUser {
  id: string;
  email: string;
  isAdmin: boolean;
}

/**
 * Get the current authenticated user + admin status.
 * Returns null if not logged in or token is invalid.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const payload: TokenPayload | null = await verifyToken(token);

  if (!payload) {
    return null;
  }

  return {
    id: payload.userId,
    email: payload.email,
    isAdmin: payload.email.toLowerCase() === adminEmail.toLowerCase(),
  };
}
