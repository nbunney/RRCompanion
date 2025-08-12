import { create, verify } from 'jwt';
import { compare, hash } from 'bcrypt';
import type { JWTPayload, User } from '../types/index.ts';

const JWT_SECRET = Deno.env.get('JWT_SECRET') || 'fallback-secret';
const JWT_EXPIRES_IN = Deno.env.get('JWT_EXPIRES_IN') || '7d';

// Convert days to seconds
function daysToSeconds(days: string): number {
  return parseInt(days) * 24 * 60 * 60;
}

// Generate JWT token
export async function generateToken(user: User): Promise<string> {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    iat: Date.now() / 1000,
    exp: Date.now() / 1000 + daysToSeconds(JWT_EXPIRES_IN),
  };

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  return await create({ alg: 'HS256', typ: 'JWT' }, payload as any, key);
}

// Verify JWT token
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    );

    const payload = await verify(token, key);
    return payload as unknown as JWTPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return await hash(password);
}

// Compare password with hash
export async function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return await compare(password, hash);
}

// Extract token from Authorization header
export function extractToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate password strength
export function isValidPassword(password: string): boolean {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
}

// Get user from context (used in middleware)
export async function getUserFromContext(ctx: any): Promise<any> {
  const authHeader = ctx.request.headers.get('authorization');
  const token = extractToken(authHeader);

  if (!token) {
    return null;
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return null;
  }

  // Get user from database
  const client = await import('../config/database.ts').then(m => m.client);
  const userResult = await client.query(
    'SELECT id, email, name, oauth_provider, oauth_id, avatar_url, created_at, updated_at, admin FROM users WHERE id = ?',
    [payload.userId]
  );

  return userResult.length > 0 ? userResult[0] : null;
}
