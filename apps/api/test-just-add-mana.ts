import { client, testConnection, closeDatabase } from './src/config/database.ts';

async function testJustAddMana() {
  console.log('🔍 Testing "Just Add Mana" Rising Stars data...\n');

  await testConnection();

  try {
    // First, let's find "Just Add Mana" in the fiction table
    const fictionResult = await client.query(
      'SELECT id, royalroad_id, title, author_name FROM fiction WHERE title LIKE ? OR title LIKE ?',
      ['%Just Add Mana%', '%just add mana%']
    );

    console.log('📚 Fiction table results:');
    if (fictionResult.length === 0) {
      console.log('❌ No fiction found with "Just Add Mana" in the title');
    } else {
      fictionResult.forEach((row: any, index: number) => {
        console.log(`${index + 1}. ID: ${row.id}, RR ID: ${row.royalroad_id}, Title: "${row.title}", Author: ${row.author_name}`);
      });
    }

    // Check if there are any Rising Stars entries for this fiction
    if (fictionResult.length > 0) {
      const fictionId = fictionResult[0].id;
      console.log(`\n🔍 Checking Rising Stars data for fiction ID: ${fictionId}`);

      const risingStarsResult = await client.query(
        'SELECT * FROM risingStars WHERE fiction_id = ? ORDER BY captured_at DESC',
        [fictionId]
      );

      console.log('📊 Rising Stars entries:');
      if (risingStarsResult.length === 0) {
        console.log('❌ No Rising Stars entries found for this fiction');
      } else {
        risingStarsResult.forEach((row: any, index: number) => {
          console.log(`${index + 1}. Genre: ${row.genre}, Position: ${row.position}, Date: ${row.captured_at}`);
        });
      }
    }

    // Let's also check the latest Rising Stars data overall
    console.log('\n📊 Latest Rising Stars data (all genres):');
    const latestRisingStars = await client.query(`
      SELECT rs.*, f.title 
      FROM risingStars rs 
      JOIN fiction f ON rs.fiction_id = f.id 
      WHERE rs.captured_at = (
        SELECT MAX(captured_at) FROM risingStars
      )
      ORDER BY rs.genre, rs.position
      LIMIT 20
    `);

    if (latestRisingStars.length === 0) {
      console.log('❌ No Rising Stars data found in the database');
    } else {
      console.log(`Found ${latestRisingStars.length} entries from ${latestRisingStars[0].captured_at}:`);
      latestRisingStars.forEach((row: any) => {
        console.log(`- ${row.genre}: "${row.title}" at position ${row.position}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await closeDatabase();
  }
}

testJustAddMana(); 