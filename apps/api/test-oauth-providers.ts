import { config } from 'dotenv';

// Load environment variables
config({ export: true, path: './.env' });

async function testOAuthProviders() {
  console.log('🔧 Testing OAuth Providers...\n');

  // Check environment variables
  const discordClientId = Deno.env.get('DISCORD_CLIENT_ID');
  console.log(`📋 DISCORD_CLIENT_ID: ${discordClientId ? '✅ SET' : '❌ NOT SET'}`);

  // Test the OAuth providers function directly
  try {
    const { getOAuthProviders } = await import('./src/controllers/oauth.ts');
    
    const mockContext = {
      response: {
        status: 0,
        body: {} as any
      }
    };

    await getOAuthProviders(mockContext as any);
    
    console.log(`📊 Response Status: ${mockContext.response.status}`);
    
    if (mockContext.response.body.success && mockContext.response.body.data) {
      const providers = mockContext.response.body.data;
      console.log('\n📋 OAuth Providers:');
      providers.forEach((provider: any) => {
        console.log(`- ${provider.displayName}: ${provider.enabled ? '✅ ENABLED' : '❌ DISABLED'}`);
      });
      
      const discordProvider = providers.find((p: any) => p.name === 'discord');
      if (discordProvider) {
        console.log(`\n🎮 Discord Status: ${discordProvider.enabled ? '✅ ENABLED' : '❌ DISABLED'}`);
        if (!discordProvider.enabled) {
          console.log('💡 Discord should be enabled since DISCORD_CLIENT_ID is set');
        }
      }
    } else {
      console.log('❌ Failed to get OAuth providers');
      console.log('Response:', mockContext.response.body);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testOAuthProviders(); 