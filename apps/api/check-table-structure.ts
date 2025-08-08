import { client, initializeDatabase } from './src/config/database.ts';

async function checkAndFixTableStructure() {
  try {
    // Initialize the database first
    await initializeDatabase();

    console.log('🔍 Checking fictionHistory table structure...');

    // Check current columns
    const columns = await client.query('SHOW COLUMNS FROM fictionHistory');
    console.log('Current fictionHistory columns:', columns.map((col: any) => col.Field));

    // Check if old columns still exist
    const hasTitle = columns.some((col: any) => col.Field === 'title');
    const hasAuthorName = columns.some((col: any) => col.Field === 'author_name');
    const hasPosition = columns.some((col: any) => col.Field === 'position');
    const hasAuthorId = columns.some((col: any) => col.Field === 'author_id');
    const hasAuthorAvatar = columns.some((col: any) => col.Field === 'author_avatar');
    const hasImageUrl = columns.some((col: any) => col.Field === 'image_url');
    const hasGenre = columns.some((col: any) => col.Field === 'genre');

    if (hasTitle || hasAuthorName || hasPosition || hasAuthorId || hasAuthorAvatar || hasImageUrl || hasGenre) {
      console.log('🔄 Found old columns, removing them...');

      if (hasTitle) {
        await client.execute('ALTER TABLE fictionHistory DROP COLUMN title');
        console.log('✅ Dropped title column');
      }
      if (hasAuthorName) {
        await client.execute('ALTER TABLE fictionHistory DROP COLUMN author_name');
        console.log('✅ Dropped author_name column');
      }
      if (hasPosition) {
        await client.execute('ALTER TABLE fictionHistory DROP COLUMN position');
        console.log('✅ Dropped position column');
      }
      if (hasAuthorId) {
        await client.execute('ALTER TABLE fictionHistory DROP COLUMN author_id');
        console.log('✅ Dropped author_id column');
      }
      if (hasAuthorAvatar) {
        await client.execute('ALTER TABLE fictionHistory DROP COLUMN author_avatar');
        console.log('✅ Dropped author_avatar column');
      }
      if (hasImageUrl) {
        await client.execute('ALTER TABLE fictionHistory DROP COLUMN image_url');
        console.log('✅ Dropped image_url column');
      }
      if (hasGenre) {
        await client.execute('ALTER TABLE fictionHistory DROP COLUMN genre');
        console.log('✅ Dropped genre column');
      }
    } else {
      console.log('✅ fictionHistory table already has the correct structure');
    }

    // Check final structure
    const finalColumns = await client.query('SHOW COLUMNS FROM fictionHistory');
    console.log('Final fictionHistory columns:', finalColumns.map((col: any) => col.Field));

    await client.close();
    console.log('✅ Table structure check complete');
  } catch (error) {
    console.error('❌ Error checking table structure:', error);
    await client.close();
  }
}

checkAndFixTableStructure(); 