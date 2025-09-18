#!/usr/bin/env node

// Test script for Rising Stars genre scraping
const { RoyalRoadScrapingService } = require('./src/services/royalroad.ts');

async function testGenreScraping() {
  console.log('🧪 Testing Rising Stars genre scraping...');
  
  const scrapingService = new RoyalRoadScrapingService();
  
  try {
    console.log('🔍 Testing fantasy genre...');
    const response = await scrapingService.httpClient.get('/fictions/rising-stars?genre=fantasy');
    console.log(`✅ Got response: ${response.data.length} characters`);
    
    const cheerio = require('cheerio');
    const $ = cheerio.load(response.data);
    
    const fictionItems = $('.fiction-list-item');
    console.log(`📚 Found ${fictionItems.length} fiction items`);
    
    if (fictionItems.length > 0) {
      const firstItem = $(fictionItems[0]);
      const title = firstItem.find('.fiction-title').text().trim();
      const author = firstItem.find('.author').text().trim();
      const link = firstItem.find('a').attr('href');
      console.log(`📖 First fiction: "${title}" by ${author}`);
      console.log(`🔗 Link: ${link}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testGenreScraping();
