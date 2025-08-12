import { Context } from 'oak';
import {
  comparePassword,
  generateToken,
  hashPassword,
  isValidEmail,
  isValidPassword,
} from '../utils/auth.ts';
import { client } from '../config/database.ts';
import type {
  ApiResponse,
  CreateUserRequest,
  LoginRequest,
  User,
  UserResponse,
} from '../types/index.ts';

// Register new user
export async function register(ctx: Context): Promise<void> {
  try {
    const body = await ctx.request.body.json();
    const { email, password, name }: CreateUserRequest = body;

    // Validate input
    if (!email || !password) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: 'Email and password are required',
      } as ApiResponse;
      return;
    }

    if (!isValidEmail(email)) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: 'Invalid email format',
      } as ApiResponse;
      return;
    }

    if (!isValidPassword(password)) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error:
          'Password must be at least 8 characters with uppercase, lowercase, and number',
      } as ApiResponse;
      return;
    }

    try {
      // Check if user already exists
      const existingUser = await client.query(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );

      if (existingUser.length > 0) {
        ctx.response.status = 409;
        ctx.response.body = {
          success: false,
          error: 'User already exists',
        } as ApiResponse;
        return;
      }

      // Hash password and create user
      const passwordHash = await hashPassword(password);
      const insertResult = await client.execute(
        'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
        [email, passwordHash, name || null]
      );

      const result = await client.query(
        'SELECT id, email, name, created_at, updated_at FROM users WHERE id = ?',
        [insertResult.lastInsertId]
      );

      const user = result[0] as User;
      const token = await generateToken(user);

      ctx.response.status = 201;
      ctx.response.body = {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            created_at: user.created_at.toISOString(),
            updated_at: user.updated_at.toISOString(),
          } as UserResponse,
          token,
        },
        message: 'User registered successfully',
      } as ApiResponse;
    } catch (error) {
      console.error('Database error during registration:', error);
      throw error;
    }
  } catch (error) {
    console.error('Registration error:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: 'Internal server error',
    } as ApiResponse;
  }
}

// Login user
export async function login(ctx: Context): Promise<void> {
  try {
    const body = await ctx.request.body.json();
    const { email, password }: LoginRequest = body;

    // Validate input
    if (!email || !password) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: 'Email and password are required',
      } as ApiResponse;
      return;
    }

    try {
      // Get user with password hash
      const result = await client.query(
        'SELECT id, email, password_hash, name, created_at, updated_at, admin FROM users WHERE email = ?',
        [email]
      );

      if (result.length === 0) {
        ctx.response.status = 401;
        ctx.response.body = {
          success: false,
          error: 'Invalid credentials',
        } as ApiResponse;
        return;
      }

      const user = result[0] as any;
      const isValid = await comparePassword(password, user.password_hash);

      if (!isValid) {
        ctx.response.status = 401;
        ctx.response.body = {
          success: false,
          error: 'Invalid credentials',
        } as ApiResponse;
        return;
      }

      const token = await generateToken(user);

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            created_at: user.created_at.toISOString(),
            updated_at: user.updated_at.toISOString(),
            admin: user.admin,
          } as UserResponse,
          token,
        },
        message: 'Login successful',
      } as ApiResponse;
    } catch (error) {
      console.error('Database error during login:', error);
      throw error;
    }
  } catch (error) {
    console.error('Login error:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: 'Internal server error',
    } as ApiResponse;
  }
}

// Get current user profile
export async function getProfile(ctx: Context): Promise<void> {
  try {
    const user = ctx.state.user;
    if (!user) {
      ctx.response.status = 401;
      ctx.response.body = {
        success: false,
        error: 'Authentication required',
      } as ApiResponse;
      return;
    }

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.created_at.toISOString(),
        updated_at: user.updated_at.toISOString(),
        admin: user.admin,
      } as UserResponse,
    } as ApiResponse;
  } catch (error) {
    console.error('Get profile error:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: 'Internal server error',
    } as ApiResponse;
  }
}

// Update user profile
export async function updateProfile(ctx: Context): Promise<void> {
  try {
    const user = ctx.state.user;
    if (!user) {
      ctx.response.status = 401;
      ctx.response.body = {
        success: false,
        error: 'Authentication required',
      } as ApiResponse;
      return;
    }

    const body = await ctx.request.body.json();
    const { name, email }: { name?: string; email?: string } = body;

    try {
      let query = 'UPDATE users SET updated_at = CURRENT_TIMESTAMP';
      const params: any[] = [];

      if (name !== undefined) {
        query += ', name = ?';
        params.push(name);
      }

      if (email !== undefined) {
        if (!isValidEmail(email)) {
          ctx.response.status = 400;
          ctx.response.body = {
            success: false,
            error: 'Invalid email format',
          } as ApiResponse;
          return;
        }

        // Check if email is already taken by another user
        const existingUser = await client.query(
          'SELECT id FROM users WHERE email = ? AND id != ?',
          [email, user.id]
        );

        if (existingUser.length > 0) {
          ctx.response.status = 409;
          ctx.response.body = {
            success: false,
            error: 'Email already taken',
          } as ApiResponse;
          return;
        }

        query += ', email = ?';
        params.push(email);
      }

      query += ' WHERE id = ?';
      params.push(user.id);

      await client.execute(query, ...params);

      // Get updated user
      const result = await client.query(
        'SELECT id, email, name, created_at, updated_at FROM users WHERE id = ?',
        [user.id]
      );

      const updatedUser = result[0] as User;

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        data: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          created_at: updatedUser.created_at.toISOString(),
          updated_at: updatedUser.updated_at.toISOString(),
        } as UserResponse,
        message: 'Profile updated successfully',
      } as ApiResponse;
    } catch (error) {
      console.error('Database error during profile update:', error);
      throw error;
    }
  } catch (error) {
    console.error('Update profile error:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: 'Internal server error',
    } as ApiResponse;
  }
}
