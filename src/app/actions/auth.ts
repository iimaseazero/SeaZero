'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { d1Query, d1Execute } from '@/lib/d1';
import {
  signToken,
  hashPassword,
  comparePassword,
  AUTH_COOKIE,
  AUTH_COOKIE_MAX_AGE,
} from '@/lib/auth';

// ─── Types ───

export type AuthState = {
  error?: string;
  success?: boolean;
} | undefined;

// ─── ID Generator ───

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ─── Cookie Helpers ───

async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: AUTH_COOKIE_MAX_AGE,
  });
}

async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE);
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

  // Look up user in D1
  const users = await d1Query<{ id: string; email: string; password_hash: string }>(
    'SELECT id, email, password_hash FROM users WHERE email = ?1 COLLATE NOCASE',
    [email.toLowerCase()],
  );

  if (users.length === 0) {
    return { error: 'Invalid email or password.' };
  }

  const user = users[0];

  // Verify password
  const valid = await comparePassword(password, user.password_hash);
  if (!valid) {
    return { error: 'Invalid email or password.' };
  }

  // Sign JWT and set cookie
  const token = await signToken(user.id, user.email);
  await setAuthCookie(token);

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

  // Check if user already exists
  const existing = await d1Query<{ id: string }>(
    'SELECT id FROM users WHERE email = ?1 COLLATE NOCASE',
    [email.toLowerCase()],
  );

  if (existing.length > 0) {
    return { error: 'An account with this email already exists.' };
  }

  // Hash password and create user
  const id = generateId();
  const passwordHash = await hashPassword(password);

  await d1Execute(
    'INSERT INTO users (id, email, password_hash, display_name) VALUES (?1, ?2, ?3, ?4)',
    [id, email.toLowerCase(), passwordHash, name || null],
  );

  // Sign JWT and set cookie
  const token = await signToken(id, email.toLowerCase());
  await setAuthCookie(token);

  redirect('/');
}

// ─── Logout ───

export async function logout() {
  await clearAuthCookie();
  redirect('/login');
}
