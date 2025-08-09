import { config } from 'dotenv';

// Load environment variables
config({ export: true, path: './.env' });

async function testOAuthConfig() {
  console.log('🔧 Testing OAuth Configuration...\n');

  // Check environment variables
  const discordClientId = Deno.env.get('DISCORD_CLIENT_ID');
  const discordClientSecret = Deno.env.get('DISCORD_CLIENT_SECRET');
  const discordRedirectUri = Deno.env.get('DISCORD_REDIRECT_URI');

  console.log('📋 Environment Variables:');
  console.log(`- DISCORD_CLIENT_ID: ${discordClientId ? '✅ SET' : '❌ NOT SET'}`);
  console.log(`- DISCORD_CLIENT_SECRET: ${discordClientSecret ? '✅ SET' : '❌ NOT SET'}`);
  console.log(`- DISCORD_REDIRECT_URI: ${discordRedirectUri || 'https://rrcompanion.com/api/oauth/discord/callback'}`);

  // Test the OAuth providers endpoint
  console.log('\n🌐 Testing OAuth Providers Endpoint...');
  
  try {
    const { getOAuthProviders } = await import('./src/controllers/oauth.ts');
    
    // Create a mock context
    const mockContext = {
      response: {
        status: 0,
        body: {} as any
      }
    };

    await getOAuthProviders(mockContext as any);
    
    console.log(`📊 Response Status: ${mockContext.response.status}`);
    console.log(`📊 Response Body:`, JSON.stringify(mockContext.response.body, null, 2));

    // Check if Discord is enabled
    if (mockContext.response.body.success && mockContext.response.body.data) {
      const discordProvider = mockContext.response.body.data.find((p: any) => p.name === 'discord');
      if (discordProvider) {
        console.log(`\n🎮 Discord Provider Status: ${discordProvider.enabled ? '✅ ENABLED' : '❌ DISABLED'}`);
      }
    }

  } catch (error) {
    console.error('❌ Error testing OAuth providers:', error);
  }
}

testOAuthConfig(); 