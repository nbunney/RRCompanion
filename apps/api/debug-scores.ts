import { config } from 'dotenv';

config({ export: true });

async function debugScores() {
  try {
    const fictionId = '110569'; // Use the ID from your example
    const url = `https://www.royalroad.com/fiction/${fictionId}`;
    console.log(`🌐 Fetching HTML from: ${url}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    
    // Look for the specific score elements
    console.log('\n🎯 Looking for Overall Score:');
    const overallMatches = html.match(/Overall Score[\s\S]*?data-content="([\d.]+) \/ 5"/g);
    console.log('Overall Score matches:', overallMatches);
    
    console.log('\n🎯 Looking for Style Score:');
    const styleMatches = html.match(/Style Score[\s\S]*?data-content="([\d.]+) \/ 5"/g);
    console.log('Style Score matches:', styleMatches);
    
    console.log('\n🎯 Looking for Story Score:');
    const storyMatches = html.match(/Story Score[\s\S]*?data-content="([\d.]+) \/ 5"/g);
    console.log('Story Score matches:', storyMatches);
    
    console.log('\n🎯 Looking for Grammar Score:');
    const grammarMatches = html.match(/Grammar Score[\s\S]*?data-content="([\d.]+) \/ 5"/g);
    console.log('Grammar Score matches:', grammarMatches);
    
    console.log('\n🎯 Looking for Character Score:');
    const characterMatches = html.match(/Character Score[\s\S]*?data-content="([\d.]+) \/ 5"/g);
    console.log('Character Score matches:', characterMatches);
    
    // Look for the exact span elements
    console.log('\n🔍 Looking for span elements with data-content:');
    const spanMatches = html.match(/<span[^>]*data-content="([\d.]+) \/ 5"[^>]*>/g);
    console.log('Span matches:', spanMatches);
    
    // Look for aria-label patterns
    console.log('\n🔍 Looking for aria-label patterns:');
    const ariaMatches = html.match(/aria-label="[^"]*stars"/g);
    console.log('Aria-label matches:', ariaMatches);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugScores().catch(console.error); 