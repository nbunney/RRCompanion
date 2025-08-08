import { RoyalRoadService } from './src/services/royalroad.ts';
import { FictionHistoryService } from './src/services/fictionHistory.ts';

async function testScraper() {
  console.log('🔍 Testing Rising Stars scraper...');

  const royalroadService = new RoyalRoadService();

  // Test individual genres
  console.log('\n1️⃣ Testing main Rising Stars...');
  const mainResponse = await royalroadService.getRisingStars('main');
  console.log('Main response success:', mainResponse.success);
  console.log('Main data length:', mainResponse.data?.length || 0);
  if (mainResponse.data && mainResponse.data.length > 0) {
    console.log('First Rising Star:', mainResponse.data[0]);
  }

  console.log('\n2️⃣ Testing fantasy Rising Stars...');
  const fantasyResponse = await royalroadService.getRisingStars('fantasy');
  console.log('Fantasy response success:', fantasyResponse.success);
  console.log('Fantasy data length:', fantasyResponse.data?.length || 0);
  if (fantasyResponse.data && fantasyResponse.data.length > 0) {
    console.log('First fantasy Rising Star:', fantasyResponse.data[0]);
  }

  // Test all genres
  console.log('\n3️⃣ Testing all genres...');
  const allGenresResponse = await royalroadService.getAllRisingStars();
  console.log('All genres response success:', allGenresResponse.success);
  console.log('All genres data length:', allGenresResponse.data?.length || 0);
  if (allGenresResponse.data && allGenresResponse.data.length > 0) {
    console.log('Sample Rising Stars:', allGenresResponse.data.slice(0, 3));
  }

  // Test the full collection process with database (just first 5 entries)
  console.log('\n4️⃣ Testing full fiction history collection process (first 5 entries only)...');
  const fictionHistoryService = new FictionHistoryService();

  if (allGenresResponse.success && allGenresResponse.data) {
    try {
      // Just test with the first 5 entries to avoid database connection issues
      const testData = allGenresResponse.data.slice(0, 5);
      console.log(`Testing with ${testData.length} entries...`);
      await fictionHistoryService.saveFictionHistoryData(testData);
      console.log('✅ Full collection process completed successfully!');
    } catch (error) {
      console.error('❌ Full collection process failed:', error);
    }
  }
}

testScraper().catch(console.error); 