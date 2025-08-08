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
    
    // Look for the exact pages structure
    console.log('\n🔍 Looking for Pages structure:');
    const pagesSection = html.match(/Pages[^>]*>([\d,]+)<\/li>/);
    console.log('Pages section:', pagesSection);
    
    // Look for the exact pattern like other stats
    console.log('\n🔍 Looking for exact pattern like other stats:');
    const exactPattern = html.match(/Pages[^>]*>([\d,]+)<\/li>/);
    console.log('Exact pattern:', exactPattern);
    
    // Look for the font-red-sunglo pattern for pages
    console.log('\n🔍 Looking for font-red-sunglo pattern for pages:');
    const fontRedPattern = html.match(/font-red-sunglo[^>]*>([\d,]+)<\/li>/g);
    console.log('Font-red-sunglo pattern:', fontRedPattern);
    
    // Look for the exact structure like other stats
    console.log('\n🔍 Looking for exact structure like other stats:');
    const exactStructure = html.match(/Pages[^>]*>([\d,]+)<\/li>/);
    console.log('Exact structure:', exactStructure);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testPagesRegex().catch(console.error); 