import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, AUTH_COOKIE } from '@/lib/auth';

const adminEmail = (process.env.ADMIN_EMAIL ?? '').toLowerCase();

// Public routes that don't require authentication
const publicPaths = ['/login'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  const isPublicPath = publicPaths.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );

  // Read the JWT from the cookie
  const token = request.cookies.get(AUTH_COOKIE)?.value;

  // ─── No token: redirect to login (unless already on login page) ───
  if (!token) {
    if (isPublicPath) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // ─── Has token: verify JWT ───
  const payload = await verifyToken(token);

  if (!payload) {
    // Token is invalid/expired — clear cookie and redirect to login
    if (isPublicPath) {
      const response = NextResponse.next();
      response.cookies.delete(AUTH_COOKIE);
      return response;
    }
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete(AUTH_COOKIE);
    return response;
  }

  // ─── Authenticated user on login page → redirect to home ───
  if (isPublicPath) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // ─── Admin route protection ───
  if (pathname.startsWith('/admin')) {
    const userEmail = (payload.email ?? '').toLowerCase();
    if (userEmail !== adminEmail) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

// Run proxy on all routes except static assets and API routes
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
