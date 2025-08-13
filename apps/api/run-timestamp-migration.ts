import { client, testConnection, closeDatabase } from './src/config/database.ts';

async function runTimestampMigration() {
  try {
    console.log('🔄 Running Rising Stars timestamp rounding migration...\n');

    await testConnection();

    // First, let's see what we're working with
    console.log('📅 Before migration - sample timestamps:');
    const beforeTimestamps = await client.query(`
      SELECT DISTINCT captured_at 
      FROM risingStars 
      ORDER BY captured_at DESC 
      LIMIT 10
    `);
    beforeTimestamps.forEach((row: any) => {
      console.log(`- ${row.captured_at}`);
    });

    // Count total entries to be updated
    const totalCount = await client.query('SELECT COUNT(*) as count FROM risingStars');
    console.log(`\n📊 Total Rising Stars entries to update: ${totalCount[0]?.count}`);

    // Update all Rising Stars entries to round their timestamps to the nearest hour
    console.log('\n🔄 Updating timestamps...');
    const updateResult = await client.execute(`
      UPDATE risingStars 
      SET captured_at = DATE_FORMAT(
        captured_at, 
        '%Y-%m-%d %H:00:00'
      ) 
      WHERE captured_at IS NOT NULL
    `);
    console.log(`✅ Updated ${updateResult.affectedRows} entries`);

    // Verify the changes
    console.log('\n📅 After migration - sample timestamps:');
    const afterTimestamps = await client.query(`
      SELECT DISTINCT captured_at 
      FROM risingStars 
      ORDER BY captured_at DESC 
      LIMIT 10
    `);
    afterTimestamps.forEach((row: any) => {
      console.log(`- ${row.captured_at}`);
    });

    // Show how many unique timestamps we now have
    const uniqueTimestampCount = await client.query(`
      SELECT COUNT(DISTINCT captured_at) as unique_timestamps 
      FROM risingStars
    `);
    console.log(`\n📊 Unique timestamps after migration: ${uniqueTimestampCount[0]?.unique_timestamps}`);

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Error running timestamp migration:', error);
  } finally {
    await closeDatabase();
  }
}

runTimestampMigration().catch(console.error);
