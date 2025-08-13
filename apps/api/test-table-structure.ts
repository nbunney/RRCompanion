import { client } from './src/config/database.ts';

async function checkTableStructure() {
  try {
    console.log('🔍 Checking userFiction table structure...');

    // Check if table exists
    const tableExists = await client.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = 'userFiction'
    `);

    if (tableExists[0]?.count === 0) {
      console.log('❌ userFiction table does not exist!');
      return;
    }

    console.log('✅ userFiction table exists');

    // Show all columns in userFiction table
    const columns = await client.query(`
      SHOW COLUMNS FROM userFiction
    `);

    console.log('📋 userFiction table columns:');
    columns.forEach((col: any) => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
    });

    // Check specifically for is_favorite column
    const hasFavoriteColumn = columns.some((col: any) => col.Field === 'is_favorite');
    console.log(`\n🔍 is_favorite column exists: ${hasFavoriteColumn ? 'YES' : 'NO'}`);

    // Check table name case sensitivity
    const tableNames = await client.query(`
      SHOW TABLES LIKE '%user%'
    `);

    console.log('\n📋 Tables with "user" in name:');
    tableNames.forEach((table: any) => {
      const tableName = Object.values(table)[0];
      console.log(`  - ${tableName}`);
    });

  } catch (error) {
    console.error('❌ Error checking table structure:', error);
  }
}

async function testSimpleQuery() {
  try {
    console.log('\n🧪 Testing simple query on userFiction table...');

    // Try a simple query without the problematic column
    const result = await client.query(`
      SELECT COUNT(*) as count FROM userFiction
    `);

    console.log('✅ Simple query successful, count:', result[0]?.count);

  } catch (error) {
    console.error('❌ Simple query failed:', error);
  }
}

async function main() {
  try {
    await checkTableStructure();
    await testSimpleQuery();
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

if (import.meta.main) {
  main();
}
