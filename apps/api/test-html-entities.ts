import { config } from 'dotenv';
import { RoyalRoadService } from './src/services/royalroad.ts';

config({ export: true });

async function testHtmlEntityDecoding() {
  try {
    console.log('🧪 Testing HTML entity decoding...');

    const royalroadService = new RoyalRoadService();

    // Test the decodeHtmlEntities method directly
    const testCases = [
      "Don&#x27;t worry about it",
      "It&#x27;s a test",
      "He said &quot;Hello&quot;",
      "A &amp; B",
      "Less than &lt; and greater than &gt;",
      "&#x27;Single quotes&#x27; and &quot;double quotes&quot;"
    ];

    console.log('\n📝 Testing HTML entity decoding:');
    for (const testCase of testCases) {
      const decoded = (royalroadService as any).decodeHtmlEntities(testCase);
      console.log(`Original: "${testCase}"`);
      console.log(`Decoded:  "${decoded}"`);
      console.log('---');
    }

    // Test with a real fiction page
    console.log('\n🌐 Testing with a real fiction page...');
    const fictionResponse = await royalroadService.getFiction('110569');

    if (fictionResponse.success && fictionResponse.data) {
      const fiction = fictionResponse.data;
      console.log(`Title: "${fiction.title}"`);
      console.log(`Author: "${fiction.author.name}"`);
      console.log(`Status: "${fiction.status}"`);
      console.log(`Type: "${fiction.type}"`);
      console.log(`Description preview: "${fiction.description.substring(0, 100)}..."`);
    } else {
      console.log('❌ Failed to fetch fiction data');
    }

    console.log('\n✅ HTML entity decoding test completed!');

  } catch (error) {
    console.error('❌ Error during HTML entity decoding test:', error);
  }
}

testHtmlEntityDecoding().catch(console.error); 