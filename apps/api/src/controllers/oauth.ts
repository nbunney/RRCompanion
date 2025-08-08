import { Context } from 'oak';
import type { ApiResponse } from '../types/index.ts';

// Stubbed OAuth providers - returns mock data
export async function getOAuthProviders(ctx: Context): Promise<void> {
  try {
    const providers = [
      {
        name: 'discord',
        displayName: 'Discord',
        color: '#5865F2',
        icon: '🎮',
        enabled: false, // Disabled for now
      },
      {
        name: 'google',
        displayName: 'Google',
        color: '#4285F4',
        icon: '🔍',
        enabled: false, // Disabled for now
      },
      {
        name: 'facebook',
        displayName: 'Facebook',
        color: '#1877F2',
        icon: '📘',
        enabled: false, // Disabled for now
      },
      {
        name: 'apple',
        displayName: 'Apple',
        color: '#000000',
        icon: '🍎',
        enabled: false, // Disabled for now
      },
    ];

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: providers,
    } as ApiResponse;
  } catch (error) {
    console.error('Get OAuth providers error:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: 'Failed to get OAuth providers',
    } as ApiResponse;
  }
}

// Stubbed OAuth initiation - returns mock response
export async function initiateOAuth(ctx: Context): Promise<void> {
  try {
    const provider = (ctx as any).params?.provider;

    ctx.response.status = 200;
    ctx.response.body = {
      success: false,
      error: `OAuth is currently disabled. Provider: ${provider}`,
    } as ApiResponse;
  } catch (error) {
    console.error('OAuth initiation error:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: 'Failed to initiate OAuth flow',
    } as ApiResponse;
  }
}

// Stubbed OAuth callback - returns mock response
export async function handleOAuthCallback(ctx: Context): Promise<void> {
  try {
    const provider = (ctx as any).params?.provider;

    ctx.response.status = 200;
    ctx.response.body = {
      success: false,
      error: `OAuth is currently disabled. Provider: ${provider}`,
    } as ApiResponse;
  } catch (error) {
    console.error('OAuth callback error:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: 'Failed to handle OAuth callback',
    } as ApiResponse;
  }
}
