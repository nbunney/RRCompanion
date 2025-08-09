import { testConnection, closeDatabase } from './src/config/database.ts';

async function testHttpAPI() {
  console.log('🌐 Testing HTTP API endpoint...\n');

  await testConnection();

  try {
    // First, let's find "Just Add Mana" in the fiction table
    const { client } = await import('./src/config/database.ts');
    const fictionResult = await client.query(
      'SELECT id, royalroad_id, title, author_name FROM fiction WHERE title LIKE ?',
      ['%Just Add Mana%']
    );

    if (fictionResult.length === 0) {
      console.log('❌ "Just Add Mana" not found in fiction table');
      return;
    }

    const fictionId = fictionResult[0].id;
    console.log(`📚 Found "Just Add Mana" with ID: ${fictionId}`);

    // Test the HTTP API endpoint
    console.log('\n🌐 Testing HTTP API endpoint...');

    // We need to get a valid auth token first
    const loginResponse = await fetch('http://localhost:8000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });

    if (!loginResponse.ok) {
      console.log('❌ Failed to login for API test');
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.data.token;

    console.log('✅ Got auth token');

    // Now test the Rising Stars API endpoint
    const risingStarsResponse = await fetch(`http://localhost:8000/api/rising-stars/fiction/${fictionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    console.log(`📊 API Response Status: ${risingStarsResponse.status}`);

    if (risingStarsResponse.ok) {
      const risingStarsData = await risingStarsResponse.json();
      console.log('📊 API Response Body:', JSON.stringify(risingStarsData, null, 2));
    } else {
      const errorText = await risingStarsResponse.text();
      console.log('❌ API Error:', errorText);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await closeDatabase();
  }
}

testHttpAPI(); 