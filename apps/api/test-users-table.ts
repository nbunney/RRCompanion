import { client, testConnection, closeDatabase } from './src/config/database.ts';

async function testUsersTable() {
  console.log('🔍 Checking users table structure...\n');

  await testConnection();

  try {
    // Check the users table structure
    const usersStructure = await client.query('DESCRIBE users');
    console.log('📋 Users table structure:');
    usersStructure.forEach((row: any) => {
      console.log(`- ${row.Field}: ${row.Type} ${row.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // Check if there are any users
    const usersCount = await client.query('SELECT COUNT(*) as count FROM users');
    console.log(`\n👥 Total users: ${usersCount[0].count}`);

    // Check userFiction table structure
    const userFictionStructure = await client.query('DESCRIBE userFiction');
    console.log('\n📋 UserFiction table structure:');
    userFictionStructure.forEach((row: any) => {
      console.log(`- ${row.Field}: ${row.Type} ${row.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // Check if there are any favorites
    const favoritesCount = await client.query('SELECT COUNT(*) as count FROM userFiction WHERE is_favorite = 1');
    console.log(`\n❤️ Total favorites: ${favoritesCount[0].count}`);

    // Check what favorites exist
    const favorites = await client.query(`
      SELECT uf.*, f.title 
      FROM userFiction uf 
      JOIN fiction f ON uf.fiction_id = f.id 
      WHERE uf.is_favorite = 1
      ORDER BY f.title
    `);

    if (favorites.length > 0) {
      console.log('\n📚 Current favorites:');
      favorites.forEach((row: any, index: number) => {
        console.log(`${index + 1}. "${row.title}" (User ID: ${row.user_id})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await closeDatabase();
  }
}

testUsersTable(); 