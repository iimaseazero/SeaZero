// Sea Zero — API route authorization
//
// The proxy matcher deliberately excludes /api, so route handlers get NO
// authentication from it. Three of them never checked a session themselves,
// which meant that once deployed, anyone on the internet could POST a
// submission for any team, delete teams, or replace the route for the whole
// cohort. These helpers close that gap and keep the check identical everywhere.

import { NextResponse } from 'next/server';
import { getSessionUser, type SessionUser } from '@/lib/session';

/** 401 unless a valid session cookie is present. */
export async function requireUser(): Promise<
  { user: SessionUser; response: null } | { user: null; response: NextResponse }
> {
  const user = await getSessionUser();
  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
    };
  }
  return { user, response: null };
}

/** 401/403 unless the session belongs to ADMIN_EMAIL. */
export async function requireAdmin(): Promise<
  { user: SessionUser; response: null } | { user: null; response: NextResponse }
> {
  const user = await getSessionUser();
  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
    };
  }
  if (!user.isAdmin) {
    return {
      user: null,
      response: NextResponse.json({ error: 'Administrator access required' }, { status: 403 }),
    };
  }
  return { user, response: null };
}
