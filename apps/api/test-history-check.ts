import { config } from 'dotenv';
import { FictionHistoryService } from './src/services/fictionHistory.ts';

config({ export: true });

async function testHistoryCheck() {
  try {
    console.log('🧪 Testing fiction history check logic...');

    const fictionHistoryService = new FictionHistoryService();

    // Test with a known fiction ID
    const testFictionId = 1; // Use an existing fiction ID from your database

    console.log(`\n📊 Checking if fiction ID ${testFictionId} has a history entry for today...`);

    const hasHistoryToday = await fictionHistoryService.hasFictionHistoryEntryToday(testFictionId);
    console.log(`Result: ${hasHistoryToday ? 'YES' : 'NO'}`);

    if (hasHistoryToday) {
      console.log('✅ Fiction already has a history entry for today - would skip API call');
    } else {
      console.log('📡 Fiction does not have a history entry for today - would make API call');
    }

    // Test with a non-existent fiction ID
    console.log(`\n📊 Checking if fiction ID 999999 has a history entry for today...`);

    const hasHistoryTodayNonExistent = await fictionHistoryService.hasFictionHistoryEntryToday(999999);
    console.log(`Result: ${hasHistoryTodayNonExistent ? 'YES' : 'NO'}`);

    console.log('\n✅ History check test completed!');

  } catch (error) {
    console.error('❌ Error during history check test:', error);
  }
}

testHistoryCheck().catch(console.error); 