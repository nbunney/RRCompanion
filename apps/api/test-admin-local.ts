import { client } from './src/config/database.ts';
import { generateToken } from './src/utils/auth.ts';

async function createTestAdminUser() {
  try {
    console.log('🔧 Setting up test admin user for local development...');

    // Check if test user already exists
    const existingUser = await client.query('SELECT * FROM users WHERE email = ?', ['admin@test.com']);

    if (existingUser.length > 0) {
      console.log('✅ Test admin user already exists:', existingUser[0].email);
      return existingUser[0];
    }

    // Create test admin user
    const result = await client.execute(`
      INSERT INTO users (email, name, admin, created_at, updated_at) 
      VALUES (?, ?, ?, NOW(), NOW())
    `, ['admin@test.com', 'Test Admin', true]);

    console.log('✅ Test admin user created with ID:', result.lastInsertId);

    // Get the created user
    const newUser = await client.query('SELECT * FROM users WHERE id = ?', [result.lastInsertId]);
    return newUser[0];
  } catch (error) {
    console.error('❌ Error creating test admin user:', error);
    throw error;
  }
}

async function generateTestToken(user: any) {
  try {
    const token = await generateToken(user);
    console.log('✅ JWT token generated for test user');
    console.log('🔑 Token:', token);
    console.log('📋 Use this token in your requests:');
    console.log(`   Authorization: Bearer ${token}`);
    return token;
  } catch (error) {
    console.error('❌ Error generating token:', error);
    throw error;
  }
}

async function testAdminEndpoint(token: string) {
  try {
    console.log('\n🧪 Testing admin endpoint with token...');

    const response = await fetch('http://localhost:8000/api/admin/users', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Admin endpoint working! Response:', data);
    } else {
      const errorData = await response.json();
      console.log('❌ Admin endpoint failed:', errorData);
    }
  } catch (error) {
    console.error('❌ Error testing admin endpoint:', error);
  }
}

async function main() {
  try {
    // Initialize database connection
    await import('./src/config/database.ts');

    // Create test admin user
    const user = await createTestAdminUser();

    // Generate JWT token
    const token = await generateTestToken(user);

    // Test admin endpoint
    await testAdminEndpoint(token);

    console.log('\n🎉 Test setup complete!');
    console.log('💡 You can now use this token to test the admin endpoints locally.');

  } catch (error) {
    console.error('❌ Test setup failed:', error);
  }
}

if (import.meta.main) {
  main();
}
