import { Context } from 'oak';
import type { ApiResponse } from '../types/index.ts';

// Discord OAuth configuration - read at runtime
function getDiscordConfig() {
  return {
    clientId: Deno.env.get('DISCORD_CLIENT_ID'),
    clientSecret: Deno.env.get('DISCORD_CLIENT_SECRET'),
    redirectUri: Deno.env.get('DISCORD_REDIRECT_URI') || 'https://rrcompanion.com/api/oauth/discord/callback'
  };
}

// OAuth providers configuration
export async function getOAuthProviders(ctx: Context): Promise<void> {
  try {
    // Debug: Check environment variables at runtime
    const discordConfig = getDiscordConfig();
    console.log(`🔧 getOAuthProviders - DISCORD_CLIENT_ID: ${discordConfig.clientId ? 'SET' : 'NOT SET'}`);
    console.log(`🔧 getOAuthProviders - Discord enabled: ${!!discordConfig.clientId}`);

    const providers = [
      {
        name: 'discord',
        displayName: 'Discord',
        color: '#5865F2',
        icon: '🎮',
        enabled: !!discordConfig.clientId, // Enable if Discord is configured
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

    console.log(`🔧 initiateOAuth called for provider: ${provider}`);
    const discordConfig = getDiscordConfig();
    console.log(`🔧 DISCORD_CLIENT_ID: ${discordConfig.clientId ? 'SET' : 'NOT SET'}`);

    if (provider === 'discord') {
      if (!discordConfig.clientId) {
        console.log('❌ Discord OAuth not configured - DISCORD_CLIENT_ID is missing');
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: 'Discord OAuth is not configured',
        } as ApiResponse;
        return;
      }

      // Build Discord OAuth URL
      const discordAuthUrl = new URL('https://discord.com/api/oauth2/authorize');
      discordAuthUrl.searchParams.set('client_id', discordConfig.clientId);
      discordAuthUrl.searchParams.set('redirect_uri', discordConfig.redirectUri);
      discordAuthUrl.searchParams.set('response_type', 'code');
      discordAuthUrl.searchParams.set('scope', 'identify email');

      console.log(`🔧 Generated Discord OAuth URL: ${discordAuthUrl.toString()}`);

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        data: {
          authorizationUrl: discordAuthUrl.toString(),
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
      const discordConfig = getDiscordConfig();
      if (!discordConfig.clientId || !discordConfig.clientSecret) {
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
          client_id: discordConfig.clientId,
          client_secret: discordConfig.clientSecret,
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: discordConfig.redirectUri,
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
    const body = await ctx.request.body.json();

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
