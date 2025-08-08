import { initializeDatabase } from './src/config/database.ts';

async function testMigrations() {
  try {
    console.log('🔄 Testing migration system...');
    await initializeDatabase();
    console.log('✅ Database initialization and migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration test failed:', error);
  }
}

testMigrations(); 