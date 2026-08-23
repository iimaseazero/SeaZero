// Sea Zero — Auth utilities
//
// JWT signing and verification via `jose` (Edge-runtime compatible, works in
// Next.js middleware). Password hashing via `bcryptjs` (pure JS, no native deps).

import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import bcrypt from 'bcryptjs';

// ─── JWT ───

const DEV_FALLBACK_SECRET = 'dev-secret-change-me';
const JWT_ISSUER = 'sea-zero';
const JWT_EXPIRY = '7d';

let warnedAboutDevSecret = false;

/**
 * Resolve the signing secret, refusing to fall back in production.
 *
 * This used to be `process.env.JWT_SECRET ?? 'dev-secret-change-me'` evaluated
 * at module scope. Deployed without JWT_SECRET set, that signs and trusts
 * tokens against a secret written in the source: anyone who can read the repo
 * can mint a token for any email, including whatever ADMIN_EMAIL is, and walk
 * straight into the admin console.
 *
 * Resolved lazily rather than at module load so a missing variable can never
 * break `next build` — it fails closed at request time instead. verifyToken
 * catches the throw and returns null, so every route redirects to /login
 * rather than admitting anyone.
 */
function getSecret(): Uint8Array {
  const raw = process.env.JWT_SECRET;

  if (raw && raw.length > 0) {
    if (raw === DEV_FALLBACK_SECRET && process.env.NODE_ENV === 'production') {
      throw new Error(
        'JWT_SECRET is set to the development placeholder. Generate a real one: openssl rand -base64 32',
      );
    }
    return new TextEncoder().encode(raw);
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'JWT_SECRET is not set. Authentication is disabled rather than fall back to a public secret. ' +
      'Set it in your hosting provider environment variables (e.g. Vercel > Settings > Environment Variables).',
    );
  }

  if (!warnedAboutDevSecret) {
    warnedAboutDevSecret = true;
    console.warn('[auth] JWT_SECRET not set. Using the development fallback; never deploy this way.');
  }
  return new TextEncoder().encode(DEV_FALLBACK_SECRET);
}

export interface TokenPayload extends JWTPayload {
  userId: string;
  email: string;
}

/** Create a signed JWT for the given user. */
export async function signToken(userId: string, email: string): Promise<string> {
  return new SignJWT({ userId, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(JWT_ISSUER)
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(getSecret());
}

/** Verify a JWT and return its payload, or null if invalid/expired. */
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { issuer: JWT_ISSUER });
    if (typeof payload.userId !== 'string' || typeof payload.email !== 'string') {
      return null;
    }
    return payload as TokenPayload;
  } catch {
    return null;
  }
}

// ─── Passwords ───

const SALT_ROUNDS = 10;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// ─── Cookie helpers ───

export const AUTH_COOKIE = 'auth-token';
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
