import { Context } from 'oak';
import { client } from '../config/database.ts';
import { generateToken } from '../utils/auth.ts';
import type { ApiResponse } from '../types/index.ts';

// Discord OAuth configuration - read at runtime
function getDiscordConfig() {
  return {
    clientId: Deno.env.get('DISCORD_CLIENT_ID'),
    clientSecret: Deno.env.get('DISCORD_CLIENT_SECRET'),
    redirectUri: Deno.env.get('DISCORD_REDIRECT_URI') || 'https://rrcompanion.com/api/oauth/discord/callback'
  };
}

// Google OAuth configuration - read at runtime
function getGoogleConfig() {
  return {
    clientId: Deno.env.get('GOOGLE_CLIENT_ID'),
    clientSecret: Deno.env.get('GOOGLE_CLIENT_SECRET'),
    redirectUri: Deno.env.get('GOOGLE_REDIRECT_URI') || 'https://rrcompanion.com/api/oauth/google/callback'
  };
}

// OAuth providers configuration
export async function getOAuthProviders(ctx: Context): Promise<void> {
  try {
    // Debug: Check environment variables at runtime
    const discordConfig = getDiscordConfig();
    const googleConfig = getGoogleConfig();
    console.log(`🔧 getOAuthProviders - DISCORD_CLIENT_ID: ${discordConfig.clientId ? 'SET' : 'NOT SET'}`);
    console.log(`🔧 getOAuthProviders - Discord enabled: ${!!discordConfig.clientId}`);
    console.log(`🔧 getOAuthProviders - GOOGLE_CLIENT_ID: ${googleConfig.clientId ? 'SET' : 'NOT SET'}`);
    console.log(`🔧 getOAuthProviders - Google enabled: ${!!googleConfig.clientId}`);

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
        enabled: !!googleConfig.clientId, // Enable if Google is configured
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
    const googleConfig = getGoogleConfig();
    console.log(`🔧 DISCORD_CLIENT_ID: ${discordConfig.clientId ? 'SET' : 'NOT SET'}`);
    console.log(`🔧 GOOGLE_CLIENT_ID: ${googleConfig.clientId ? 'SET' : 'NOT SET'}`);

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
    } else if (provider === 'google') {
      if (!googleConfig.clientId) {
        console.log('❌ Google OAuth not configured - GOOGLE_CLIENT_ID is missing');
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: 'Google OAuth is not configured',
        } as ApiResponse;
        return;
      }

      // Build Google OAuth URL
      const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      googleAuthUrl.searchParams.set('client_id', googleConfig.clientId);
      googleAuthUrl.searchParams.set('redirect_uri', googleConfig.redirectUri);
      googleAuthUrl.searchParams.set('response_type', 'code');
      googleAuthUrl.searchParams.set('scope', 'openid email profile');

      console.log(`🔧 Generated Google OAuth URL: ${googleAuthUrl.toString()}`);

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        data: {
          authorizationUrl: googleAuthUrl.toString(),
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

      // Create or update user in database
      try {
        // Check if user already exists with this Discord OAuth ID
        const existingOAuthUser = await client.query(
          'SELECT id, email, name, oauth_provider, oauth_id FROM users WHERE oauth_id = ? AND oauth_provider = ?',
          [userData.id, 'discord']
        );

        let user;
        if (existingOAuthUser.length > 0) {
          // User exists with this OAuth ID, update their information
          user = existingOAuthUser[0];
          await client.execute(
            'UPDATE users SET name = ?, avatar_url = ?, updated_at = NOW() WHERE id = ?',
            [userData.global_name || userData.username, `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`, user.id]
          );
        } else {
          // Check if user exists with this email
          const existingEmailUser = await client.query(
            'SELECT id, email, name, oauth_provider, oauth_id FROM users WHERE email = ?',
            [userData.email]
          );

          if (existingEmailUser.length > 0) {
            // User exists with this email, update with OAuth info
            user = existingEmailUser[0];
            await client.execute(
              'UPDATE users SET oauth_provider = ?, oauth_id = ?, name = ?, avatar_url = ?, updated_at = NOW() WHERE id = ?',
              ['discord', userData.id, userData.global_name || userData.username, `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`, user.id]
            );
          } else {
            // Create completely new user
            const insertResult = await client.execute(
              'INSERT INTO users (email, name, oauth_provider, oauth_id, avatar_url) VALUES (?, ?, ?, ?, ?)',
              [
                userData.email,
                userData.global_name || userData.username,
                'discord',
                userData.id,
                `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`
              ]
            );

            const newUser = await client.query(
              'SELECT id, email, name, oauth_provider, oauth_id, avatar_url, created_at, updated_at, admin FROM users WHERE id = ?',
              [insertResult.lastInsertId]
            );
            user = newUser[0];
          }
        }

        // Generate JWT token
        const token = await generateToken(user);
        console.log('🔧 Generated JWT token for user:', user.id);

        // Redirect to frontend with token and user data
        const frontendUrl = new URL('https://rrcompanion.com/oauth/callback');
        frontendUrl.searchParams.set('token', token);
        frontendUrl.searchParams.set('provider', 'discord');
        frontendUrl.searchParams.set('user', JSON.stringify({
          id: user.id,
          email: user.email,
          name: user.name,
          oauth_provider: user.oauth_provider,
          avatar_url: user.avatar_url,
          created_at: user.created_at,
          updated_at: user.updated_at,
          admin: user.admin
        }));

        console.log('🔧 Redirecting to:', frontendUrl.toString());
        ctx.response.status = 302;
        ctx.response.headers.set('Location', frontendUrl.toString());
      } catch (error) {
        console.error('Database error during OAuth login:', error);
        ctx.response.status = 500;
        ctx.response.body = {
          success: false,
          error: 'Failed to create or update user',
        } as ApiResponse;
        return;
      }
    } else if (provider === 'google') {
      const googleConfig = getGoogleConfig();
      if (!googleConfig.clientId || !googleConfig.clientSecret) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: 'Google OAuth is not configured',
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
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: googleConfig.clientId,
          client_secret: googleConfig.clientSecret,
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: googleConfig.redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        console.error('Google token exchange failed:', await tokenResponse.text());
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
      const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!userResponse.ok) {
        console.error('Google user info failed:', await userResponse.text());
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          error: 'Failed to get user information',
        } as ApiResponse;
        return;
      }

      const userData = await userResponse.json();

      // Create or update user in database
      try {
        // Check if user already exists with this Google OAuth ID
        const existingOAuthUser = await client.query(
          'SELECT id, email, name, oauth_provider, oauth_id FROM users WHERE oauth_id = ? AND oauth_provider = ?',
          [userData.id, 'google']
        );

        let user;
        if (existingOAuthUser.length > 0) {
          // User exists with this OAuth ID, update their information
          user = existingOAuthUser[0];
          await client.execute(
            'UPDATE users SET name = ?, avatar_url = ?, updated_at = NOW() WHERE id = ?',
            [userData.name, userData.picture, user.id]
          );
        } else {
          // Check if user exists with this email
          const existingEmailUser = await client.query(
            'SELECT id, email, name, oauth_provider, oauth_id FROM users WHERE email = ?',
            [userData.email]
          );

          if (existingEmailUser.length > 0) {
            // User exists with this email, update with OAuth info
            user = existingEmailUser[0];
            await client.execute(
              'UPDATE users SET oauth_provider = ?, oauth_id = ?, name = ?, avatar_url = ?, updated_at = NOW() WHERE id = ?',
              ['google', userData.id, userData.name, userData.picture, user.id]
            );
          } else {
            // Create completely new user
            const insertResult = await client.execute(
              'INSERT INTO users (email, name, oauth_provider, oauth_id, avatar_url) VALUES (?, ?, ?, ?, ?)',
              [
                userData.email,
                userData.name,
                'google',
                userData.id,
                userData.picture
              ]
            );

            const newUser = await client.query(
              'SELECT id, email, name, oauth_provider, oauth_id, avatar_url, created_at, updated_at, admin FROM users WHERE id = ?',
              [insertResult.lastInsertId]
            );
            user = newUser[0];
          }
        }

        // Generate JWT token
        const token = await generateToken(user);
        console.log('🔧 Generated JWT token for Google user:', user.id);

        // Redirect to frontend with token and user data
        const frontendUrl = new URL('https://rrcompanion.com/oauth/callback');
        frontendUrl.searchParams.set('token', token);
        frontendUrl.searchParams.set('provider', 'google');
        frontendUrl.searchParams.set('user', JSON.stringify({
          id: user.id,
          email: user.email,
          name: user.name,
          oauth_provider: user.oauth_provider,
          avatar_url: user.avatar_url,
          created_at: user.created_at,
          updated_at: user.updated_at,
          admin: user.admin
        }));

        console.log('🔧 Redirecting Google user to:', frontendUrl.toString());
        ctx.response.status = 302;
        ctx.response.headers.set('Location', frontendUrl.toString());
      } catch (error) {
        console.error('Database error during Google OAuth login:', error);
        ctx.response.status = 500;
        ctx.response.body = {
          success: false,
          error: 'Failed to create or update user',
        } as ApiResponse;
        return;
      }
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
