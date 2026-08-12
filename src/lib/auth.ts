// Sea Zero — Auth utilities
//
// JWT signing and verification via `jose` (Edge-runtime compatible, works in
// Next.js middleware). Password hashing via `bcryptjs` (pure JS, no native deps).

import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import bcrypt from 'bcryptjs';

// ─── JWT ───

const JWT_SECRET_RAW = process.env.JWT_SECRET ?? 'dev-secret-change-me';
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_RAW);
const JWT_ISSUER = 'sea-zero';
const JWT_EXPIRY = '7d';

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
    .sign(JWT_SECRET);
}

/** Verify a JWT and return its payload, or null if invalid/expired. */
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, { issuer: JWT_ISSUER });
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
