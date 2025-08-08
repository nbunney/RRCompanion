# OAuth Setup Guide

This guide will help you set up OAuth authentication for Discord, Google,
Facebook, and Apple in your RRCompanion application.

## Prerequisites

- A running RRCompanion application
- MariaDB database configured
- Domain name (for production OAuth callbacks)

## Environment Variables

Add these environment variables to your `apps/api/.env` file:

```env
# Database Configuration
DATABASE_URL=mysql://username:password@localhost:3306/rrcompanion
DB_HOST=localhost
DB_PORT=3306
DB_NAME=rrcompanion
DB_USER=root
DB_PASSWORD=password

# OAuth Configuration

# Discord OAuth
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret
DISCORD_REDIRECT_URI=http://localhost:8000/api/auth/discord/callback

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback

# Facebook OAuth
FACEBOOK_CLIENT_ID=your-facebook-client-id
FACEBOOK_CLIENT_SECRET=your-facebook-client-secret
FACEBOOK_REDIRECT_URI=http://localhost:8000/api/auth/facebook/callback

# Apple OAuth
APPLE_CLIENT_ID=your-apple-client-id
APPLE_CLIENT_SECRET=your-apple-client-secret
APPLE_REDIRECT_URI=http://localhost:8000/api/auth/apple/callback
APPLE_TEAM_ID=your-apple-team-id
APPLE_KEY_ID=your-apple-key-id
APPLE_PRIVATE_KEY=your-apple-private-key
```

## Discord OAuth Setup

### 1. Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Enter a name for your application
4. Go to "OAuth2" in the left sidebar
5. Copy the "Client ID" and "Client Secret"

### 2. Configure OAuth2 Settings

1. In the OAuth2 section, add redirect URLs:
   - `http://localhost:8000/api/auth/discord/callback` (development)
   - `https://yourdomain.com/api/auth/discord/callback` (production)

2. Set scopes to: `identify email`

### 3. Update Environment Variables

```env
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret
DISCORD_REDIRECT_URI=http://localhost:8000/api/auth/discord/callback
```

## Google OAuth Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API

### 2. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Add authorized redirect URIs:
   - `http://localhost:8000/api/auth/google/callback` (development)
   - `https://yourdomain.com/api/auth/google/callback` (production)

### 3. Update Environment Variables

```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback
```

## Facebook OAuth Setup

### 1. Create Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "Create App"
3. Choose "Consumer" app type
4. Fill in app details

### 2. Configure Facebook Login

1. Add "Facebook Login" product
2. Go to "Facebook Login" > "Settings"
3. Add valid OAuth redirect URIs:
   - `http://localhost:8000/api/auth/facebook/callback` (development)
   - `https://yourdomain.com/api/auth/facebook/callback` (production)

### 3. Update Environment Variables

```env
FACEBOOK_CLIENT_ID=your-facebook-client-id
FACEBOOK_CLIENT_SECRET=your-facebook-client-secret
FACEBOOK_REDIRECT_URI=http://localhost:8000/api/auth/facebook/callback
```

## Apple OAuth Setup

### 1. Create Apple Developer Account

1. Go to [Apple Developer](https://developer.apple.com/)
2. Sign in with your Apple ID
3. Accept the Apple Developer Agreement

### 2. Create App ID

1. Go to "Certificates, Identifiers & Profiles"
2. Click "Identifiers" > "App IDs"
3. Click "+" to create new App ID
4. Choose "App" and fill in details
5. Enable "Sign In with Apple"

### 3. Create Service ID

1. Go to "Identifiers" > "Services IDs"
2. Click "+" to create new Service ID
3. Choose "Services" and fill in details
4. Enable "Sign In with Apple"
5. Configure domains and redirect URLs

### 4. Create Private Key

1. Go to "Keys"
2. Click "+" to create new key
3. Enable "Sign In with Apple"
4. Download the key file
5. Note the Key ID

### 5. Update Environment Variables

```env
APPLE_CLIENT_ID=your-apple-client-id
APPLE_CLIENT_SECRET=your-apple-client-secret
APPLE_REDIRECT_URI=http://localhost:8000/api/auth/apple/callback
APPLE_TEAM_ID=your-apple-team-id
APPLE_KEY_ID=your-apple-key-id
APPLE_PRIVATE_KEY=your-apple-private-key
```

## Testing OAuth

### 1. Start the Application

```bash
npm run dev
```

### 2. Test OAuth Flows

1. Go to `http://localhost:3000`
2. Click on OAuth login buttons
3. Complete the OAuth flow
4. Verify user is created in database

### 3. Check Database

```sql
-- Connect to MariaDB
mysql -u root -p rrcompanion

-- Check users table
SELECT id, email, name, oauth_provider, oauth_id, created_at 
FROM users 
WHERE oauth_provider IS NOT NULL;
```

## Troubleshooting

### Common Issues

1. **Invalid Redirect URI**
   - Ensure redirect URIs match exactly in OAuth provider settings
   - Check for trailing slashes and protocol (http vs https)

2. **CORS Errors**
   - Verify CORS_ORIGIN is set correctly in environment variables
   - Check that frontend and API are running on correct ports

3. **Database Connection**
   - Ensure MariaDB is running and accessible
   - Verify database credentials in environment variables

4. **OAuth Provider Errors**
   - Check that OAuth app is properly configured
   - Verify client ID and secret are correct
   - Ensure required scopes are enabled

### Debug Commands

```bash
# Check API logs
cd apps/api
deno run --allow-net --allow-env --allow-read --allow-write src/main.ts

# Test database connection
mysql -u root -p -e "USE rrcompanion; SELECT COUNT(*) FROM users;"

# Check environment variables
cat apps/api/.env
```

## Production Deployment

### 1. Update Redirect URIs

For production, update all OAuth redirect URIs to use your domain:

```env
DISCORD_REDIRECT_URI=https://yourdomain.com/api/auth/discord/callback
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/auth/google/callback
FACEBOOK_REDIRECT_URI=https://yourdomain.com/api/auth/facebook/callback
APPLE_REDIRECT_URI=https://yourdomain.com/api/auth/apple/callback
```

### 2. SSL/HTTPS

Ensure your production environment uses HTTPS, as most OAuth providers require
it.

### 3. Environment Variables

Set all environment variables in your production environment (Deno Deploy,
Railway, etc.).

## Security Considerations

1. **Keep Secrets Secure**
   - Never commit OAuth secrets to version control
   - Use environment variables for all sensitive data
   - Rotate secrets regularly

2. **Validate OAuth Data**
   - Always validate OAuth provider responses
   - Check email verification status when available
   - Implement proper error handling

3. **User Data Privacy**
   - Only request necessary OAuth scopes
   - Handle user data according to privacy laws
   - Implement proper data deletion procedures

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review OAuth provider documentation
3. Check application logs for errors
4. Verify database connectivity and schema
