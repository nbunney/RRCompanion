import { config } from 'dotenv';
import { initializeDatabase } from './src/config/database.ts';
import { FictionHistoryService } from './src/services/fictionHistory.ts';
import { FictionService } from './src/services/fiction.ts';

config({ export: true });

async function testSponsoredProcessing() {
  try {
    console.log('🧪 Testing sponsored fictions processing...');

    // Initialize database connection
    await initializeDatabase();

    const fictionHistoryService = new FictionHistoryService();

    // First, let's make sure we have a sponsored fiction to test with
    console.log('\n📊 Setting up test sponsored fiction...');
    const testFiction = await FictionService.getFictionByRoyalRoadId('110569');
    if (testFiction) {
      // Set it as sponsored
      await FictionService.updateFiction(testFiction.royalroad_id, {
        sponsored: 1
      });
      console.log(`✅ Set fiction ${testFiction.royalroad_id} as sponsored`);
    }

    // Test the sponsored fictions processing
    console.log('\n🎯 Testing sponsored fictions processing...');
    await fictionHistoryService.processSponsoredFictions();

    console.log('\n✅ Sponsored processing test completed!');

  } catch (error) {
    console.error('❌ Error during sponsored processing test:', error);
  }
}

testSponsoredProcessing().catch(console.error); 