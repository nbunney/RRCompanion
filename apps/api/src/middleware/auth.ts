import { Context, Next } from 'oak';
import { extractToken, verifyToken } from '../utils/auth.ts';
import { client } from '../config/database.ts';
import type { AuthenticatedContext, User } from '../types/index.ts';

// Extend Context to include user
declare module 'oak' {
  interface Context {
    user?: User;
  }
}

// Authentication middleware
export async function authMiddleware(
  ctx: Context,
  next: Next,
): Promise<void> {
  try {
    const authHeader = ctx.request.headers.get('Authorization');
    console.log('🔐 Auth middleware - Authorization header:', authHeader ? 'EXISTS' : 'NOT FOUND');

    const token = extractToken(authHeader);
    console.log('🔐 Auth middleware - Extracted token:', token ? 'EXISTS' : 'NOT FOUND');

    if (!token) {
      console.log('🔐 Auth middleware - No token provided, returning 401');
      ctx.response.status = 401;
      ctx.response.body = {
        success: false,
        error: 'No token provided',
      };
      return; // Don't call next() after setting response
    }

    const payload = await verifyToken(token);
    console.log('🔐 Auth middleware - Token verification result:', payload ? 'SUCCESS' : 'FAILED');

    if (!payload) {
      console.log('🔐 Auth middleware - Invalid token, returning 401');
      ctx.response.status = 401;
      ctx.response.body = {
        success: false,
        error: 'Invalid token',
      };
      return; // Don't call next() after setting response
    }

    // Check if token is expired
    if (payload.exp < Date.now() / 1000) {
      console.log('🔐 Auth middleware - Token expired, returning 401');
      ctx.response.status = 401;
      ctx.response.body = {
        success: false,
        error: 'Token expired',
      };
      return; // Don't call next() after setting response
    }

    // Get user from database
    const result = await client.query(
      'SELECT id, email, name, created_at, updated_at, admin FROM users WHERE id = ?',
      [payload.userId]
    );

    if (!result.length) {
      console.log('🔐 Auth middleware - User not found in database, returning 401');
      ctx.response.status = 401;
      ctx.response.body = {
        success: false,
        error: 'User not found',
      };
      return; // Don't call next() after setting response
    }

    console.log('🔐 Auth middleware - Authentication successful for user:', result[0].email);
    ctx.state.user = result[0] as User;
    await next();
  } catch (error) {
    console.error('🔐 Auth middleware error:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: 'Internal server error',
    };
  }
}

// Optional authentication middleware (doesn't fail if no token)
export async function optionalAuthMiddleware(
  ctx: Context,
  next: Next,
): Promise<void> {
  try {
    const authHeader = ctx.request.headers.get('Authorization');
    const token = extractToken(authHeader);

    if (token) {
      const payload = await verifyToken(token);
      if (payload && payload.exp > Date.now() / 1000) {
        const result = await client.query(
          'SELECT id, email, name, created_at, updated_at, admin FROM users WHERE id = ?',
          [payload.userId]
        );

        if (result.length > 0) {
          ctx.state.user = result[0] as User;
        }
      }
    }

    await next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    // Don't fail the request, just continue without user
    await next();
  }
}

// Role-based authorization middleware
export function requireRole(role: string) {
  return async (ctx: Context, next: Next): Promise<void> => {
    if (!ctx.state.user) {
      ctx.response.status = 401;
      ctx.response.body = {
        success: false,
        error: 'Authentication required',
      };
      return; // Don't call next() after setting response
    }

    // Add role checking logic here when you implement roles
    // For now, just allow authenticated users
    await next();
  };
}
