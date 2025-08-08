import { config } from 'dotenv';
import { RoyalRoadService } from './src/services/royalroad.ts';

config({ export: true });

async function testSingleFiction() {
  try {
    console.log('🧪 Testing single fiction extraction...');

    const royalroadService = new RoyalRoadService();

    // Test with the fiction we know has status and type
    const fictionResponse = await royalroadService.getFiction('110569');

    if (fictionResponse.success && fictionResponse.data) {
      const fiction = fictionResponse.data;
      console.log('\n📊 Fiction data:');
      console.log(`Title: "${fiction.title}"`);
      console.log(`Author: "${fiction.author.name}"`);
      console.log(`Status: "${fiction.status}"`);
      console.log(`Type: "${fiction.type}"`);
      console.log(`Tags: [${fiction.tags.join(', ')}]`);
      console.log(`Warnings: [${fiction.warnings.join(', ')}]`);
      console.log(`Description preview: "${fiction.description.substring(0, 100)}..."`);

      // Test the stats object
      console.log('\n📈 Stats data:');
      console.log(`Status from stats: "${(fiction.stats as any).status || 'NULL'}"`);
      console.log(`Type from stats: "${(fiction.stats as any).type || 'NULL'}"`);

    } else {
      console.log('❌ Failed to fetch fiction data');
    }

    console.log('\n✅ Single fiction test completed!');

  } catch (error) {
    console.error('❌ Error during single fiction test:', error);
  }
}

testSingleFiction().catch(console.error); 