#!/usr/bin/env node

// Debug script to see the exact HTML text we're parsing
const axios = require('axios');
const cheerio = require('cheerio');

async function debugHtml() {
  console.log('🔍 Debugging Royal Road HTML structure...');
  
  try {
    const response = await axios.get('https://www.royalroad.com/fiction/122933');
    const $ = cheerio.load(response.data);
    
    console.log('📄 Page title:', $('title').text());
    
    // Look for stats container
    const statsContainer = $('.fiction-stats');
    if (statsContainer.length) {
      console.log('\n📊 Found .fiction-stats container:');
      console.log('Raw HTML:', statsContainer.html());
      console.log('\n📝 Text content:');
      console.log(statsContainer.text());
      
      // Look for specific patterns
      const statsText = statsContainer.text();
      console.log('\n🔍 Pattern matching:');
      
      // Test different patterns
      const patterns = [
        { name: 'Pages', pattern: /(\d+)\s*Pages?/gi },
        { name: 'Ratings', pattern: /(\d+)\s*Ratings?/gi },
        { name: 'Followers', pattern: /(\d+)\s*Followers?/gi },
        { name: 'Favorites', pattern: /(\d+)\s*Favorites?/gi },
        { name: 'Average Views', pattern: /(\d+)\s*(?:Average\s*Views?|Avg\s*Views?)/gi },
        { name: 'Score', pattern: /(\d+\.\d+)\s*(?:★|stars?|rating|score)/gi }
      ];
      
      patterns.forEach(({ name, pattern }) => {
        const matches = statsText.match(pattern);
        if (matches) {
          console.log(`${name}: ${matches.join(', ')}`);
        } else {
          console.log(`${name}: No matches found`);
        }
      });
      
      // Look for all numbers in the text
      console.log('\n🔢 All numbers found:');
      const allNumbers = statsText.match(/\d+/g);
      if (allNumbers) {
        console.log(allNumbers.join(', '));
      }
      
      // Look for detailed score breakdown
      console.log('\n⭐ Looking for detailed scores...');
      const scoreElements = statsContainer.find('[data-content*="/ 5"]');
      console.log(`Found ${scoreElements.length} score elements:`);
      scoreElements.each((i, el) => {
        const $el = $(el);
        const dataContent = $el.attr('data-content');
        const ariaLabel = $el.attr('aria-label');
        console.log(`  Score ${i}: data-content="${dataContent}", aria-label="${ariaLabel}"`);
      });
      
      // Look for description, status, type, tags, warnings
      console.log('\n📝 Looking for metadata...');
      
      // Try different selectors for description
      const descriptionSelectors = ['.fiction-description', '.description', '.fiction-summary', '.summary', '.fiction-content'];
      let description = '';
      for (const selector of descriptionSelectors) {
        const text = $(selector).text().trim();
        if (text.length > description.length) {
          description = text;
          console.log(`Found description with selector "${selector}": ${text.length} chars`);
        }
      }
      console.log(`Description preview: ${description.substring(0, 200)}...`);
      
      // Look for status
      const statusSelectors = ['.fiction-status', '.status', '.fiction-state', '.state'];
      let status = '';
      for (const selector of statusSelectors) {
        const text = $(selector).text().trim();
        if (text && text.length > status.length) {
          status = text;
          console.log(`Found status with selector "${selector}": "${text}"`);
        }
      }
      
      // Look for type
      const typeSelectors = ['.fiction-type', '.type', '.fiction-category', '.category'];
      let type = '';
      for (const selector of typeSelectors) {
        const text = $(selector).text().trim();
        if (text && text.length > type.length) {
          type = text;
          console.log(`Found type with selector "${selector}": "${text}"`);
        }
      }
      
      // Look for tags
      const tagSelectors = ['.fiction-tags a', '.tags a', '.fiction-genre a', '.genre a', '.tag a'];
      let tags = [];
      for (const selector of tagSelectors) {
        const foundTags = $(selector).map((i, el) => $(el).text().trim()).get();
        if (foundTags.length > tags.length) {
          tags = foundTags;
          console.log(`Found tags with selector "${selector}": [${foundTags.join(', ')}]`);
        }
      }
      
      // Look for warnings
      const warningSelectors = ['.fiction-warnings a', '.warnings a', '.fiction-warning a', '.warning a'];
      let warnings = [];
      for (const selector of warningSelectors) {
        const foundWarnings = $(selector).map((i, el) => $(el).text().trim()).get();
        if (foundWarnings.length > warnings.length) {
          warnings = foundWarnings;
          console.log(`Found warnings with selector "${selector}": [${foundWarnings.join(', ')}]`);
        }
      }
      
      // Look for image elements
      console.log('\n🖼️ Looking for image elements...');
      const imageSelectors = [
        '.fiction-cover img',
        '.cover img', 
        '.fiction-image img',
        '.image img',
        'img[src*="royalroad"]',
        'img[src*="fiction"]'
      ];
      
      imageSelectors.forEach(selector => {
        const images = $(selector);
        console.log(`Found ${images.length} images with selector "${selector}"`);
        images.each((i, img) => {
          const $img = $(img);
          const src = $img.attr('src');
          const alt = $img.attr('alt');
          console.log(`  Image ${i}: src="${src}", alt="${alt}"`);
        });
      });
      
      // Look for any elements that might contain this data
      console.log('\n🔍 Looking for any elements with relevant text...');
      
      // Find elements containing "ONGOING"
      $('*').each((i, el) => {
        const $el = $(el);
        const text = $el.text().trim();
        if (text === 'ONGOING' || text === 'Original') {
          console.log(`Found "${text}" in element: ${el.tagName}.${el.className}`);
        }
      });
      
      // Look for status/type patterns
      const allText = $('body').text();
      const statusPatterns = [
        /Status[:\s]*([A-Z]+)/i,
        /Type[:\s]*([A-Za-z]+)/i,
        /State[:\s]*([A-Z]+)/i
      ];
      
      statusPatterns.forEach((pattern, i) => {
        const matches = allText.match(pattern);
        if (matches) {
          console.log(`Status pattern ${i}: ${matches.join(' -> ')}`);
        }
      });
      
    } else {
      console.log('❌ No .fiction-stats container found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugHtml();
