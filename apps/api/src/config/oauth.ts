import type { OAuthConfig } from '../types/index.ts';

// OAuth provider configurations
export const oauthConfigs: Record<string, OAuthConfig> = {
  discord: {
    clientId: Deno.env.get('DISCORD_CLIENT_ID') || '',
    clientSecret: Deno.env.get('DISCORD_CLIENT_SECRET') || '',
    redirectUri: Deno.env.get('DISCORD_REDIRECT_URI') ||
      'http://localhost:8000/api/oauth/discord/callback',
    scope: 'identify email',
    authorizationUrl: 'https://discord.com/api/oauth2/authorize',
    tokenUrl: 'https://discord.com/api/oauth2/token',
    userInfoUrl: 'https://discord.com/api/users/@me',
  },
  google: {
    clientId: Deno.env.get('GOOGLE_CLIENT_ID') || '',
    clientSecret: Deno.env.get('GOOGLE_CLIENT_SECRET') || '',
    redirectUri: Deno.env.get('GOOGLE_REDIRECT_URI') ||
      'http://localhost:8000/api/auth/google/callback',
    scope: 'openid email profile',
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
  },
  facebook: {
    clientId: Deno.env.get('FACEBOOK_CLIENT_ID') || '',
    clientSecret: Deno.env.get('FACEBOOK_CLIENT_SECRET') || '',
    redirectUri: Deno.env.get('FACEBOOK_REDIRECT_URI') ||
      'http://localhost:8000/api/auth/facebook/callback',
    scope: 'email public_profile',
    authorizationUrl: 'https://www.facebook.com/v12.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v12.0/oauth/access_token',
    userInfoUrl: 'https://graph.facebook.com/me?fields=id,name,email,picture',
  },
  apple: {
    clientId: Deno.env.get('APPLE_CLIENT_ID') || '',
    clientSecret: Deno.env.get('APPLE_CLIENT_SECRET') || '',
    redirectUri: Deno.env.get('APPLE_REDIRECT_URI') ||
      'http://localhost:8000/api/auth/apple/callback',
    scope: 'name email',
    authorizationUrl: 'https://appleid.apple.com/auth/authorize',
    tokenUrl: 'https://appleid.apple.com/auth/token',
    userInfoUrl: 'https://appleid.apple.com/auth/userinfo',
  },
};

// Generate OAuth authorization URL
export function getAuthorizationUrl(provider: string, state: string): string {
  const config = oauthConfigs[provider];
  if (!config) {
    throw new Error(`Unsupported OAuth provider: ${provider}`);
  }

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: config.scope,
    state: state,
  });

  return `${config.authorizationUrl}?${params.toString()}`;
}

// Validate OAuth provider
export function isValidOAuthProvider(provider: string): boolean {
  return provider in oauthConfigs;
}

// Get OAuth provider config
export function getOAuthConfig(provider: string): OAuthConfig {
  const config = oauthConfigs[provider];
  if (!config) {
    throw new Error(`Unsupported OAuth provider: ${provider}`);
  }
  return config;
}
