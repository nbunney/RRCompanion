import axios, { AxiosInstance, AxiosResponse } from 'axios';
import * as cheerio from 'cheerio';
import { getScrapingConfig, handleScrapingError, createTimeoutAwareDelay } from '../utils/config';
import { RoyalRoadFiction, RoyalRoadChapter, RisingStarEntry } from '../types';

export class RoyalRoadScrapingService {
  private httpClient: AxiosInstance;
  private config = getScrapingConfig();

  constructor() {
    this.httpClient = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'User-Agent': this.config.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      }
    });

    // Add request interceptor for delay
    this.httpClient.interceptors.request.use(async (config) => {
      await createTimeoutAwareDelay(this.config.requestDelay, 300000, Date.now());
      return config;
    });
  }

  // Helper function to decode HTML entities
  private decodeHtmlEntities(text: string): string {
    if (!text) return text;

    const entities: { [key: string]: string } = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&nbsp;': ' ',
      '&ndash;': '–',
      '&mdash;': '—',
      '&hellip;': '…',
      '&copy;': '©',
      '&reg;': '®',
      '&trade;': '™'
    };

    return text.replace(/&[a-zA-Z0-9#]+;/g, (entity) => {
      return entities[entity] || entity;
    });
  }

  // Extract number from text (handles commas, spaces, etc.)
  private extractNumber(text: string): number {
    if (!text) return 0;
    const cleaned = text.replace(/[,\s]/g, '');
    const match = cleaned.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  }

  // Extract score from text
  private extractScore(text: string): number {
    if (!text) return 0;
    const match = text.match(/(\d+\.?\d*)/);
    return match ? parseFloat(match[1]) : 0;
  }

  // Scrape Rising Stars main page
  async scrapeRisingStarsMain(): Promise<RisingStarEntry[]> {
    try {
      console.log('🔍 Scraping Rising Stars main page...');

      const response = await this.httpClient.get('/fictions/rising-stars');
      const $ = cheerio.load(response.data);

      const entries: RisingStarEntry[] = [];
      const capturedAt = new Date().toISOString();

      $('.fiction-list-item').each((index, element) => {
        const $el = $(element);

        // Extract position (index + 1)
        const position = index + 1;

        // Extract Royal Road ID from URL
        const fictionLink = $el.find('a').attr('href');
        const royalroadIdMatch = fictionLink?.match(/\/fiction\/(\d+)/);
        const royalroadId = royalroadIdMatch ? royalroadIdMatch[1] : null;

        if (!royalroadId) return;

        // Extract title
        const title = this.decodeHtmlEntities($el.find('.fiction-title').text().trim());

        // Extract author
        const authorName = this.decodeHtmlEntities($el.find('.author').text().trim());

        // Extract image URL
        const imageUrl = $el.find('img').attr('src');

        entries.push({
          fiction_id: 0, // Will be set when fiction is created in database
          royalroad_id: royalroadId,
          title,
          author_name: authorName,
          genre: 'main',
          position,
          captured_at: capturedAt,
          image_url: imageUrl
        });
      });

      console.log(`✅ Scraped ${entries.length} Rising Stars entries`);
      return entries;
    } catch (error) {
      console.error('❌ Error scraping Rising Stars main:', error);
      throw handleScrapingError(error);
    }
  }

  // Scrape Rising Stars for all genres
  async scrapeRisingStarsAll(): Promise<RisingStarEntry[]> {
    try {
      console.log('🔍 Scraping Rising Stars for all genres...');

      // All genres and tags that need to be scraped
      const genres = [
        // Main Royal Road genres
        'action', 'adventure', 'comedy', 'contemporary', 'drama', 'fantasy',
        'historical', 'horror', 'mystery', 'psychological', 'romance',
        'satire', 'sci-fi', 'short-story', 'tragedy',
        // Additional tags/characteristics
        'anti-hero_lead', 'artificial_intelligence', 'attractive_lead', 'cyberpunk',
        'dungeon', 'dystopia', 'female_lead', 'first_contact', 'gamelit',
        'gender_bender', "genetically_engineered%20", 'grimdark', 'harem',
        'high_fantasy', 'litrpg', 'loop', 'low_fantasy', 'male_lead',
        'martial_arts', 'multiple_lead', 'mythos', 'non-human_lead',
        'post_apocalyptic', 'progression', 'reader_interactive', 'reincarnation',
        'ruling_class', 'school_life', 'sci_fi', 'secret_identity',
        'slice_of_life', 'soft_sci-fi', 'space_opera', 'sports',
        'steampunk', 'strong_lead', 'summoned_hero', 'super_heroes',
        'supernatural', 'technologically_engineered', 'time_travel',
        'urban_fantasy', 'villainous_lead', 'virtual_reality',
        'war_and_military', 'wuxia', 'xianxia', 'one_shot'
      ];

      const allEntries: RisingStarEntry[] = [];
      const capturedAt = new Date().toISOString();

      for (const genre of genres) {
        try {
          console.log(`🔍 Scraping Rising Stars for genre: ${genre}`);

          // Updated URL format to use query parameter
          const response = await this.httpClient.get(`/fictions/rising-stars?genre=${genre}`);
          const $ = cheerio.load(response.data);

          $('.fiction-list-item').each((index, element) => {
            const $el = $(element);

            const position = index + 1;
            const fictionLink = $el.find('a').attr('href');
            const royalroadIdMatch = fictionLink?.match(/\/fiction\/(\d+)/);
            const royalroadId = royalroadIdMatch ? royalroadIdMatch[1] : null;

            if (!royalroadId) return;

            const title = this.decodeHtmlEntities($el.find('.fiction-title').text().trim());
            const authorName = this.decodeHtmlEntities($el.find('.author').text().trim());
            const imageUrl = $el.find('img').attr('src');

            allEntries.push({
              fiction_id: 0, // Will be set when fiction is created in database
              royalroad_id: royalroadId,
              title,
              author_name: authorName,
              genre,
              position,
              captured_at: capturedAt,
              image_url: imageUrl
            });
          });

          console.log(`✅ Scraped ${$('.fiction-list-item').length} entries for ${genre}`);

          // Add delay between genre requests
          await createTimeoutAwareDelay(this.config.requestDelay, 300000, Date.now());
        } catch (error) {
          console.error(`❌ Error scraping genre ${genre}:`, error);
          // Continue with other genres
        }
      }

      console.log(`✅ Total scraped ${allEntries.length} Rising Stars entries across all genres`);
      return allEntries;
    } catch (error) {
      console.error('❌ Error scraping Rising Stars all:', error);
      throw handleScrapingError(error);
    }
  }

  // Scrape individual fiction
  async scrapeFiction(royalroadId: string): Promise<RoyalRoadFiction | null> {
    try {
      console.log(`🔍 Scraping fiction ${royalroadId}...`);

      const response = await this.httpClient.get(`/fiction/${royalroadId}`);
      const $ = cheerio.load(response.data);

      const fiction: RoyalRoadFiction = {
        id: royalroadId,
        title: '',
        author: {
          name: 'Unknown Author',
          id: '',
          avatar: '',
        },
        description: '',
        image: '',
        status: '',
        tags: [],
        warnings: [],
        type: '',
        chapters: [],
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
        fiction.title = this.decodeHtmlEntities(titleMatch);
      }

      // Extract author information
      const authorLink = $('a[href*="/profile/"]').first();
      if (authorLink.length) {
        fiction.author.name = this.decodeHtmlEntities(authorLink.text().trim());
        const authorIdMatch = authorLink.attr('href')?.match(/\/profile\/(\d+)/);
        if (authorIdMatch) {
          fiction.author.id = authorIdMatch[1];
        }
        fiction.author.avatar = authorLink.find('img').attr('src') || '';
      }

      // Extract description
      const descriptionEl = $('.description').first();
      if (descriptionEl.length) {
        fiction.description = this.decodeHtmlEntities(descriptionEl.text().trim());
      }

      // Extract image
      const imageEl = $('.cover img').first();
      if (imageEl.length) {
        fiction.image = imageEl.attr('src') || '';
      }

      // Extract status
      const statusEl = $('.status').first();
      if (statusEl.length) {
        fiction.status = statusEl.text().trim();
      }

      // Extract tags
      $('.tags a').each((_, element) => {
        const tag = $(element).text().trim();
        if (tag) {
          fiction.tags.push(tag);
        }
      });

      // Extract warnings
      $('.warnings a').each((_, element) => {
        const warning = $(element).text().trim();
        if (warning) {
          fiction.warnings.push(warning);
        }
      });

      // Extract type
      const typeEl = $('.type').first();
      if (typeEl.length) {
        fiction.type = typeEl.text().trim();
      }

      // Extract stats - Updated for current Royal Road HTML structure
      let statsContainer = $('.fiction-stats');
      if (statsContainer.length === 0) {
        // Try alternative selector
        statsContainer = $('.stats-content');
      }

      console.log(`🔍 Stats container found: ${statsContainer.length} elements`);
      if (statsContainer.length > 0) {
        console.log(`📊 Stats container HTML:`, statsContainer.html());
      }

      if (statsContainer.length) {
        // Look for stats in the fiction-stats container
        const statsText = statsContainer.text();

        // Extract pages (look for "Pages :" pattern)
        const pagesMatch = statsText.match(/Pages\s*:\s*([\d,]+)/i);
        if (pagesMatch) {
          fiction.stats.pages = parseInt(pagesMatch[1].replace(/,/g, ''));
        }

        // Extract ratings count (look for "Ratings :" pattern)
        const ratingsMatch = statsText.match(/Ratings\s*:\s*([\d,]+)/i);
        if (ratingsMatch) {
          fiction.stats.ratings = parseInt(ratingsMatch[1].replace(/,/g, ''));
        }

        // Extract followers (look for "Followers :" pattern)
        const followersMatch = statsText.match(/Followers\s*:\s*([\d,]+)/i);
        if (followersMatch) {
          fiction.stats.followers = parseInt(followersMatch[1].replace(/,/g, ''));
        }

        // Extract favorites (look for "Favorites :" pattern)
        const favoritesMatch = statsText.match(/Favorites\s*:\s*([\d,]+)/i);
        if (favoritesMatch) {
          fiction.stats.favorites = parseInt(favoritesMatch[1].replace(/,/g, ''));
        }

        // Extract average views (look for "Average Views :" pattern)
        const avgViewsMatch = statsText.match(/Average\s*Views\s*:\s*([\d,]+)/i);
        if (avgViewsMatch) {
          fiction.stats.average_views = parseInt(avgViewsMatch[1].replace(/,/g, ''));
        }

        // Extract total views (look for "Total Views :" pattern)
        const totalViewsMatch = statsText.match(/Total\s*Views\s*:\s*([\d,]+)/i);
        if (totalViewsMatch) {
          fiction.stats.total_views = parseInt(totalViewsMatch[1].replace(/,/g, ''));
        }

        // Extract views (if present)
        const viewsMatch = statsText.match(/([\d,]+)\s*Views?/i);
        if (viewsMatch) {
          fiction.stats.views = parseInt(viewsMatch[1].replace(/,/g, ''));
        }

        // Extract overall score from data-content attribute (4.61 / 5)
        const scoreElement = statsContainer.find('[data-content*="/ 5"]').first();
        if (scoreElement.length) {
          const dataContent = scoreElement.attr('data-content');
          const scoreMatch = dataContent?.match(/(\d+\.\d+)\s*\/\s*5/);
          if (scoreMatch) {
            const score = parseFloat(scoreMatch[1]);
            // Royal Road scores are 0-5, cap to that range
            fiction.stats.overall_score = Math.min(Math.max(score, 0), 5);
          }
        }

        // Fallback: try to find overall score in text
        if (fiction.stats.overall_score === 0) {
          const scoreMatch = statsText.match(/(\d+\.\d+)\s*\/\s*5/i);
          if (scoreMatch) {
            const score = parseFloat(scoreMatch[1]);
            fiction.stats.overall_score = Math.min(Math.max(score, 0), 5);
          }
        }
      }

      // Extract detailed scores - Multiple approaches based on HTML structure

      // Approach 1: Look for spans with data-original-title attributes
      const scoreSpans = statsContainer.find('span[data-original-title]');

      scoreSpans.each((_, element) => {
        const $el = $(element);
        const originalTitle = $el.attr('data-original-title');
        const ariaLabel = $el.attr('aria-label');
        const dataContent = $el.attr('data-content');

        // Try to extract score from aria-label first (e.g., "4.5 stars")
        let score = 0;
        if (ariaLabel) {
          const ariaMatch = ariaLabel.match(/(\d+\.?\d*)\s*stars?/);
          if (ariaMatch) {
            score = parseFloat(ariaMatch[1]);
          }
        }

        // Fallback to data-content if aria-label doesn't work
        if (score === 0 && dataContent) {
          const contentMatch = dataContent.match(/(\d+\.?\d*)\s*\/\s*5/);
          if (contentMatch) {
            score = parseFloat(contentMatch[1]);
          }
        }

        if (score > 0) {
          if (originalTitle === 'Style Score') {
            fiction.stats.style_score = score;
          } else if (originalTitle === 'Story Score') {
            fiction.stats.story_score = score;
          } else if (originalTitle === 'Grammar Score') {
            fiction.stats.grammar_score = score;
          } else if (originalTitle === 'Character Score') {
            fiction.stats.character_score = score;
          }
        }
      });

      // Approach 2: Direct regex on the stats container HTML
      if (fiction.stats.style_score === 0) {
        const statsHtml = statsContainer.html();

        // Look for specific patterns in the HTML
        const styleMatch = statsHtml.match(/data-original-title="Style Score"[^>]*aria-label="(\d+\.?\d*)\s*stars?"/);
        if (styleMatch) {
          fiction.stats.style_score = parseFloat(styleMatch[1]);
        }

        const storyMatch = statsHtml.match(/data-original-title="Story Score"[^>]*aria-label="(\d+\.?\d*)\s*stars?"/);
        if (storyMatch) {
          fiction.stats.story_score = parseFloat(storyMatch[1]);
        }

        const grammarMatch = statsHtml.match(/data-original-title="Grammar Score"[^>]*aria-label="(\d+\.?\d*)\s*stars?"/);
        if (grammarMatch) {
          fiction.stats.grammar_score = parseFloat(grammarMatch[1]);
        }

        const characterMatch = statsHtml.match(/data-original-title="Character Score"[^>]*aria-label="(\d+\.?\d*)\s*stars?"/);
        if (characterMatch) {
          fiction.stats.character_score = parseFloat(characterMatch[1]);
        }
      }

      // Approach 3: Fallback to entire page HTML if stats container doesn't work
      if (fiction.stats.style_score === 0) {
        const pageHtml = $.html();

        // Look for specific score patterns in the page HTML
        const styleMatch = pageHtml.match(/data-original-title="Style Score"[^>]*aria-label="(\d+\.?\d*)\s*stars?"/);
        if (styleMatch) {
          fiction.stats.style_score = parseFloat(styleMatch[1]);
        }

        const storyMatch = pageHtml.match(/data-original-title="Story Score"[^>]*aria-label="(\d+\.?\d*)\s*stars?"/);
        if (storyMatch) {
          fiction.stats.story_score = parseFloat(storyMatch[1]);
        }

        const grammarMatch = pageHtml.match(/data-original-title="Grammar Score"[^>]*aria-label="(\d+\.?\d*)\s*stars?"/);
        if (grammarMatch) {
          fiction.stats.grammar_score = parseFloat(grammarMatch[1]);
        }

        const characterMatch = pageHtml.match(/data-original-title="Character Score"[^>]*aria-label="(\d+\.?\d*)\s*stars?"/);
        if (characterMatch) {
          fiction.stats.character_score = parseFloat(characterMatch[1]);
        }
      }

      // If no detailed scores found, try to extract from the stats text
      if (fiction.stats.overall_score === 0 && fiction.stats.style_score === 0) {
        const statsText = statsContainer.text();

        // Look for score patterns in the text
        const overallMatch = statsText.match(/Overall\s*Score[:\s]*(\d+\.?\d*)/i);
        if (overallMatch) {
          fiction.stats.overall_score = parseFloat(overallMatch[1]);
        }

        const styleMatch = statsText.match(/Style\s*Score[:\s]*(\d+\.?\d*)/i);
        if (styleMatch) {
          fiction.stats.style_score = parseFloat(styleMatch[1]);
        }

        const storyMatch = statsText.match(/Story\s*Score[:\s]*(\d+\.?\d*)/i);
        if (storyMatch) {
          fiction.stats.story_score = parseFloat(storyMatch[1]);
        }

        const grammarMatch = statsText.match(/Grammar\s*Score[:\s]*(\d+\.?\d*)/i);
        if (grammarMatch) {
          fiction.stats.grammar_score = parseFloat(grammarMatch[1]);
        }

        const characterMatch = statsText.match(/Character\s*Score[:\s]*(\d+\.?\d*)/i);
        if (characterMatch) {
          fiction.stats.character_score = parseFloat(characterMatch[1]);
        }
      }

      // Extract metadata (description, status, type, tags, warnings)
      // Description - try multiple selectors
      let description = $('.description').text().trim();
      if (!description) {
        // Try alternative selectors for description
        description = $('.fiction-description').text().trim();
      }
      if (!description) {
        // Look for description in the main content area
        description = $('.col-lg-8 .row .col-lg-8').text().trim();
      }
      if (description) {
        fiction.description = this.decodeHtmlEntities(description);
      }

      // Extract fiction cover image - try multiple selectors
      let coverImage = $('img[src*="covers-large"]').first().attr('src');
      if (!coverImage) {
        coverImage = $('.cover img').first().attr('src');
      }
      if (!coverImage) {
        coverImage = $('img[src*="cover"]').first().attr('src');
      }
      if (coverImage) {
        fiction.image = coverImage;
      }

      // Status and Type - look for elements containing these values
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

      // Tags - try multiple selectors
      const tags: string[] = [];
      $('.tags a').each((_, element) => {
        const tag = $(element).text().trim();
        if (tag) {
          tags.push(tag);
        }
      });

      // If no tags found with .tags a, try looking for tag-like elements
      if (tags.length === 0) {
        $('a[href*="/fictions/"]').each((_, element) => {
          const $el = $(element);
          const href = $el.attr('href');
          const text = $el.text().trim();
          // Skip if it's a chapter link or other non-tag link
          if (href && href.includes('/fictions/') && !href.includes('/chapter/') && text) {
            tags.push(text);
          }
        });
      }
      fiction.tags = tags;

      // Warnings - try multiple selectors based on current Royal Road structure
      const warnings: string[] = [];

      // Approach 1: Look for warnings in list items (current structure)
      $('.list-inline li').each((_, element) => {
        const warning = $(element).text().trim();
        if (warning && warning !== 'Warning' && warning !== 'This fiction contains:') {
          warnings.push(warning);
        }
      });

      // Approach 2: Look for warnings in warning-specific containers
      if (warnings.length === 0) {
        $('.warnings a').each((_, element) => {
          const warning = $(element).text().trim();
          if (warning) {
            warnings.push(warning);
          }
        });
      }

      // Approach 3: Look for warning text patterns in the page
      if (warnings.length === 0) {
        $('*').each((_, el) => {
          const $el = $(el);
          const text = $el.text().trim();
          if (text.includes('Warning') && text.includes('This fiction contains:')) {
            // Extract warning text from the pattern
            const warningMatch = text.match(/This fiction contains:\s*(.+)/i);
            if (warningMatch) {
              const warningText = warningMatch[1].trim();
              // Split by common separators and clean up
              const warningList = warningText.split(/[,;]/).map(w => w.trim()).filter(w => w);
              warningList.forEach(warning => {
                if (!warnings.includes(warning)) {
                  warnings.push(warning);
                }
              });
            }
          }
        });
      }

      // Approach 4: Look for specific warning types in the page
      if (warnings.length === 0) {
        const commonWarnings = ['Graphic Violence', 'Profanity', 'Sexual Content', 'Gore', 'Torture', 'Rape', 'Suicide'];
        commonWarnings.forEach(warning => {
          if ($(`*:contains("${warning}")`).length > 0) {
            warnings.push(warning);
          }
        });
      }
      fiction.warnings = warnings;

      // Extract chapters
      $('.chapter-row').each((_, element) => {
        const $chapter = $(element);
        const link = $chapter.find('a').attr('href');
        const title = $chapter.find('.chapter-title').text().trim();
        const date = $chapter.find('.chapter-date').text().trim();
        const views = $chapter.find('.chapter-views').text().trim();
        const words = $chapter.find('.chapter-words').text().trim();

        if (link && title) {
          const chapterIdMatch = link.match(/\/fiction\/(\d+)\/chapter\/(\d+)/);
          const chapterId = chapterIdMatch ? chapterIdMatch[2] : '';

          fiction.chapters.push({
            id: chapterId,
            title: this.decodeHtmlEntities(title),
            url: link,
            date: date,
            views: this.extractNumber(views),
            words: this.extractNumber(words)
          });
        }
      });

      console.log(`✅ Successfully scraped fiction: ${fiction.title}`);
      return fiction;
    } catch (error: any) {
      // Handle 404s (deleted stories) more gracefully
      if (error.response?.status === 404) {
        console.log(`📚 Fiction ${royalroadId} not found (likely deleted)`);
        return null; // Return null instead of throwing for deleted stories
      }
      console.error(`❌ Error scraping fiction ${royalroadId}:`, error);
      throw handleScrapingError(error);
    }
  }

  // Scrape fiction history (for tracking changes over time)
  async scrapeFictionHistory(royalroadId: string): Promise<any> {
    try {
      console.log(`🔍 Scraping fiction history for ${royalroadId}...`);

      const fiction = await this.scrapeFiction(royalroadId);
      if (!fiction) {
        return null;
      }

      return {
        royalroad_id: royalroadId,
        title: fiction.title,
        image_url: fiction.image,
        pages: fiction.stats.pages,
        ratings: fiction.stats.ratings,
        followers: fiction.stats.followers,
        favorites: fiction.stats.favorites,
        views: fiction.stats.views,
        score: fiction.stats.score,
        overall_score: fiction.stats.overall_score,
        style_score: fiction.stats.style_score,
        story_score: fiction.stats.story_score,
        grammar_score: fiction.stats.grammar_score,
        character_score: fiction.stats.character_score,
        total_views: fiction.stats.total_views,
        average_views: fiction.stats.average_views,
        description: fiction.description,
        status: fiction.status,
        type: fiction.type,
        tags: fiction.tags,
        warnings: fiction.warnings,
        captured_at: new Date().toISOString()
      };
    } catch (error) {
      console.error(`❌ Error scraping fiction history for ${royalroadId}:`, error);
      throw handleScrapingError(error);
    }
  }
}
