import { config } from 'dotenv';

config({ export: true });

async function debugPages() {
  try {
    const fictionId = '110569'; // Use the ID from your example
    const url = `https://www.royalroad.com/fiction/${fictionId}`;
    console.log(`🌐 Fetching HTML from: ${url}`);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();

    // Look for the specific pages section
    console.log('\n📄 Looking for Pages section:');
    const pagesSectionMatch = html.match(/Pages[^>]*>([\d,]+)<\/li>/);
    console.log('Pages section match:', pagesSectionMatch);

    // Look for the exact structure
    console.log('\n🔍 Looking for exact pages structure:');
    const pagesMatches = html.match(/Pages[^>]*>([\d,]+)<\/li>/g);
    console.log('Pages matches:', pagesMatches);

    // Look for the font-red-sunglo pattern for pages
    console.log('\n🔍 Looking for font-red-sunglo pattern for pages:');
    const fontRedMatches = html.match(/font-red-sunglo[^>]*>([\d,]+)<\/li>/g);
    console.log('Font-red-sunglo matches:', fontRedMatches);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugPages().catch(console.error); 