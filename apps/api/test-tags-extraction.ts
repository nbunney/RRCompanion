import { config } from 'dotenv';

config({ export: true });

async function testTagsExtraction() {
  try {
    console.log('🔍 Testing tags extraction...');

    const fictionId = '110569';
    const url = `https://www.royalroad.com/fiction/${fictionId}`;

    const response = await fetch(url);
    const html = await response.text();

    console.log('\n📊 Looking for tags patterns...');

    // Look for tags section
    const tagsSectionMatch = html.match(/<span[^>]*class="[^"]*tags[^"]*"[^>]*>([\s\S]*?)<\/span>/);
    if (tagsSectionMatch) {
      console.log('✅ Found tags section:');
      console.log(tagsSectionMatch[0]);

      // Look for individual tag links
      const tagLinks = html.match(/<a[^>]*class="[^"]*fiction-tag[^"]*"[^>]*>([^<]+)<\/a>/g);
      if (tagLinks) {
        console.log(`\n📝 Found ${tagLinks.length} individual tag links:`);
        tagLinks.forEach((link, index) => {
          const tagText = link.replace(/<[^>]*>/g, '').trim();
          console.log(`  ${index + 1}: "${tagText}"`);
        });
      } else {
        console.log('❌ No individual tag links found');
      }
    } else {
      console.log('❌ No tags section found');
    }

    // Look for any span with class containing "tag"
    const tagSpans = html.match(/<span[^>]*class="[^"]*tag[^"]*"[^>]*>([^<]+)<\/span>/g);
    if (tagSpans) {
      console.log(`\n🔍 Found ${tagSpans.length} tag spans:`);
      tagSpans.forEach((span, index) => {
        const tagText = span.replace(/<[^>]*>/g, '').trim();
        console.log(`  ${index + 1}: "${tagText}"`);
      });
    }

    console.log('\n✅ Tags extraction test completed!');

  } catch (error) {
    console.error('❌ Error during tags extraction test:', error);
  }
}

testTagsExtraction().catch(console.error); 