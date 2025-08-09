import { Context } from 'oak';
import type { ApiResponse } from '../types/index.ts';

// Discord OAuth configuration
const DISCORD_CLIENT_ID = Deno.env.get('DISCORD_CLIENT_ID');
const DISCORD_CLIENT_SECRET = Deno.env.get('DISCORD_CLIENT_SECRET');
const DISCORD_REDIRECT_URI = Deno.env.get('DISCORD_REDIRECT_URI') || 'https://rrcompanion.com/api/oauth/discord/callback';

// Debug logging
console.log('🔧 OAuth Configuration Debug:');
console.log(`- DISCORD_CLIENT_ID: ${DISCORD_CLIENT_ID ? 'SET' : 'NOT SET'}`);
console.log(`- DISCORD_CLIENT_SECRET: ${DISCORD_CLIENT_SECRET ? 'SET' : 'NOT SET'}`);
console.log(`- DISCORD_REDIRECT_URI: ${DISCORD_REDIRECT_URI}`);

// OAuth providers configuration
export async function getOAuthProviders(ctx: Context): Promise<void> {
  try {
    // Debug: Check environment variables at runtime
    const discordClientId = Deno.env.get('DISCORD_CLIENT_ID');
    console.log(`🔧 getOAuthProviders - DISCORD_CLIENT_ID: ${discordClientId ? 'SET' : 'NOT SET'}`);
    console.log(`🔧 getOAuthProviders - Discord enabled: ${!!discordClientId}`);

    const providers = [
      {
        name: 'discord',
        displayName: 'Discord',
        color: '#5865F2',
        icon: '🎮',
        enabled: !!discordClientId, // Enable if Discord is configured
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

// Initiate OAuth flow
export async function initiateOAuth(ctx: Context): Promise<void> {
  try {
    const provider = (ctx as any).params?.provider;

    if (provider === 'discord') {
      if (!DISCORD_CLIENT_ID) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: 'Discord OAuth is not configured',
        } as ApiResponse;
        return;
      }

      // Build Discord OAuth URL
      const discordAuthUrl = new URL('https://discord.com/api/oauth2/authorize');
      discordAuthUrl.searchParams.set('client_id', DISCORD_CLIENT_ID);
      discordAuthUrl.searchParams.set('redirect_uri', DISCORD_REDIRECT_URI);
      discordAuthUrl.searchParams.set('response_type', 'code');
      discordAuthUrl.searchParams.set('scope', 'identify email');

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        data: {
          authUrl: discordAuthUrl.toString(),
        },
      } as ApiResponse;
    } else {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: `OAuth provider '${provider}' is not supported`,
      } as ApiResponse;
    }
  } catch (error) {
    console.error('OAuth initiation error:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: 'Failed to initiate OAuth flow',
    } as ApiResponse;
  }
}

// Handle OAuth callback
export async function handleOAuthCallback(ctx: Context): Promise<void> {
  try {
    const provider = (ctx as any).params?.provider;

    if (provider === 'discord') {
      if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: 'Discord OAuth is not configured',
        } as ApiResponse;
        return;
      }

      // Get the authorization code from query parameters
      const url = new URL(ctx.request.url);
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');

      if (error) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: `OAuth error: ${error}`,
        } as ApiResponse;
        return;
      }

      if (!code) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: 'No authorization code provided',
        } as ApiResponse;
        return;
      }

      // Exchange code for access token
      const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: DISCORD_CLIENT_ID,
          client_secret: DISCORD_CLIENT_SECRET,
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: DISCORD_REDIRECT_URI,
        }),
      });

      if (!tokenResponse.ok) {
        console.error('Discord token exchange failed:', await tokenResponse.text());
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: 'Failed to exchange authorization code for token',
        } as ApiResponse;
        return;
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      // Get user information
      const userResponse = await fetch('https://discord.com/api/users/@me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!userResponse.ok) {
        console.error('Discord user info failed:', await userResponse.text());
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: 'Failed to get user information',
        } as ApiResponse;
        return;
      }

      const userData = await userResponse.json();

      // TODO: Create or update user in database
      // For now, just return the user data
      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        data: {
          user: userData,
          accessToken: accessToken,
        },
      } as ApiResponse;
    } else {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: `OAuth provider '${provider}' is not supported`,
      } as ApiResponse;
    }
  } catch (error) {
    console.error('OAuth callback error:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: 'Failed to handle OAuth callback',
    } as ApiResponse;
  }
}

// Handle Discord interactions (for bot commands)
export async function handleDiscordInteractions(ctx: Context): Promise<void> {
  try {
    const body = await ctx.request.body().value;

    // Discord sends a verification request first
    if (body.type === 1) {
      // This is a PING verification request
      ctx.response.status = 200;
      ctx.response.body = {
        type: 1 // PONG response
      };
      return;
    }

    // Handle other interaction types
    console.log('Discord interaction received:', body);

    ctx.response.status = 200;
    ctx.response.body = {
      type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
      data: {
        content: "Hello from RRCompanion bot!"
      }
    };
  } catch (error) {
    console.error('Discord interactions error:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: 'Failed to handle Discord interaction',
    } as ApiResponse;
  }
}
