import { client, testConnection, closeDatabase } from './src/config/database.ts';

async function testFavoritesCheck() {
  console.log('🔍 Checking if "Just Add Mana" is in favorites...\n');

  await testConnection();

  try {
    // First, let's find "Just Add Mana" in the fiction table
    const fictionResult = await client.query(
      'SELECT id, royalroad_id, title, author_name FROM fiction WHERE title LIKE ?',
      ['%Just Add Mana%']
    );

    if (fictionResult.length === 0) {
      console.log('❌ "Just Add Mana" not found in fiction table');
      return;
    }

    const fictionId = fictionResult[0].id;
    console.log(`📚 Found "Just Add Mana" with ID: ${fictionId}`);

    // Check if it's in any user's favorites
    const favoritesResult = await client.query(`
      SELECT uf.*, u.username 
      FROM userFiction uf 
      JOIN users u ON uf.user_id = u.id 
      WHERE uf.fiction_id = ? AND uf.is_favorite = 1
    `, [fictionId]);

    console.log('\n📚 Favorites check:');
    if (favoritesResult.length === 0) {
      console.log('❌ "Just Add Mana" is not in any user\'s favorites');
    } else {
      console.log(`✅ "Just Add Mana" is in ${favoritesResult.length} user(s) favorites:`);
      favoritesResult.forEach((row: any, index: number) => {
        console.log(`${index + 1}. User: ${row.username}, Added: ${row.created_at}`);
      });
    }

    // Let's also check all favorites to see what's there
    console.log('\n📚 All favorites in the system:');
    const allFavorites = await client.query(`
      SELECT uf.*, f.title, u.username 
      FROM userFiction uf 
      JOIN fiction f ON uf.fiction_id = f.id 
      JOIN users u ON uf.user_id = u.id 
      WHERE uf.is_favorite = 1
      ORDER BY f.title
    `);

    if (allFavorites.length === 0) {
      console.log('❌ No favorites found in the system');
    } else {
      console.log(`📊 Found ${allFavorites.length} favorites:`);
      allFavorites.forEach((row: any, index: number) => {
        console.log(`${index + 1}. "${row.title}" (User: ${row.username})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await closeDatabase();
  }
}

testFavoritesCheck(); 