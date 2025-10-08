// Run the index optimization migration
import 'https://deno.land/std@0.224.0/dotenv/load.ts';
import { Client } from 'https://deno.land/x/mysql@v2.12.0/mod.ts';

async function runIndexMigration() {
  // Parse DATABASE_URL
  const databaseUrl = Deno.env.get('DATABASE_URL');
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not set in .env file');
    return;
  }

  const url = new URL(databaseUrl);
  
  const client = await new Client().connect({
    hostname: url.hostname,
    port: parseInt(url.port) || 3306,
    username: url.username,
    password: url.password,
    db: url.pathname.slice(1),
  });

  try {
    console.log('✅ Connected to database');
    console.log('🚀 Starting index optimization migration...\n');

    // Check if indexes already exist
    const checkIndexQuery = `
      SHOW INDEX FROM risingStars 
      WHERE Key_name IN ('idx_fiction_genre_captured', 'idx_genre_captured', 'idx_captured_position')
    `;
    const existingIndexes = await client.query(checkIndexQuery);
    
    if (existingIndexes.length > 0) {
      console.log('⚠️  Some indexes already exist:');
      existingIndexes.forEach((idx: any) => {
        console.log(`  - ${idx.Key_name}`);
      });
      console.log('\nSkipping already created indexes...\n');
    }

    // Add composite index for fiction_id, genre, and captured_at
    try {
      console.log('📊 Creating index: idx_fiction_genre_captured (fiction_id, genre, captured_at)...');
      await client.execute('ALTER TABLE risingStars ADD INDEX idx_fiction_genre_captured (fiction_id, genre, captured_at)');
      console.log('✅ Created idx_fiction_genre_captured');
    } catch (error: any) {
      if (error.message?.includes('Duplicate key name')) {
        console.log('ℹ️  idx_fiction_genre_captured already exists');
      } else {
        throw error;
      }
    }

    // Add index for genre and captured_at
    try {
      console.log('📊 Creating index: idx_genre_captured (genre, captured_at)...');
      await client.execute('ALTER TABLE risingStars ADD INDEX idx_genre_captured (genre, captured_at)');
      console.log('✅ Created idx_genre_captured');
    } catch (error: any) {
      if (error.message?.includes('Duplicate key name')) {
        console.log('ℹ️  idx_genre_captured already exists');
      } else {
        throw error;
      }
    }

    // Add index for captured_at and position
    try {
      console.log('📊 Creating index: idx_captured_position (captured_at, position)...');
      await client.execute('ALTER TABLE risingStars ADD INDEX idx_captured_position (captured_at, position)');
      console.log('✅ Created idx_captured_position');
    } catch (error: any) {
      if (error.message?.includes('Duplicate key name')) {
        console.log('ℹ️  idx_captured_position already exists');
      } else {
        throw error;
      }
    }

    console.log('\n🎉 Index optimization migration completed successfully!');
    console.log('\n📈 Expected performance improvement:');
    console.log('  - Movement calculation queries: ~100x faster');
    console.log('  - Previous position lookups: From seconds to milliseconds');
    console.log('  - Rising Stars Position API: Should complete in <2 seconds');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Run the migration
runIndexMigration();

