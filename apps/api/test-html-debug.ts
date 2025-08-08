import { config } from 'dotenv';

config({ export: true });

async function debugHtml() {
  try {
    const fictionId = '110569'; // Use the ID from your example
    const url = `https://www.royalroad.com/fiction/${fictionId}`;
    console.log(`🌐 Fetching HTML from: ${url}`);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();

    // Look for the statistics section
    const statsSectionMatch = html.match(/<div class="portlet light">[\s\S]*?<div class="portlet-body fiction-stats">[\s\S]*?<\/div>/);

    if (statsSectionMatch) {
      console.log('📊 Found statistics section:');
      console.log(statsSectionMatch[0]);
    } else {
      console.log('❌ Could not find statistics section');
    }

    // Look for score patterns
    const scoreMatches = html.match(/data-content="([\d.]+) \/ 5"/g);
    console.log('🎯 Score matches found:', scoreMatches);

    // Look for numeric stats
    const numericMatches = html.match(/font-red-sunglo[^>]*>([\d,]+)<\/li>/g);
    console.log('📈 Numeric matches found:', numericMatches);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugHtml().catch(console.error); 