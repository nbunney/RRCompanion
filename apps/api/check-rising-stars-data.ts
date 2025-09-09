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

async function checkRisingStarsData() {
  try {
    console.log('🔍 Checking Rising Stars data for fiction ID 1...');
    
    // Check if fiction exists in risingStars table at all
    const risingStarsQuery = 'SELECT * FROM risingStars WHERE fiction_id = 1 ORDER BY captured_at DESC LIMIT 10';
    const risingStarsResult = await client.query(risingStarsQuery);
    
    console.log('📊 Rising Stars entries for fiction ID 1:', risingStarsResult.length);
    
    if (risingStarsResult.length > 0) {
      console.log('📋 Recent entries:');
      risingStarsResult.forEach((entry, index) => {
        console.log(`${index + 1}. Genre: ${entry.genre}, Position: ${entry.position}, Date: ${entry.captured_at}`);
      });
    } else {
      console.log('❌ No Rising Stars entries found for fiction ID 1');
      
      // Check what genres exist in the latest scrape
      const latestScrapeQuery = 'SELECT MAX(captured_at) as latest_scrape FROM risingStars';
      const latestScrapeResult = await client.query(latestScrapeQuery);
      const latestScrape = latestScrapeResult[0]?.latest_scrape;
      
      console.log('📅 Latest scrape:', latestScrape);
      
      if (latestScrape) {
        const genresQuery = 'SELECT DISTINCT genre FROM risingStars WHERE captured_at = ? ORDER BY genre';
        const genresResult = await client.query(genresQuery, [latestScrape]);
        
        console.log('📚 Available genres in latest scrape:');
        genresResult.forEach((row, index) => {
          console.log(`${index + 1}. ${row.genre}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkRisingStarsData();
