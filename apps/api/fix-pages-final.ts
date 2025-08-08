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
    
    // Test the correct regex pattern
    const pagesMatch = html.match(/Pages[^>]*>([\d,]+)<\/li>/);
    console.log('Pages match:', pagesMatch);
    
    if (pagesMatch) {
      const pages = parseInt(pagesMatch[1].replace(/,/g, ''));
      console.log('Pages value:', pages);
    } else {
      console.log('No pages match found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testPagesRegex().catch(console.error); 