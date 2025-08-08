import { client } from '../config/database.ts';
import { generateToken } from '../utils/auth.ts';
import { getOAuthConfig } from '../config/oauth.ts';
import type { OAuthUser, User } from '../types/index.ts';

// Exchange authorization code for access token
async function exchangeCodeForToken(
  provider: string,
  code: string,
): Promise<string> {
  const config = getOAuthConfig(provider);

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: config.redirectUri,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to exchange code for token: ${response.statusText}`,
    );
  }

  const data = await response.json();
  return data.access_token;
}

// Get user info from OAuth provider
async function getUserInfo(
  provider: string,
  accessToken: string,
): Promise<OAuthUser> {
  const config = getOAuthConfig(provider);

  const response = await fetch(config.userInfoUrl, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get user info: ${response.statusText}`);
  }

  const data = await response.json();

  // Normalize user data from different providers
  switch (provider) {
    case 'discord':
      return {
        id: data.id,
        email: data.email,
        name: data.username,
        avatar_url: data.avatar
          ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png`
          : undefined,
        provider: 'discord',
      };
    case 'google':
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        avatar_url: data.picture,
        provider: 'google',
      };
    case 'facebook':
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        avatar_url: data.picture?.data?.url,
        provider: 'facebook',
      };
    case 'apple':
      return {
        id: data.sub,
        email: data.email,
        name: data.name,
        avatar_url: undefined, // Apple doesn't provide avatar
        provider: 'apple',
      };
    default:
      throw new Error(`Unsupported OAuth provider: ${provider}`);
  }
}

// Find or create user from OAuth data
async function findOrCreateOAuthUser(oauthUser: OAuthUser): Promise<User> {
  try {
    // Check if user exists with OAuth provider
    const existingUser = await client.query(
      'SELECT * FROM users WHERE oauth_provider = ? AND oauth_id = ?',
      [oauthUser.provider, oauthUser.id]
    );

    if (existingUser.length > 0) {
      return existingUser[0] as User;
    }

    // Check if user exists with email
    const userWithEmail = await client.query(
      'SELECT * FROM users WHERE email = ?',
      [oauthUser.email]
    );

    if (userWithEmail.length > 0) {
      // Update existing user with OAuth info
      await client.execute(
        `UPDATE users 
         SET oauth_provider = ?, 
             oauth_id = ?, 
             avatar_url = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE email = ?`,
        [oauthUser.provider, oauthUser.id, oauthUser.avatar_url || null, oauthUser.email]
      );

      const updatedUser = await client.query(
        'SELECT * FROM users WHERE email = ?',
        [oauthUser.email]
      );
      return updatedUser[0] as User;
    }

    // Create new user
    const insertResult = await client.execute(
      `INSERT INTO users (email, name, oauth_provider, oauth_id, avatar_url)
       VALUES (?, ?, ?, ?, ?)`,
      [oauthUser.email, oauthUser.name || null, oauthUser.provider, oauthUser.id, oauthUser.avatar_url || null]
    );

    const newUser = await client.query(
      'SELECT * FROM users WHERE id = ?',
      [insertResult.lastInsertId]
    );

    return newUser[0] as User;
  } catch (error) {
    console.error('Error in findOrCreateOAuthUser:', error);
    throw error;
  }
}

// Complete OAuth flow
export async function completeOAuthFlow(
  provider: string,
  code: string,
): Promise<{ user: User; token: string }> {
  try {
    // Exchange code for access token
    const accessToken = await exchangeCodeForToken(provider, code);

    // Get user info from provider
    const oauthUser = await getUserInfo(provider, accessToken);

    // Find or create user in database
    const user = await findOrCreateOAuthUser(oauthUser);

    // Generate JWT token
    const token = await generateToken(user);

    return { user, token };
  } catch (error) {
    console.error(`OAuth flow failed for ${provider}:`, error);
    const errorMessage = error instanceof Error
      ? error.message
      : 'Unknown error';
    throw new Error(`OAuth authentication failed: ${errorMessage}`);
  }
}
