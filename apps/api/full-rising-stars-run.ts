import { config } from 'dotenv';
import { FictionHistoryService } from './src/services/fictionHistory.ts';

config({ export: true });

async function runFullRisingStarsCollection() {
  try {
    console.log('🚀 Starting full Rising Stars collection...');

    const fictionHistoryService = new FictionHistoryService();

    // Run the complete collection process
    console.log('📊 Running complete fiction history collection...');
    await fictionHistoryService.runNightlyCollection();

    console.log('✅ Full Rising Stars collection completed successfully!');

  } catch (error) {
    console.error('❌ Error during full collection:', error);
  }
}

runFullRisingStarsCollection().catch(console.error); 