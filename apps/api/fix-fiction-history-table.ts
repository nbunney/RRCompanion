import { Client } from 'mysql';
import { config } from 'dotenv';

// Load environment variables
config({ export: true });

async function fixFictionHistoryTable() {
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

    // Check current table structure
    console.log('\n📋 Current fictionHistory table structure:');
    const columns = await client.query('DESCRIBE fictionHistory');
    columns.forEach((col: any) => {
      console.log(`${col.Field} - ${col.Type} - ${col.Null} - ${col.Key} - ${col.Default} - ${col.Extra}`);
    });

    // Add missing columns
    const missingColumns = [
      { name: 'author_id', type: 'VARCHAR(255)' },
      { name: 'author_avatar', type: 'TEXT' },
      { name: 'description', type: 'TEXT' },
      { name: 'image_url', type: 'TEXT' },
      { name: 'status', type: 'VARCHAR(100)' },
      { name: 'type', type: 'VARCHAR(100)' },
      { name: 'tags', type: 'JSON' },
      { name: 'warnings', type: 'JSON' },
      { name: 'pages', type: 'INT DEFAULT 0' },
      { name: 'ratings', type: 'INT DEFAULT 0' },
      { name: 'overall_score', type: 'DECIMAL(3,2) DEFAULT 0.00' },
      { name: 'style_score', type: 'DECIMAL(3,2) DEFAULT 0.00' },
      { name: 'story_score', type: 'DECIMAL(3,2) DEFAULT 0.00' },
      { name: 'grammar_score', type: 'DECIMAL(3,2) DEFAULT 0.00' },
      { name: 'character_score', type: 'DECIMAL(3,2) DEFAULT 0.00' },
      { name: 'total_views', type: 'INT DEFAULT 0' },
      { name: 'average_views', type: 'INT DEFAULT 0' },
    ];

    console.log('\n🔧 Adding missing columns...');
    for (const column of missingColumns) {
      try {
        await client.execute(`ALTER TABLE fictionHistory ADD COLUMN ${column.name} ${column.type}`);
        console.log(`✅ Added ${column.name} column`);
      } catch (error) {
        console.log(`ℹ️ ${column.name} column already exists`);
      }
    }

    // Update genre to be nullable
    try {
      await client.execute(`ALTER TABLE fictionHistory MODIFY COLUMN genre VARCHAR(100) NULL`);
      console.log('✅ Updated genre column to be nullable');
    } catch (error) {
      console.log('ℹ️ genre column already nullable');
    }

    // Show final table structure
    console.log('\n📋 Final fictionHistory table structure:');
    const finalColumns = await client.query('DESCRIBE fictionHistory');
    finalColumns.forEach((col: any) => {
      console.log(`${col.Field} - ${col.Type} - ${col.Null} - ${col.Key} - ${col.Default} - ${col.Extra}`);
    });

    console.log('\n✅ FictionHistory table structure updated successfully!');

  } catch (error) {
    console.error('❌ Error fixing fictionHistory table:', error);
  } finally {
    await client.close();
  }
}

fixFictionHistoryTable().catch(console.error); 