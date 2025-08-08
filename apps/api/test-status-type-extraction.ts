import { config } from 'dotenv';

config({ export: true });

async function testStatusTypeExtraction() {
  try {
    console.log('🔍 Testing status and type extraction...');

    const url = 'https://www.royalroad.com/fiction/110569';
    const response = await fetch(url);
    const html = await response.text();

    console.log('\n📊 Looking for status and type patterns...');

    // Look for fiction-info section
    const fictionInfoMatch = html.match(/<div[^>]*class="[^"]*fiction-info[^"]*"[^>]*>([\s\S]*?)<\/div>/);
    if (fictionInfoMatch) {
      console.log('✅ Found fiction-info section');
      const infoHtml = fictionInfoMatch[1];

      // Look for label spans
      const labelMatches = infoHtml.match(/<span[^>]*class="[^"]*label[^"]*"[^>]*>([^<]+)<\/span>/g);
      if (labelMatches) {
        console.log(`📝 Found ${labelMatches.length} label spans:`);
        labelMatches.forEach((match, index) => {
          const text = match.replace(/<[^>]*>/g, '').trim();
          console.log(`  ${index + 1}: "${text}"`);
        });
      } else {
        console.log('❌ No label spans found in fiction-info section');
      }
    } else {
      console.log('❌ No fiction-info section found');
    }

    // Look for fiction-stats section
    const fictionStatsMatch = html.match(/<div[^>]*class="[^"]*fiction-stats[^"]*"[^>]*>([\s\S]*?)<\/div>/);
    if (fictionStatsMatch) {
      console.log('✅ Found fiction-stats section');
      const statsHtml = fictionStatsMatch[1];

      // Look for label spans
      const labelMatches = statsHtml.match(/<span[^>]*class="[^"]*label[^"]*"[^>]*>([^<]+)<\/span>/g);
      if (labelMatches) {
        console.log(`📝 Found ${labelMatches.length} label spans in stats:`);
        labelMatches.forEach((match, index) => {
          const text = match.replace(/<[^>]*>/g, '').trim();
          console.log(`  ${index + 1}: "${text}"`);
        });
      } else {
        console.log('❌ No label spans found in fiction-stats section');
      }
    } else {
      console.log('❌ No fiction-stats section found');
    }

    // Look for any label spans in the entire HTML
    const allLabelMatches = html.match(/<span[^>]*class="[^"]*label[^"]*"[^>]*>([^<]+)<\/span>/g);
    if (allLabelMatches) {
      console.log(`\n🔍 Found ${allLabelMatches.length} total label spans in HTML:`);
      allLabelMatches.forEach((match, index) => {
        const text = match.replace(/<[^>]*>/g, '').trim();
        console.log(`  ${index + 1}: "${text}"`);
      });
    }

    console.log('\n✅ Status and type extraction test completed!');

  } catch (error) {
    console.error('❌ Error during status and type extraction test:', error);
  }
}

testStatusTypeExtraction().catch(console.error); 