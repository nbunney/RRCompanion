import { config } from 'dotenv';
import { initializeDatabase } from './src/config/database.ts';
import { FictionHistoryService } from './src/services/fictionHistory.ts';
import { FictionService } from './src/services/fiction.ts';

config({ export: true });

async function testFullNightlyCollection() {
  try {
    console.log('🧪 Testing full nightly collection with sponsored fictions...');

    // Initialize database connection
    await initializeDatabase();

    // Set up a test sponsored fiction
    console.log('\n📊 Setting up test sponsored fiction...');
    const testFiction = await FictionService.getFictionByRoyalRoadId('110569');
    if (testFiction) {
      await FictionService.updateFiction(testFiction.royalroad_id, {
        sponsored: 1
      });
      console.log(`✅ Set fiction ${testFiction.royalroad_id} as sponsored`);
    }

    const fictionHistoryService = new FictionHistoryService();

    // Test the full nightly collection process
    console.log('\n🌙 Testing full nightly collection process...');
    const result = await fictionHistoryService.runNightlyCollection();

    if (result) {
      console.log('✅ Full nightly collection completed successfully!');
    } else {
      console.log('❌ Full nightly collection failed');
    }

  } catch (error) {
    console.error('❌ Error during full nightly collection test:', error);
  }
}

testFullNightlyCollection().catch(console.error); 