import { config } from 'dotenv';
import { RisingStarsService } from './src/services/risingStars.ts';

config({ export: true });

async function testRisingStarsSave() {
  try {
    console.log('🧪 Testing Rising Stars save functionality...');

    const risingStarsService = new RisingStarsService();

    // Test data
    const testEntry = {
      fiction_id: 1,
      genre: 'test',
      position: 1,
      captured_at: new Date()
    };

    console.log('💾 Saving test rising star entry...');
    await risingStarsService.saveRisingStarEntry(testEntry);

    console.log('✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Error during test:', error);
  }
}

testRisingStarsSave().catch(console.error); 