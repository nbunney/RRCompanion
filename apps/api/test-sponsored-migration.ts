import { config } from 'dotenv';
import { initializeDatabase } from './src/config/database.ts';
import { FictionService } from './src/services/fiction.ts';

config({ export: true });

async function testSponsoredMigration() {
  try {
    console.log('🧪 Testing sponsored field migration...');

    // Initialize database (this will run the migration)
    console.log('📊 Initializing database...');
    await initializeDatabase();

    // Test getting sponsored fictions
    console.log('\n📊 Testing getSponsoredFictions...');
    const sponsoredFictions = await FictionService.getSponsoredFictions();
    console.log(`Found ${sponsoredFictions.length} sponsored fictions`);

    if (sponsoredFictions.length > 0) {
      console.log('Sample sponsored fiction:');
      console.log(`  ID: ${sponsoredFictions[0].id}`);
      console.log(`  Title: ${sponsoredFictions[0].title}`);
      console.log(`  Sponsored: ${sponsoredFictions[0].sponsored}`);
    }

    // Test updating a fiction to be sponsored
    console.log('\n📊 Testing sponsored field update...');
    const testFiction = await FictionService.getFictionByRoyalRoadId('110569');
    if (testFiction) {
      console.log(`Current sponsored value for fiction ${testFiction.royalroad_id}: ${testFiction.sponsored}`);
      
      // Update to sponsored (you can change this back later)
      const updatedFiction = await FictionService.updateFiction(testFiction.royalroad_id, {
        sponsored: 1
      });
      
      if (updatedFiction) {
        console.log(`Updated fiction ${testFiction.royalroad_id} to sponsored: ${updatedFiction.sponsored}`);
      }
    }

    console.log('\n✅ Sponsored migration test completed!');

  } catch (error) {
    console.error('❌ Error during sponsored migration test:', error);
  }
}

testSponsoredMigration().catch(console.error); 