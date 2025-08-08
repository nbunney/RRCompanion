import { config } from 'dotenv';
import { Client } from 'mysql';

config({ export: true });

async function testStatusTypeDatabase() {
  try {
    console.log('🔍 Testing status and type in database...');

    const dbClient = new Client();
    const dbConfig = {
      hostname: Deno.env.get('DB_HOST') || 'localhost',
      port: parseInt(Deno.env.get('DB_PORT') || '3306'),
      username: Deno.env.get('DB_USER') || 'root',
      password: Deno.env.get('DB_PASSWORD') || '',
      db: Deno.env.get('DB_NAME') || 'RRCompanion',
      charset: 'utf8mb4',
    };

    await dbClient.connect(dbConfig);

    // Check fiction table
    console.log('\n📊 Checking fiction table...');
    const fictionResults = await dbClient.query(`
      SELECT id, title, royalroad_id, status, type 
      FROM fiction 
      WHERE status IS NOT NULL OR type IS NOT NULL 
      LIMIT 5
    `);

    if (fictionResults.length > 0) {
      console.log(`✅ Found ${fictionResults.length} fiction entries with status/type:`);
      fictionResults.forEach((row: any, index: number) => {
        console.log(`  ${index + 1}: ID ${row.id}, Title: "${row.title}", Status: "${row.status || 'NULL'}", Type: "${row.type || 'NULL'}"`);
      });
    } else {
      console.log('❌ No fiction entries found with status/type');
    }

    // Check fictionHistory table
    console.log('\n📊 Checking fictionHistory table...');
    const historyResults = await dbClient.query(`
      SELECT id, fiction_id, royalroad_id, status, type 
      FROM fictionHistory 
      WHERE status IS NOT NULL OR type IS NOT NULL 
      ORDER BY captured_at DESC 
      LIMIT 5
    `);

    if (historyResults.length > 0) {
      console.log(`✅ Found ${historyResults.length} history entries with status/type:`);
      historyResults.forEach((row: any, index: number) => {
        console.log(`  ${index + 1}: ID ${row.id}, Fiction ID: ${row.fiction_id}, Status: "${row.status || 'NULL'}", Type: "${row.type || 'NULL'}"`);
      });
    } else {
      console.log('❌ No history entries found with status/type');
    }

    await dbClient.close();
    console.log('\n✅ Status and type database test completed!');

  } catch (error) {
    console.error('❌ Error during database test:', error);
  }
}

testStatusTypeDatabase().catch(console.error); 