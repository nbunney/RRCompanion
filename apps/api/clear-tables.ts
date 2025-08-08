import { Client } from 'mysql';
import { config } from 'dotenv';

// Load environment variables
config({ export: true });

async function clearTables() {
  const client = new Client();
  
  try {
    // Connect to database
    const dbConfig = {
      hostname: Deno.env.get('DB_HOST') || 'localhost',
      port: parseInt(Deno.env.get('DB_PORT') || '3306'),
      username: Deno.env.get('DB_USER') || 'root',
      password: Deno.env.get('DB_PASSWORD') || '',
      db: Deno.env.get('DB_NAME') || 'RRCompanion',
      charset: 'utf8mb4',
    };
    
    await client.connect(dbConfig);
    console.log('✅ Connected to database');
    
    // Clear tables
    console.log('\n🗑️ Clearing tables...');
    
    await client.execute('DELETE FROM fictionHistory');
    console.log('✅ Cleared fictionHistory table');
    
    await client.execute('DELETE FROM fiction');
    console.log('✅ Cleared fiction table');
    
    // Reset auto-increment
    await client.execute('ALTER TABLE fictionHistory AUTO_INCREMENT = 1');
    await client.execute('ALTER TABLE fiction AUTO_INCREMENT = 1');
    console.log('✅ Reset auto-increment counters');
    
    console.log('\n✅ Tables cleared successfully!');
    
  } catch (error) {
    console.error('❌ Error clearing tables:', error);
  } finally {
    await client.close();
  }
}

clearTables().catch(console.error); 