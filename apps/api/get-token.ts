// Script to get JWT token for testing
import { config } from 'dotenv';

// Load environment variables
config({ export: true });

async function getToken() {
  const email = 'nateswansonauthor@gmail.com';
  const password = 'Babs8604';

  try {
    console.log('🔐 Attempting to get JWT token...');

    const response = await fetch('http://localhost:8000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data && data.data.token) {
        console.log('✅ Token obtained successfully!');
        console.log('🔑 JWT Token:');
        console.log(data.data.token);
        console.log('\n📋 Use this token in your curl command:');
        console.log(`curl -X POST \\`);
        console.log(`  -H "Authorization: Bearer ${data.data.token}" \\`);
        console.log(`  -H "Content-Type: application/json" \\`);
        console.log(`  http://localhost:8000/api/rising-stars/trigger`);
      } else {
        console.error('❌ Login failed:', data.message || 'Unknown error');
        console.log('Response data:', JSON.stringify(data, null, 2));
      }
    } else {
      const errorData = await response.json();
      console.error('❌ Login failed:', errorData.message || 'HTTP error');
    }
  } catch (error) {
    console.error('❌ Error getting token:', error);
  }
}

// Run the script
getToken(); 