const axios = require('axios');
const cheerio = require('cheerio');

async function testScraping() {
  try {
    console.log('🔍 Testing scraping logic for fiction 122933...');
    
    const response = await axios.get('https://www.royalroad.com/fiction/122933');
    const $ = cheerio.load(response.data);
    
    const fiction = {
      id: '122933',
      title: '',
      description: '',
      status: '',
      type: '',
      tags: [],
      warnings: [],
      image: '',
      stats: {
        pages: 0,
        ratings: 0,
        followers: 0,
        favorites: 0,
        views: 0,
        score: 0,
        overall_score: 0,
        style_score: 0,
        story_score: 0,
        grammar_score: 0,
        character_score: 0,
        total_views: 0,
        average_views: 0,
      },
    };

    // Extract title
    const titleMatch = $('h1').first().text().trim();
    if (titleMatch) {
      fiction.title = titleMatch;
    }

    // Extract stats
    const statsContainer = $('.fiction-stats');
    if (statsContainer.length) {
      const statsText = statsContainer.text();
      
      // Extract pages
      const pagesMatch = statsText.match(/Pages\s*:\s*(\d+)/i);
      if (pagesMatch) {
        fiction.stats.pages = parseInt(pagesMatch[1]);
      }

      // Extract ratings
      const ratingsMatch = statsText.match(/Ratings\s*:\s*(\d+)/i);
      if (ratingsMatch) {
        fiction.stats.ratings = parseInt(ratingsMatch[1]);
      }

      // Extract followers
      const followersMatch = statsText.match(/Followers\s*:\s*(\d+)/i);
      if (followersMatch) {
        fiction.stats.followers = parseInt(followersMatch[1]);
      }

      // Extract favorites
      const favoritesMatch = statsText.match(/Favorites\s*:\s*(\d+)/i);
      if (favoritesMatch) {
        fiction.stats.favorites = parseInt(favoritesMatch[1]);
      }

      // Extract average views
      const avgViewsMatch = statsText.match(/Average\s*Views\s*:\s*(\d+)/i);
      if (avgViewsMatch) {
        fiction.stats.average_views = parseInt(avgViewsMatch[1]);
      }

      // Extract total views
      const totalViewsMatch = statsText.match(/Total\s*Views\s*:\s*([\d,]+)/i);
      if (totalViewsMatch) {
        fiction.stats.total_views = parseInt(totalViewsMatch[1].replace(/,/g, ''));
      }
    }

    // Extract description
    let description = $('.description').text().trim();
    if (!description) {
      description = $('.fiction-description').text().trim();
    }
    if (description) {
      fiction.description = description.substring(0, 200) + '...';
    }

    // Extract status and type
    $('*').each((_, el) => {
      const $el = $(el);
      const text = $el.text().trim();

      if (text === 'ONGOING' || text === 'COMPLETED' || text === 'HIATUS' || text === 'DROPPED') {
        fiction.status = text;
      }

      if (text === 'Original' || text === 'Fanfiction') {
        fiction.type = text;
      }
    });

    // Extract tags
    const tags = [];
    $('.tags a').each((_, element) => {
      const tag = $(element).text().trim();
      if (tag) {
        tags.push(tag);
      }
    });
    fiction.tags = tags;

    // Extract warnings
    const warnings = [];
    $('.warnings a').each((_, element) => {
      const warning = $(element).text().trim();
      if (warning) {
        warnings.push(warning);
      }
    });
    fiction.warnings = warnings;

    // Extract cover image
    let coverImage = $('img[src*="covers-large"]').first().attr('src');
    if (!coverImage) {
      coverImage = $('.cover img').first().attr('src');
    }
    if (coverImage) {
      fiction.image = coverImage;
    }

    console.log('\n=== SCRAPING RESULTS ===');
    console.log('Title:', fiction.title);
    console.log('Status:', fiction.status);
    console.log('Type:', fiction.type);
    console.log('Pages:', fiction.stats.pages);
    console.log('Ratings:', fiction.stats.ratings);
    console.log('Followers:', fiction.stats.followers);
    console.log('Favorites:', fiction.stats.favorites);
    console.log('Total Views:', fiction.stats.total_views);
    console.log('Average Views:', fiction.stats.average_views);
    console.log('Tags:', fiction.tags);
    console.log('Warnings:', fiction.warnings);
    console.log('Description length:', fiction.description.length);
    console.log('Cover image:', fiction.image ? 'Found' : 'Not found');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testScraping();
