import { client } from './src/config/database.ts';

async function addFavoriteColumn() {
  try {
    console.log('🔧 Adding is_favorite column to userFiction table...');

    // Check if column already exists
    const columnExists = await client.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.columns 
      WHERE table_schema = DATABASE() 
      AND table_name = 'userFiction' 
      AND column_name = 'is_favorite'
    `);

    if (columnExists[0]?.count > 0) {
      console.log('✅ is_favorite column already exists');
      return;
    }

    // Add the column
    await client.execute(`
      ALTER TABLE userFiction 
      ADD COLUMN is_favorite BOOLEAN DEFAULT FALSE
    `);

    console.log('✅ Added is_favorite column to userFiction table');

    // Add index for performance
    await client.execute(`
      ALTER TABLE userFiction 
      ADD INDEX idx_is_favorite (is_favorite)
    `);

    console.log('✅ Added index for is_favorite column');

    // Verify the column was added
    const verifyColumn = await client.query(`
      SHOW COLUMNS FROM userFiction LIKE 'is_favorite'
    `);

    if (verifyColumn.length > 0) {
      console.log('✅ Verification successful - is_favorite column is now available');
      console.log('📋 Column details:', verifyColumn[0]);
    } else {
      console.log('❌ Column was not added successfully');
    }

  } catch (error) {
    console.error('❌ Error adding is_favorite column:', error);
  }
}

async function testUpdatedQuery() {
  try {
    console.log('\n🧪 Testing the updated admin query with is_favorite...');

    const result = await client.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.admin,
        u.created_at,
        COUNT(DISTINCT uf.id) as fiction_count,
        COUNT(DISTINCT CASE WHEN uf.is_favorite = 1 THEN uf.id END) as favorites_count,
        COUNT(DISTINCT CASE WHEN f.sponsored = 1 THEN f.id END) as sponsored_count
      FROM users u
      LEFT JOIN userFiction uf ON u.id = uf.user_id
      LEFT JOIN fiction f ON uf.fiction_id = f.id
      GROUP BY u.id, u.name, u.email, u.admin, u.created_at
      ORDER BY u.created_at DESC
      LIMIT 5
    `);

    console.log('✅ Updated query successful!');
    console.log('📊 Sample results:');
    result.forEach((user: any, index: number) => {
      console.log(`  ${index + 1}. ${user.name} (${user.email})`);
      console.log(`     Fictions: ${user.fiction_count}, Favorites: ${user.favorites_count}, Sponsored: ${user.sponsored_count}`);
    });

  } catch (error) {
    console.error('❌ Updated query failed:', error);
  }
}

async function main() {
  try {
    await addFavoriteColumn();
    await testUpdatedQuery();

    console.log('\n🎉 Migration complete!');
    console.log('💡 The admin users page should now work with full statistics including favorites.');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

if (import.meta.main) {
  main();
}
