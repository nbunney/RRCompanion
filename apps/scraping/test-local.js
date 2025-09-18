#!/usr/bin/env node

// Local test script for Royal Road scraping
const { RoyalRoadScrapingService } = require('./src/services/royalroad.ts');

async function testScraping() {
  console.log('🧪 Testing Royal Road scraping locally...');
  
  const scrapingService = new RoyalRoadScrapingService();
  
  try {
    console.log('🔍 Scraping fiction 122933...');
    const result = await scrapingService.scrapeFiction('122933');
    
    if (result) {
      console.log('✅ Scraping successful!');
      console.log('📊 Scraped data:');
      console.log(JSON.stringify(result, null, 2));
      
      console.log('\n📈 Stats breakdown:');
      console.log(`Pages: ${result.stats.pages}`);
      console.log(`Ratings: ${result.stats.ratings}`);
      console.log(`Followers: ${result.stats.followers}`);
      console.log(`Favorites: ${result.stats.favorites}`);
      console.log(`Views: ${result.stats.views}`);
      console.log(`Score: ${result.stats.score}`);
      console.log(`Average Views: ${result.stats.average_views}`);
    } else {
      console.log('❌ Scraping failed - no data returned');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testScraping();
