import { config } from 'dotenv';
import { FictionHistoryService } from './src/services/fictionHistory.ts';

config({ export: true });

async function testOptimizedRisingStars() {
  try {
    console.log('🧪 Testing optimized rising stars collection...');

    const fictionHistoryService = new FictionHistoryService();

    // Get a small subset of rising stars for testing
    console.log('📡 Fetching a small subset of rising stars...');
    const response = await (fictionHistoryService as any).royalroadService.getRisingStars('main');

    if (response.success && response.data) {
      // Take only the first 3 fictions for testing
      const testFictions = response.data.slice(0, 3);
      console.log(`📊 Testing with ${testFictions.length} fictions...`);

      // Process the test fictions
      await fictionHistoryService.saveFictionHistoryData(testFictions);

      console.log('✅ Optimized rising stars test completed!');
    } else {
      console.log('❌ Failed to fetch rising stars data');
    }

  } catch (error) {
    console.error('❌ Error during optimized rising stars test:', error);
  }
}

testOptimizedRisingStars().catch(console.error); 