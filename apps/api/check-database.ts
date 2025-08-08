import { Client } from 'mysql';
import { config } from 'dotenv';

// Load environment variables
config({ export: true });

async function checkDatabase() {
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

    // Check fiction table
    console.log('\n📚 Fiction table:');
    const fictions = await client.query('SELECT id, royalroad_id, title, followers, favorites, views, score FROM fiction LIMIT 5');
    fictions.forEach((fic: any) => {
      console.log(`ID: ${fic.id}, RR ID: ${fic.royalroad_id}, Title: ${fic.title}, Followers: ${fic.followers}, Favorites: ${fic.favorites}, Views: ${fic.views}, Score: ${fic.score}`);
    });

    // Check fictionHistory table
    console.log('\n📊 FictionHistory table:');
    const history = await client.query('SELECT id, fiction_id, royalroad_id, title, position, genre, followers, favorites, views, score FROM fictionHistory LIMIT 5');
    history.forEach((entry: any) => {
      console.log(`ID: ${entry.id}, Fiction ID: ${entry.fiction_id}, RR ID: ${entry.royalroad_id}, Title: ${entry.title}, Position: ${entry.position}, Genre: ${entry.genre}, Followers: ${entry.followers}, Favorites: ${entry.favorites}, Views: ${entry.views}, Score: ${entry.score}`);
    });

    console.log(`\n📈 Total fictions: ${fictions.length}`);
    console.log(`📈 Total history entries: ${history.length}`);

  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await client.close();
  }
}

checkDatabase().catch(console.error); 