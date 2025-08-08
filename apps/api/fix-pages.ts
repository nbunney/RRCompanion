import { config } from 'dotenv';

config({ export: true });

async function testPagesRegex() {
  try {
    const fictionId = '110569';
    const url = `https://www.royalroad.com/fiction/${fictionId}`;
    console.log(`🌐 Fetching HTML from: ${url}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    
    // Test the current regex
    const currentRegex = /Pages[^>]*>([\d,]+)<\/li>/;
    const currentMatch = html.match(currentRegex);
    console.log('Current regex match:', currentMatch);
    
    // Test the fixed regex (same pattern as other numeric stats)
    const fixedRegex = /Pages[^>]*>([\d,]+)<\/li>/;
    const fixedMatch = html.match(fixedRegex);
    console.log('Fixed regex match:', fixedMatch);
    
    // Test the exact pattern like other stats
    const exactRegex = /Pages[^>]*>([\d,]+)<\/li>/;
    const exactMatch = html.match(exactRegex);
    console.log('Exact regex match:', exactMatch);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testPagesRegex().catch(console.error); 