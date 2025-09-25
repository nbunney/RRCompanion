const axios = require('axios');
const cheerio = require('cheerio');

async function testScraping() {
  try {
    console.log('🔍 Testing Royal Road scraping for fiction 122933...');
    
    const response = await axios.get('https://www.royalroad.com/fiction/122933', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      timeout: 30000
    });

    const $ = cheerio.load(response.data);
    
    console.log('✅ Page loaded successfully');
    console.log('📄 Page title:', $('title').text());
    
    // Check for title
    const title = $('h1').first().text().trim();
    console.log('📚 Title found:', title);
    
    // Check for author
    const authorLink = $('a[href*="/profile/"]').first();
    console.log('👤 Author found:', authorLink.text().trim());
    
    // Check for stats container
    let statsContainer = $('.fiction-stats');
    if (statsContainer.length === 0) {
      statsContainer = $('.stats-content');
    }
    console.log('📊 Stats container found:', statsContainer.length, 'elements');
    
    if (statsContainer.length > 0) {
      console.log('📊 Stats container HTML preview:', statsContainer.html().substring(0, 500));
      
      const statsText = statsContainer.text();
      console.log('📊 Stats text preview:', statsText.substring(0, 300));
      
      // Test specific extractions
      const pagesMatch = statsText.match(/Pages\s*:\s*(\d+)/i);
      console.log('📄 Pages match:', pagesMatch ? pagesMatch[1] : 'Not found');
      
      const followersMatch = statsText.match(/Followers\s*:\s*(\d+)/i);
      console.log('👥 Followers match:', followersMatch ? followersMatch[1] : 'Not found');
      
      const ratingsMatch = statsText.match(/Ratings\s*:\s*(\d+)/i);
      console.log('⭐ Ratings match:', ratingsMatch ? ratingsMatch[1] : 'Not found');
    }
    
    // Check for score elements
    const scoreSpans = $('span[data-original-title]');
    console.log('⭐ Score spans found:', scoreSpans.length);
    
    scoreSpans.each((i, element) => {
      const $el = $(element);
      const title = $el.attr('data-original-title');
      const ariaLabel = $el.attr('aria-label');
      console.log(`⭐ Score ${i}: title="${title}", aria-label="${ariaLabel}"`);
    });
    
    // Check for description
    const description = $('.description').text().trim();
    console.log('📝 Description found:', description ? description.substring(0, 100) + '...' : 'Not found');
    
    // Check for tags
    const tags = [];
    $('.tags a').each((_, element) => {
      const tag = $(element).text().trim();
      if (tag) tags.push(tag);
    });
    console.log('🏷️ Tags found:', tags);
    
  } catch (error) {
    console.error('❌ Error testing scraping:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    }
  }
}

testScraping();
