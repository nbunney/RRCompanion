const axios = require('axios');
const cheerio = require('cheerio');

async function debugFiction() {
  try {
    console.log('🔍 Fetching fiction 122933...');
    const response = await axios.get('https://www.royalroad.com/fiction/122933');
    const $ = cheerio.load(response.data);
    
    console.log('\n=== TITLE ===');
    console.log('H1:', $('h1').first().text().trim());
    
    console.log('\n=== DESCRIPTION ===');
    const description = $('.description').text().trim();
    console.log('Description length:', description.length);
    console.log('Description preview:', description.substring(0, 200) + '...');
    
    console.log('\n=== STATUS AND TYPE ===');
    console.log('Status elements:');
    $('*').each((_, el) => {
      const $el = $(el);
      const text = $el.text().trim();
      if (text === 'ONGOING' || text === 'COMPLETED' || text === 'HIATUS' || text === 'DROPPED') {
        console.log('Found status:', text, 'in element:', $el.prop('tagName'), $el.attr('class'));
      }
      if (text === 'Original' || text === 'Fanfiction') {
        console.log('Found type:', text, 'in element:', $el.prop('tagName'), $el.attr('class'));
      }
    });
    
    console.log('\n=== TAGS ===');
    const tags = [];
    $('.tags a').each((_, element) => {
      const tag = $(element).text().trim();
      if (tag) {
        tags.push(tag);
      }
    });
    console.log('Tags found:', tags);
    
    console.log('\n=== WARNINGS ===');
    const warnings = [];
    $('.warnings a').each((_, element) => {
      const warning = $(element).text().trim();
      if (warning) {
        warnings.push(warning);
      }
    });
    console.log('Warnings found:', warnings);
    
    console.log('\n=== STATS CONTAINER ===');
    const statsContainer = $('.fiction-stats');
    console.log('Stats container found:', statsContainer.length > 0);
    if (statsContainer.length) {
      console.log('Stats container HTML:');
      console.log(statsContainer.html());
      
      console.log('\nStats container text:');
      console.log(statsContainer.text());
    }
    
    console.log('\n=== SCORE ELEMENTS ===');
    const scoreElements = $('[data-content*="/ 5"]');
    console.log('Score elements found:', scoreElements.length);
    scoreElements.each((_, element) => {
      const $el = $(element);
      console.log('Score element:', {
        dataContent: $el.attr('data-content'),
        ariaLabel: $el.attr('aria-label'),
        text: $el.text().trim()
      });
    });
    
    console.log('\n=== COVER IMAGE ===');
    const coverImage = $('img[src*="covers-large"]').first().attr('src');
    console.log('Cover image:', coverImage);
    
    console.log('\n=== ALL IMAGES ===');
    $('img').each((_, img) => {
      const src = $(img).attr('src');
      if (src && src.includes('cover')) {
        console.log('Cover-related image:', src);
      }
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugFiction();
