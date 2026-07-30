import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const adminEmail = (process.env.ADMIN_EMAIL ?? '').toLowerCase();

// Public routes that don't require authentication
const publicPaths = ['/login'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  const isPublicPath = publicPaths.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );

  // Read the access token from the cookie
  const accessToken = request.cookies.get('sb-access-token')?.value;
  const refreshToken = request.cookies.get('sb-refresh-token')?.value;

  // ─── No token: redirect to login (unless already on login page) ───
  if (!accessToken) {
    if (isPublicPath) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // ─── Has token: verify it via Supabase ───
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  if (refreshToken) {
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken);

  if (error || !user) {
    // Token is invalid/expired — clear cookies and redirect to login
    if (isPublicPath) {
      const response = NextResponse.next();
      response.cookies.delete('sb-access-token');
      response.cookies.delete('sb-refresh-token');
      return response;
    }
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('sb-access-token');
    response.cookies.delete('sb-refresh-token');
    return response;
  }

  // ─── Authenticated user on login page → redirect to home ───
  if (isPublicPath) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // ─── Admin route protection ───
  if (pathname.startsWith('/admin')) {
    const userEmail = (user.email ?? '').toLowerCase();
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
