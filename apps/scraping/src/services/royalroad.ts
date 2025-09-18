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

      const genres = [
        'fantasy', 'sci-fi', 'romance', 'action', 'adventure', 'comedy', 'drama',
        'horror', 'mystery', 'psychological', 'slice-of-life', 'tragedy', 'xianxia',
        'xuanhuan', 'wuxia', 'system', 'litrpg', 'game', 'virtual-reality'
      ];

      const allEntries: RisingStarEntry[] = [];
      const capturedAt = new Date().toISOString();

      for (const genre of genres) {
        try {
          console.log(`🔍 Scraping Rising Stars for genre: ${genre}`);

          const response = await this.httpClient.get(`/fictions/rising-stars/${genre}`);
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
      const statsContainer = $('.fiction-stats');
      if (statsContainer.length) {
        // Look for stats in the fiction-stats container
        const statsText = statsContainer.text();

        // Extract pages (look for "Pages :" pattern)
        const pagesMatch = statsText.match(/Pages\s*:\s*(\d+)/i);
        if (pagesMatch) {
          fiction.stats.pages = parseInt(pagesMatch[1]);
        }

        // Extract ratings count (look for "Ratings :" pattern)
        const ratingsMatch = statsText.match(/Ratings\s*:\s*(\d+)/i);
        if (ratingsMatch) {
          fiction.stats.ratings = parseInt(ratingsMatch[1]);
        }

        // Extract followers (look for "Followers :" pattern)
        const followersMatch = statsText.match(/Followers\s*:\s*(\d+)/i);
        if (followersMatch) {
          fiction.stats.followers = parseInt(followersMatch[1]);
        }

        // Extract favorites (look for "Favorites :" pattern)
        const favoritesMatch = statsText.match(/Favorites\s*:\s*(\d+)/i);
        if (favoritesMatch) {
          fiction.stats.favorites = parseInt(favoritesMatch[1]);
        }

        // Extract average views (look for "Average Views :" pattern)
        const avgViewsMatch = statsText.match(/Average\s*Views\s*:\s*(\d+)/i);
        if (avgViewsMatch) {
          fiction.stats.average_views = parseInt(avgViewsMatch[1]);
        }

        // Extract total views (look for "Total Views :" pattern)
        const totalViewsMatch = statsText.match(/Total\s*Views\s*:\s*([\d,]+)/i);
        if (totalViewsMatch) {
          fiction.stats.total_views = parseInt(totalViewsMatch[1].replace(/,/g, ''));
        }

        // Extract views (if present)
        const viewsMatch = statsText.match(/(\d+)\s*Views?/i);
        if (viewsMatch) {
          fiction.stats.views = parseInt(viewsMatch[1]);
        }

        // Extract score from data-content attribute (4.61 / 5)
        const scoreElement = statsContainer.find('[data-content*="/ 5"]').first();
        if (scoreElement.length) {
          const dataContent = scoreElement.attr('data-content');
          const scoreMatch = dataContent?.match(/(\d+\.\d+)\s*\/\s*5/);
          if (scoreMatch) {
            const score = parseFloat(scoreMatch[1]);
            // Royal Road scores are 0-5, cap to that range
            fiction.stats.score = Math.min(Math.max(score, 0), 5);
          }
        }

        // Fallback: try to find score in text
        if (fiction.stats.score === 0) {
          const scoreMatch = statsText.match(/(\d+\.\d+)\s*\/\s*5/i);
          if (scoreMatch) {
            const score = parseFloat(scoreMatch[1]);
            fiction.stats.score = Math.min(Math.max(score, 0), 5);
          }
        }
      }

      // Extract detailed scores from data-content attributes
      const scoreElements = statsContainer.find('[data-content*="/ 5"]');
      scoreElements.each((_, element) => {
        const $el = $(element);
        const dataContent = $el.attr('data-content');
        const ariaLabel = $el.attr('aria-label');

        if (dataContent && ariaLabel) {
          const scoreMatch = dataContent.match(/(\d+\.?\d*)\s*\/\s*5/);
          if (scoreMatch) {
            const score = parseFloat(scoreMatch[1]);

            // Determine score type from aria-label
            if (ariaLabel.includes('Overall')) {
              fiction.stats.overall_score = score;
            } else if (ariaLabel.includes('Style')) {
              fiction.stats.style_score = score;
            } else if (ariaLabel.includes('Story')) {
              fiction.stats.story_score = score;
            } else if (ariaLabel.includes('Grammar')) {
              fiction.stats.grammar_score = score;
            } else if (ariaLabel.includes('Character')) {
              fiction.stats.character_score = score;
            }
          }
        }
      });

      // Extract metadata (description, status, type, tags, warnings)
      // Description
      const description = $('.description').text().trim();
      if (description) {
        fiction.description = this.decodeHtmlEntities(description);
      }

      // Extract fiction cover image
      const coverImage = $('img[src*="covers-large"]').first().attr('src');
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

      // Tags
      const tags: string[] = [];
      $('.tags a').each((_, element) => {
        const tag = $(element).text().trim();
        if (tag) {
          tags.push(tag);
        }
      });
      fiction.tags = tags;

      // Warnings
      const warnings: string[] = [];
      $('.warnings a').each((_, element) => {
        const warning = $(element).text().trim();
        if (warning) {
          warnings.push(warning);
        }
      });
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
        pages: fiction.stats.pages,
        ratings: fiction.stats.ratings,
        followers: fiction.stats.followers,
        favorites: fiction.stats.favorites,
        views: fiction.stats.views,
        score: fiction.stats.score,
        captured_at: new Date().toISOString()
      };
    } catch (error) {
      console.error(`❌ Error scraping fiction history for ${royalroadId}:`, error);
      throw handleScrapingError(error);
    }
  }
}
