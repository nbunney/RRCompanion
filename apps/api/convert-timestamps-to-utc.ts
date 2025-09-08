import { client } from './src/config/database.ts';

async function convertTimestampsToUTC() {
  try {
    console.log('🔄 Converting Rising Stars timestamps from local time to UTC...');

    // Connect to database
    await client.connect();

    // First, let's check what the current timestamps look like
    console.log('\n📊 Current timestamps (before conversion):');
    const beforeQuery = `
      SELECT fiction_id, genre, position, captured_at 
      FROM risingStars 
      ORDER BY captured_at DESC 
      LIMIT 3
    `;

    const beforeResults = await client.query(beforeQuery);
    beforeResults.forEach((row: any) => {
      console.log(`  Fiction ${row.fiction_id} - ${row.genre} pos ${row.position} - ${row.captured_at}`);
    });

    // Convert Rising Stars timestamps (add 7 hours to convert PDT to UTC)
    console.log('\n🔄 Converting Rising Stars timestamps...');
    const risingStarsUpdate = `
      UPDATE risingStars 
      SET captured_at = DATE_ADD(captured_at, INTERVAL 7 HOUR)
      WHERE captured_at IS NOT NULL
    `;

    const risingStarsResult = await client.execute(risingStarsUpdate);
    console.log(`✅ Updated ${risingStarsResult.affectedRows} Rising Stars records`);

    // Convert Fiction History timestamps
    console.log('\n🔄 Converting Fiction History timestamps...');
    const fictionHistoryUpdate = `
      UPDATE fictionHistory 
      SET captured_at = DATE_ADD(captured_at, INTERVAL 7 HOUR)
      WHERE captured_at IS NOT NULL
    `;

    const fictionHistoryResult = await client.execute(fictionHistoryUpdate);
    console.log(`✅ Updated ${fictionHistoryResult.affectedRows} Fiction History records`);

    // Verify the conversion
    console.log('\n📊 Converted timestamps (after conversion):');
    const afterResults = await client.query(beforeQuery);
    afterResults.forEach((row: any) => {
      console.log(`  Fiction ${row.fiction_id} - ${row.genre} pos ${row.position} - ${row.captured_at}`);
    });

    console.log('\n✅ Successfully converted all timestamps to UTC!');

  } catch (error) {
    console.error('❌ Error converting timestamps:', error);
  } finally {
    await client.close();
  }
}

// Run the conversion
convertTimestampsToUTC();