import { config } from 'https://deno.land/x/dotenv@v3.2.2/mod.ts';
import { Client } from 'https://deno.land/x/mysql@v2.12.0/mod.ts';

// Load environment variables
await config({ export: true });

const client = new Client();
await client.connect({
  hostname: Deno.env.get('DB_HOST') || 'localhost',
  username: Deno.env.get('DB_USER') || 'root',
  password: Deno.env.get('DB_PASSWORD') || '',
  db: Deno.env.get('DB_NAME') || 'RRCompanion',
  port: parseInt(Deno.env.get('DB_PORT') || '3306'),
});

async function checkTimestamps() {
  try {
    console.log('🔍 Checking timestamp issues...');
    
    // Get all unique timestamps
    const timestampsQuery = 'SELECT DISTINCT captured_at FROM risingStars ORDER BY captured_at DESC LIMIT 5';
    const timestampsResult = await client.query(timestampsQuery);
    
    console.log('📅 Recent timestamps:');
    timestampsResult.forEach((row, index) => {
      console.log(`${index + 1}. ${row.captured_at}`);
    });
    
    // Check if fiction exists in the most recent timestamp
    const latestTimestamp = timestampsResult[0]?.captured_at;
    console.log(`\n🔍 Checking fiction ID 1 in latest timestamp: ${latestTimestamp}`);
    
    const fictionInLatestQuery = 'SELECT * FROM risingStars WHERE fiction_id = 1 AND captured_at = ?';
    const fictionInLatestResult = await client.query(fictionInLatestQuery, [latestTimestamp]);
    
    console.log(`📊 Fiction entries in latest scrape: ${fictionInLatestResult.length}`);
    
    if (fictionInLatestResult.length > 0) {
      fictionInLatestResult.forEach((entry, index) => {
        console.log(`${index + 1}. Genre: ${entry.genre}, Position: ${entry.position}`);
      });
    } else {
      console.log('❌ Fiction not found in latest scrape - it may have fallen off Rising Stars lists');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkTimestamps();
