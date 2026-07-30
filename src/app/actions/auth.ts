'use server';

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ─── Types ───

export type AuthState = {
  error?: string;
  success?: boolean;
} | undefined;

// ─── Helpers ───

function getClient() {
  return createClient(supabaseUrl, supabaseAnonKey);
}

async function setAuthCookies(accessToken: string, refreshToken: string) {
  const cookieStore = await cookies();
  const maxAge = 60 * 60 * 24 * 7; // 7 days

  cookieStore.set('sb-access-token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  });

  cookieStore.set('sb-refresh-token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  });
}

async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete('sb-access-token');
  cookieStore.delete('sb-refresh-token');
}

// ─── Login ───

export async function login(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const client = getClient();
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  if (!data.session) {
    return { error: 'Failed to create session.' };
  }

  await setAuthCookies(
    data.session.access_token,
    data.session.refresh_token,
  );

  redirect('/');
}

// ─── Register ───

export async function register(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const name = formData.get('name') as string;

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters.' };
  }

  const client = getClient();
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: name || undefined },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Supabase may require email confirmation — in that case, session is null
  if (!data.session) {
    // If email confirmation is disabled, this shouldn't happen.
    // But if it does, show a helpful message.
    return {
      success: true,
      error: undefined,
    };
  }

  await setAuthCookies(
    data.session.access_token,
    data.session.refresh_token,
  );

  redirect('/');
}

// ─── Logout ───

export async function logout() {
  await clearAuthCookies();
  redirect('/login');
}
