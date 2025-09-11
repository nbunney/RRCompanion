import { RoyalRoadAPI } from 'royalroad-api';

// Types for RoyalRoad responses
export interface RoyalRoadFiction {
  id: string;
  title: string;
  author: {
    name: string;
    id: string;
    avatar?: string;
  };
  description: string;
  image?: string;
  status: string;
  tags: string[];
  stats: {
    pages: number;
    ratings: number;
    followers: number;
    favorites: number;
    views: number;
    score: number;
    // Detailed scores
    overall_score: number;
    style_score: number;
    story_score: number;
    grammar_score: number;
    character_score: number;
    // Additional metrics
    total_views: number;
    average_views: number;
  };
  chapters: RoyalRoadChapter[];
  warnings: string[];
  type: string;
}

export interface RoyalRoadChapter {
  id: string;
  title: string;
  url: string;
  date: string;
  views: number;
  words: number;
}

export interface RoyalRoadUser {
  id: string;
  name: string;
  avatar?: string;
  title?: string;
  joinDate: string;
  lastSeen: string;
  stats: {
    followers: number;
    following: number;
    fictions: number;
  };
}

export interface RoyalRoadResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface RisingStarFiction {
  id: string;
  title: string;
  author: {
    name: string;
    id: string;
    avatar?: string;
  };
  position: number;
  genre?: string;
  pages?: number;
  ratings?: number;
  description?: string;
  image_url?: string;
  status?: string;
  type?: string;
  tags?: any;
  warnings?: any;
  stats: {
    followers: number;
    favorites: number;
    views: number;
    score: number;
    overall_score?: number;
    style_score?: number;
    story_score?: number;
    grammar_score?: number;
    character_score?: number;
    total_views?: number;
    average_views?: number;
  };
}

// RoyalRoad API Service using the official package
export class RoyalRoadService {
  private api: RoyalRoadAPI;

  constructor() {
    this.api = new RoyalRoadAPI();
  }

  // Helper function to decode HTML entities
  private decodeHtmlEntities(text: string): string {
    if (!text) return text;

    // Common HTML entities mapping
    const htmlEntities: { [key: string]: string } = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#x27;': "'",
      '&#x2F;': '/',
      '&#x60;': '`',
      '&#x3D;': '=',
      '&apos;': "'",
      '&nbsp;': ' ',
      '&copy;': '©',
      '&reg;': '®',
      '&trade;': '™',
      '&hellip;': '…',
      '&mdash;': '—',
      '&ndash;': '–',
      '&lsquo;': "'",
      '&rsquo;': "'",
      '&ldquo;': '"',
      '&rdquo;': '"',
    };

    let decodedText = text;
    for (const [entity, replacement] of Object.entries(htmlEntities)) {
      decodedText = decodedText.replace(new RegExp(entity, 'g'), replacement);
    }

    return decodedText;
  }

  // Get popular fictions
  async getPopularFictions(): Promise<RoyalRoadResponse<RoyalRoadFiction[]>> {
    try {
      const response = await this.api.fictions.getPopular();

      if (response.success) {
        const fictions: RoyalRoadFiction[] = response.data.map((fic: any) => ({
          id: fic.id?.toString() || '',
          title: fic.title || '',
          author: {
            name: fic.author?.name || '',
            id: fic.author?.id?.toString() || '',
            avatar: fic.author?.avatar || '',
          },
          description: fic.description || '',
          image: fic.image || '',
          status: fic.status || '',
          tags: fic.tags || [],
          stats: {
            pages: fic.stats?.pages || 0,
            ratings: fic.stats?.ratings || 0,
            followers: fic.stats?.followers || 0,
            favorites: fic.stats?.favorites || 0,
            views: typeof fic.stats?.views === 'number' ? fic.stats.views : 0,
            score: typeof fic.stats?.score === 'number' ? fic.stats.score : 0,
            overall_score: typeof fic.stats?.overall_score === 'number' ? fic.stats.overall_score : 0,
            style_score: typeof fic.stats?.style_score === 'number' ? fic.stats.style_score : 0,
            story_score: typeof fic.stats?.story_score === 'number' ? fic.stats.story_score : 0,
            grammar_score: typeof fic.stats?.grammar_score === 'number' ? fic.stats.grammar_score : 0,
            character_score: typeof fic.stats?.character_score === 'number' ? fic.stats.character_score : 0,
            total_views: typeof fic.stats?.total_views === 'number' ? fic.stats.total_views : 0,
            average_views: typeof fic.stats?.average_views === 'number' ? fic.stats.average_views : 0,
          },
          chapters: [],
          warnings: fic.warnings || [],
          type: fic.type || '',
        }));

        return {
          success: true,
          data: fictions,
        };
      } else {
        return {
          success: false,
          data: [],
          message: 'Failed to fetch popular fictions',
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Unknown error';
      return {
        success: false,
        data: [],
        message: `Failed to fetch popular fictions: ${errorMessage}`,
      };
    }
  }

  // Get fiction by ID by scraping the page directly
  async getFiction(
    id: string,
  ): Promise<RoyalRoadResponse<RoyalRoadFiction | null>> {
    try {
      const url = `https://www.royalroad.com/fiction/${id}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();

      // Extract fiction data from HTML
      const fiction: RoyalRoadFiction = {
        id: id,
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

      // Extract title - multiple patterns
      const titleMatch1 = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
      if (titleMatch1) {
        fiction.title = this.decodeHtmlEntities(titleMatch1[1].trim());
      } else {
        const titleMatch2 = html.match(/<title[^>]*>([^<]+)<\/title>/);
        if (titleMatch2) {
          fiction.title = this.decodeHtmlEntities(titleMatch2[1].replace(' - Royal Road', '').trim());
        }
      }

      // Extract author name - multiple patterns to handle different HTML structures
      let authorFound = false;

      // Pattern 1: Look for "by" followed by author link (case insensitive)
      const authorMatch1 = html.match(/by\s*<a[^>]*href="[^"]*profile[^"]*"[^>]*>([^<]+)<\/a>/i);
      if (authorMatch1) {
        fiction.author.name = this.decodeHtmlEntities(authorMatch1[1].trim());
        authorFound = true;
      }

      // Pattern 2: Look for author link in profile section
      if (!authorFound) {
        const authorMatch2 = html.match(/<a[^>]*href="[^"]*\/profile\/[^"]*"[^>]*>([^<]+)<\/a>/);
        if (authorMatch2) {
          fiction.author.name = this.decodeHtmlEntities(authorMatch2[1].trim());
          authorFound = true;
        }
      }

      // Pattern 3: Look for author in meta tags or other locations
      if (!authorFound) {
        const authorMatch3 = html.match(/<meta[^>]*name="author"[^>]*content="([^"]+)"/);
        if (authorMatch3) {
          fiction.author.name = this.decodeHtmlEntities(authorMatch3[1].trim());
          authorFound = true;
        }
      }

      // Pattern 4: Look for author in breadcrumb or navigation
      if (!authorFound) {
        const authorMatch4 = html.match(/<span[^>]*class="[^"]*author[^"]*"[^>]*>([^<]+)<\/span>/);
        if (authorMatch4) {
          fiction.author.name = this.decodeHtmlEntities(authorMatch4[1].trim());
          authorFound = true;
        }
      }

      // Extract author ID from author link - multiple patterns
      const authorIdMatch1 = html.match(/href="[^"]*\/profile\/(\d+)[^"]*"/);
      if (authorIdMatch1) {
        fiction.author.id = authorIdMatch1[1];
      } else {
        const authorIdMatch2 = html.match(/\/profile\/(\d+)/);
        if (authorIdMatch2) {
          fiction.author.id = authorIdMatch2[1];
        }
      }

      // Extract author avatar - multiple patterns
      let avatarFound = false;

      // Pattern 1: Look for avatar in class
      const avatarMatch1 = html.match(/<img[^>]*class="[^"]*avatar[^"]*"[^>]*src="([^"]+)"/);
      if (avatarMatch1) {
        fiction.author.avatar = avatarMatch1[1];
        avatarFound = true;
      }

      // Pattern 2: Look for avatar in src
      if (!avatarFound) {
        const avatarMatch2 = html.match(/<img[^>]*src="([^"]*avatar[^"]*)"[^>]*>/);
        if (avatarMatch2) {
          fiction.author.avatar = avatarMatch2[1];
          avatarFound = true;
        }
      }

      // Pattern 3: Look for any image that might be an avatar
      if (!avatarFound) {
        const avatarMatch3 = html.match(/<img[^>]*src="([^"]*\.(?:jpg|jpeg|png|gif|webp))"[^>]*>/);
        if (avatarMatch3) {
          fiction.author.avatar = avatarMatch3[1];
          avatarFound = true;
        }
      }

      // Extract description
      const descMatch = html.match(/<div[^>]*class="[^"]*description[^"]*"[^>]*>([\s\S]*?)<\/div>/);
      if (descMatch) {
        fiction.description = this.decodeHtmlEntities(descMatch[1].replace(/<[^>]*>/g, '').trim());
      }

      // Extract image/cover art - multiple patterns
      let imageFound = false;

      // Pattern 1: Look for cover class
      const imageMatch1 = html.match(/<img[^>]*class="[^"]*cover[^"]*"[^>]*src="([^"]+)"/);
      if (imageMatch1) {
        fiction.image = imageMatch1[1];
        imageFound = true;
      }

      // Pattern 2: Look for cover in src
      if (!imageFound) {
        const imageMatch2 = html.match(/<img[^>]*src="([^"]*cover[^"]*)"[^>]*>/);
        if (imageMatch2) {
          fiction.image = imageMatch2[1];
          imageFound = true;
        }
      }

      // Pattern 3: Look for any image that might be the cover (more specific)
      if (!imageFound) {
        const imageMatch3 = html.match(/<img[^>]*src="([^"]*\.(?:jpg|jpeg|png|gif|webp))"[^>]*>/);
        if (imageMatch3) {
          fiction.image = imageMatch3[1];
          imageFound = true;
        }
      }

      // Extract status and type from the colored area next to tags
      // Look for the container that holds status and type information
      const statusTypeContainer = html.match(/<div[^>]*class="[^"]*fiction-stats[^"]*"[^>]*>([\s\S]*?)<\/div>/);
      if (statusTypeContainer) {
        const containerHtml = statusTypeContainer[1];

        // Extract status - look for ONGOING, COMPLETED, HIATUS, etc.
        const statusMatch = containerHtml.match(/<span[^>]*class="[^"]*label[^"]*"[^>]*>([^<]+)<\/span>/g);
        if (statusMatch) {
          for (const match of statusMatch) {
            const statusText = this.decodeHtmlEntities(match.replace(/<[^>]*>/g, '').trim());
            // Common status values
            if (['ONGOING', 'COMPLETED', 'HIATUS', 'DROPPED', 'STUB'].includes(statusText.toUpperCase())) {
              fiction.status = statusText;
              break;
            }
          }
        }

        // Extract type - look for Original, Translation, etc.
        const typeMatch = containerHtml.match(/<span[^>]*class="[^"]*label[^"]*"[^>]*>([^<]+)<\/span>/g);
        if (typeMatch) {
          for (const match of typeMatch) {
            const typeText = this.decodeHtmlEntities(match.replace(/<[^>]*>/g, '').trim());
            // Common type values
            if (['ORIGINAL', 'TRANSLATION', 'ADAPTATION'].includes(typeText.toUpperCase())) {
              fiction.type = typeText;
              break;
            }
          }
        }
      }

      // Alternative: Look for status and type in the fiction-info section
      const fictionInfoSection = html.match(/<div[^>]*class="[^"]*fiction-info[^"]*"[^>]*>([\s\S]*?)<\/div>/);
      if (fictionInfoSection) {
        const infoHtml = fictionInfoSection[1];

        // Extract status - look for ONGOING, COMPLETED, HIATUS, etc.
        const statusMatch = infoHtml.match(/<span[^>]*class="[^"]*label[^"]*"[^>]*>([^<]+)<\/span>/g);
        if (statusMatch) {
          for (const match of statusMatch) {
            const statusText = this.decodeHtmlEntities(match.replace(/<[^>]*>/g, '').trim());
            // Common status values
            if (['ONGOING', 'COMPLETED', 'HIATUS', 'DROPPED', 'STUB'].includes(statusText.toUpperCase())) {
              fiction.status = statusText;
              break;
            }
          }
        }

        // Extract type - look for Original, Translation, etc.
        const typeMatch = infoHtml.match(/<span[^>]*class="[^"]*label[^"]*"[^>]*>([^<]+)<\/span>/g);
        if (typeMatch) {
          for (const match of typeMatch) {
            const typeText = this.decodeHtmlEntities(match.replace(/<[^>]*>/g, '').trim());
            // Common type values
            if (['ORIGINAL', 'TRANSLATION', 'ADAPTATION'].includes(typeText.toUpperCase())) {
              fiction.type = typeText;
              break;
            }
          }
        }
      }

      // Look for status and type in the entire HTML if not found yet
      if (!fiction.status || !fiction.type) {
        const allLabelMatches = html.match(/<span[^>]*class="[^"]*label[^"]*"[^>]*>([^<]+)<\/span>/g);
        if (allLabelMatches) {
          for (const match of allLabelMatches) {
            const text = this.decodeHtmlEntities(match.replace(/<[^>]*>/g, '').trim());

            // Check for status
            if (!fiction.status && ['ONGOING', 'COMPLETED', 'HIATUS', 'DROPPED', 'STUB'].includes(text.toUpperCase())) {
              fiction.status = text;
            }

            // Check for type
            if (!fiction.type && ['ORIGINAL', 'TRANSLATION', 'ADAPTATION'].includes(text.toUpperCase())) {
              fiction.type = text;
            }

            // If we found both, we can stop
            if (fiction.status && fiction.type) {
              break;
            }
          }
        }
      }

      // Fallback: Try alternative patterns for status and type
      if (!fiction.status) {
        const statusMatch = html.match(/<span[^>]*class="[^"]*status[^"]*"[^>]*>([^<]+)<\/span>/);
        if (statusMatch) {
          fiction.status = this.decodeHtmlEntities(statusMatch[1].trim());
        }
      }

      if (!fiction.type) {
        const typeMatch = html.match(/<span[^>]*class="[^"]*type[^"]*"[^>]*>([^<]+)<\/span>/);
        if (typeMatch) {
          fiction.type = this.decodeHtmlEntities(typeMatch[1].trim());
        }
      }

      // Extract tags - look for individual fiction-tag links
      const tagLinks = html.match(/<a[^>]*class="[^"]*fiction-tag[^"]*"[^>]*>([^<]+)<\/a>/g);
      if (tagLinks) {
        fiction.tags = tagLinks.map(tag => this.decodeHtmlEntities(tag.replace(/<[^>]*>/g, '').trim())).filter(tag => tag);
      }

      // Extract warnings - look for individual warning items
      const warningItems = html.match(/<li[^>]*>([^<]+)<\/li>/g);
      if (warningItems) {
        // Filter for warning items (they're usually in a warnings section)
        const warningsSection = html.match(/<div[^>]*class="[^"]*text-center[^"]*"[^>]*>[\s\S]*?<strong>Warning<\/strong>[\s\S]*?<\/div>/);
        if (warningsSection) {
          const warningMatches = warningsSection[0].match(/<li[^>]*>([^<]+)<\/li>/g);
          if (warningMatches) {
            fiction.warnings = warningMatches.map(warning => this.decodeHtmlEntities(warning.replace(/<[^>]*>/g, '').trim())).filter(warning => warning);
          }
        }
      }

      // Extract detailed statistics from HTML
      const stats = await this.scrapeFictionStats(id);

      if (!stats) {
        console.error(`❌ Failed to scrape stats for fiction ${id}`);
        return {
          success: false,
          data: null,
          message: `Failed to scrape statistics for fiction ${id}`,
        };
      }

      fiction.stats = stats;

      // Extract status and type from stats (they were extracted in scrapeFictionStats)
      if (stats.status) {
        fiction.status = stats.status;
      }
      if (stats.type) {
        fiction.type = stats.type;
      }

      return {
        success: true,
        data: fiction,
      };
    } catch (error) {
      console.error(`❌ Error fetching fiction ${id}:`, error);
      return {
        success: false,
        data: null,
        message: `Failed to fetch fiction: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  // Add fiction by Royal Road URL
  async addFictionByUrl(
    url: string,
  ): Promise<RoyalRoadResponse<RoyalRoadFiction | null>> {
    try {
      // Extract fiction ID from URL
      const fictionId = this.extractFictionIdFromUrl(url);
      if (!fictionId) {
        return {
          success: false,
          data: null,
          message: 'Invalid Royal Road URL. Please provide a valid fiction URL.',
        };
      }

      // Get fiction details using the existing getFiction method
      const response = await this.getFiction(fictionId);

      if (response.success && response.data) {
        return response;
      } else {
        return {
          success: false,
          data: null,
          message: response.message || 'Failed to fetch fiction details',
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Unknown error';
      console.error(`❌ Failed to add fiction: ${errorMessage}`);
      return {
        success: false,
        data: null,
        message: `Failed to add fiction: ${errorMessage}`,
      };
    }
  }

  // Extract fiction ID from Royal Road URL
  private extractFictionIdFromUrl(url: string): string | null {
    try {
      // Handle various Royal Road URL formats:
      // https://www.royalroad.com/fiction/12345/title
      // https://www.royalroad.com/fiction/12345
      // https://royalroad.com/fiction/12345/title
      const urlObj = new URL(url);

      // Check if it's a Royal Road URL
      if (!urlObj.hostname.includes('royalroad.com')) {
        return null;
      }

      // Extract fiction ID from path
      const pathParts = urlObj.pathname.split('/');
      const fictionIndex = pathParts.findIndex(part => part === 'fiction');

      if (fictionIndex !== -1 && fictionIndex + 1 < pathParts.length) {
        const fictionId = pathParts[fictionIndex + 1];
        // Validate that it's a number
        if (/^\d+$/.test(fictionId)) {
          return fictionId;
        }
      }

      return null;
    } catch (error) {
      console.error('Error parsing URL:', error);
      return null;
    }
  }

  // Get user profile by username
  async getUserProfile(
    username: string,
  ): Promise<RoyalRoadResponse<RoyalRoadUser | null>> {
    try {
      // This method is not implemented in the RoyalRoad API package
      // We would need to implement a custom scraper for user profiles
      return {
        success: false,
        data: null,
        message: 'User profile API method not available',
      };
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Unknown error';
      console.error(`❌ Failed to fetch user profile for ${username}: ${errorMessage}`);
      return {
        success: false,
        data: null,
        message: `Failed to fetch user profile: ${errorMessage}`,
      };
    }
  }

  // Get Rising Stars data for a specific genre
  async getRisingStars(genre: string = 'main'): Promise<RoyalRoadResponse<RisingStarFiction[]>> {
    try {
      const risingStars = await this.scrapeRisingStars(genre);

      return {
        success: true,
        data: risingStars,
      };
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Unknown error';
      console.error(`❌ Failed to fetch Rising Stars for ${genre}: ${errorMessage}`);
      return {
        success: false,
        data: [],
        message: `Failed to fetch Rising Stars for ${genre}: ${errorMessage}`,
      };
    }
  }

  // Custom scraper for Rising Stars data
  private async scrapeRisingStars(genre: string): Promise<RisingStarFiction[]> {
    try {
      const url = genre === 'main'
        ? 'https://www.royalroad.com/fictions/rising-stars'
        : `https://www.royalroad.com/fictions/rising-stars?genre=${genre}`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();

      // Parse the HTML to extract Rising Stars data
      const risingStars = this.parseRisingStarsHTML(html, genre);

      return risingStars;
    } catch (error) {
      console.error(`❌ Error scraping Rising Stars for ${genre}:`, error);
      return [];
    }
  }

  // Parse HTML to extract Rising Stars data
  private parseRisingStarsHTML(html: string, genre: string): RisingStarFiction[] {
    const risingStars: RisingStarFiction[] = [];

    try {
      // Focus on extracting Royal Road IDs and titles first
      const titleRegex = /<a[^>]*href="\/fiction\/(\d+)\/[^"]*"[^>]*>([^<]+)<\/a>/gi;

      let position = 1;
      let match;

      // Extract fiction IDs and titles
      while ((match = titleRegex.exec(html)) !== null) {
        const fictionId = match[1];
        const title = this.decodeHtmlEntities(match[2].trim());

        // Create a basic Rising Star entry - we'll enrich it with full data later
        const risingStar: RisingStarFiction = {
          id: fictionId,
          title: title,
          author: {
            name: 'Unknown Author', // Will be filled in when we fetch full data
            id: '',
            avatar: '',
          },
          position: position,
          genre: genre,
          status: '', // Will be filled in when we fetch full data
          type: '', // Will be filled in when we fetch full data
          stats: {
            followers: 0, // Will be filled in when we fetch full data
            favorites: 0,
            views: 0,
            score: 0,
          },
        };

        risingStars.push(risingStar);
        position++;

        // Get all 50 entries per genre (Royal Road's limit)
        if (position > 50) {
          break;
        }
      }

    } catch (error) {
      console.error('❌ Error parsing Rising Stars HTML:', error);
    }

    return risingStars;
  }

  // Get Rising Stars data for all genres
  async getAllRisingStars(): Promise<RoyalRoadResponse<RisingStarFiction[]>> {
    try {
      // Royal Road has genre-specific Rising Stars pages using query parameters
      // Complete list of all Rising Stars genres with correct URL formats
      const genres = [
        'main', 'action', 'adventure', 'comedy', 'drama', 'fantasy', 'historical', 'horror', 'mystery', 'romance', 'satire', 'sci_fi', 'slice_of_life', 'sports', 'supernatural', 'tragedy',
        'anti-hero_lead', 'artificial_intelligence', 'attractive_lead', 'cyberpunk', 'dungeon', 'dystopia', 'female_lead', 'first_contact', 'gamelit', 'gender_bender', 'genetically_engineered%20', 'grimdark', 'harem', 'high_fantasy', 'litrpg', 'low_fantasy', 'loop', 'male_lead', 'martial_arts', 'multiple_lead', 'mythos', 'non-human_lead', 'post_apocalyptic', 'progression', 'psychological', 'reader_interactive', 'reincarnation', 'ruling_class', 'school_life', 'secret_identity', 'soft_sci-fi', 'space_opera', 'steampunk', 'strong_lead', 'super_heroes', 'technologically_engineered', 'time_travel', 'urban_fantasy', 'villainous_lead', 'virtual_reality', 'war_and_military', 'wuxia', 'xianxia', 'summoned_hero'
      ];
      const allRisingStars: RisingStarFiction[] = [];

      for (const genre of genres) {
        try {
          const response = await this.getRisingStars(genre);
          if (response.success && response.data) {
            allRisingStars.push(...response.data);
          }

          // Add a 1-second delay between requests to be respectful to the API
          if (genre !== genres[genres.length - 1]) { // Don't delay after the last request
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          console.error(`❌ Error fetching Rising Stars for ${genre}:`, error);
        }
      }

      return {
        success: true,
        data: allRisingStars,
      };
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Unknown error';
      console.error(`❌ Failed to fetch all Rising Stars: ${errorMessage}`);
      return {
        success: false,
        data: [],
        message: `Failed to fetch all Rising Stars: ${errorMessage}`,
      };
    }
  }

  // Scrape detailed statistics from a fiction page with retry logic
  private async scrapeFictionStats(fictionId: string, maxRetries: number = 3): Promise<any> {
    let lastError: any = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Scraping attempt ${attempt}/${maxRetries} for fiction ${fictionId}`);

        const url = `https://www.royalroad.com/fiction/${fictionId}`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const html = await response.text();

        // Extract status and type from the colored area next to tags
        let status = '';
        let type = '';

        // Look for the container that holds status and type information
        const statusTypeContainer = html.match(/<div[^>]*class="[^"]*fiction-stats[^"]*"[^>]*>([\s\S]*?)<\/div>/);
        if (statusTypeContainer) {
          const containerHtml = statusTypeContainer[1];

          // Extract status - look for ONGOING, COMPLETED, HIATUS, etc.
          const statusMatch = containerHtml.match(/<span[^>]*class="[^"]*label[^"]*"[^>]*>([^<]+)<\/span>/g);
          if (statusMatch) {
            for (const match of statusMatch) {
              const statusText = this.decodeHtmlEntities(match.replace(/<[^>]*>/g, '').trim());
              // Common status values
              if (['ONGOING', 'COMPLETED', 'HIATUS', 'DROPPED', 'STUB'].includes(statusText.toUpperCase())) {
                status = statusText;
                break;
              }
            }
          }

          // Extract type - look for Original, Translation, etc.
          const typeMatch = containerHtml.match(/<span[^>]*class="[^"]*label[^"]*"[^>]*>([^<]+)<\/span>/g);
          if (typeMatch) {
            for (const match of typeMatch) {
              const typeText = this.decodeHtmlEntities(match.replace(/<[^>]*>/g, '').trim());
              // Common type values
              if (['ORIGINAL', 'TRANSLATION', 'ADAPTATION'].includes(typeText.toUpperCase())) {
                type = typeText;
                break;
              }
            }
          }
        }

        // Alternative: Look for status and type in the fiction-info section
        const fictionInfoSection = html.match(/<div[^>]*class="[^"]*fiction-info[^"]*"[^>]*>([\s\S]*?)<\/div>/);
        if (fictionInfoSection) {
          const infoHtml = fictionInfoSection[1];

          // Extract status - look for ONGOING, COMPLETED, HIATUS, etc.
          const statusMatch = infoHtml.match(/<span[^>]*class="[^"]*label[^"]*"[^>]*>([^<]+)<\/span>/g);
          if (statusMatch) {
            for (const match of statusMatch) {
              const statusText = this.decodeHtmlEntities(match.replace(/<[^>]*>/g, '').trim());
              // Common status values
              if (['ONGOING', 'COMPLETED', 'HIATUS', 'DROPPED', 'STUB'].includes(statusText.toUpperCase())) {
                status = statusText;
                break;
              }
            }
          }

          // Extract type - look for Original, Translation, etc.
          const typeMatch = infoHtml.match(/<span[^>]*class="[^"]*label[^"]*"[^>]*>([^<]+)<\/span>/g);
          if (typeMatch) {
            for (const match of typeMatch) {
              const typeText = this.decodeHtmlEntities(match.replace(/<[^>]*>/g, '').trim());
              // Common type values
              if (['ORIGINAL', 'TRANSLATION', 'ADAPTATION'].includes(typeText.toUpperCase())) {
                type = typeText;
                break;
              }
            }
          }
        }

        // Look for status and type in the entire HTML if not found yet
        if (!status || !type) {
          const allLabelMatches = html.match(/<span[^>]*class="[^"]*label[^"]*"[^>]*>([^<]+)<\/span>/g);
          if (allLabelMatches) {
            for (const match of allLabelMatches) {
              const text = this.decodeHtmlEntities(match.replace(/<[^>]*>/g, '').trim());

              // Check for status
              if (!status && ['ONGOING', 'COMPLETED', 'HIATUS', 'DROPPED', 'STUB'].includes(text.toUpperCase())) {
                status = text;
              }

              // Check for type
              if (!type && ['ORIGINAL', 'TRANSLATION', 'ADAPTATION'].includes(text.toUpperCase())) {
                type = text;
              }

              // If we found both, we can stop
              if (status && type) {
                break;
              }
            }
          }
        }

        // Fallback: Try alternative patterns for status and type
        if (!status) {
          const statusMatch = html.match(/<span[^>]*class="[^"]*status[^"]*"[^>]*>([^<]+)<\/span>/);
          if (statusMatch) {
            status = this.decodeHtmlEntities(statusMatch[1].trim());
          }
        }

        if (!type) {
          const typeMatch = html.match(/<span[^>]*class="[^"]*type[^"]*"[^>]*>([^<]+)<\/span>/);
          if (typeMatch) {
            type = this.decodeHtmlEntities(typeMatch[1].trim());
          }
        }

        // Extract detailed statistics from HTML
        const stats: any = {
          overall_score: 0,
          style_score: 0,
          story_score: 0,
          grammar_score: 0,
          character_score: 0,
          total_views: 0,
          average_views: 0,
          followers: 0,
          favorites: 0,
          ratings: 0,
          pages: 0,
          status: status,
          type: type
        };

        // Extract scores from star elements - fixed based on actual HTML structure
        // The structure shows: data-content="4.77 / 5" aria-label="4.77 stars"
        // Need to match each score type specifically
        const overallScoreMatch = html.match(/Overall Score[\s\S]*?data-content="([\d.]+) \/ 5"/);
        if (overallScoreMatch) {
          stats.overall_score = parseFloat(overallScoreMatch[1]);
        }

        const styleScoreMatch = html.match(/Style Score[\s\S]*?data-content="([\d.]+) \/ 5"/);
        if (styleScoreMatch) {
          stats.style_score = parseFloat(styleScoreMatch[1]);
        }

        const storyScoreMatch = html.match(/Story Score[\s\S]*?data-content="([\d.]+) \/ 5"/);
        if (storyScoreMatch) {
          stats.story_score = parseFloat(storyScoreMatch[1]);
        }

        const grammarScoreMatch = html.match(/Grammar Score[\s\S]*?data-content="([\d.]+) \/ 5"/);
        if (grammarScoreMatch) {
          stats.grammar_score = parseFloat(grammarScoreMatch[1]);
        }

        const characterScoreMatch = html.match(/Character Score[\s\S]*?data-content="([\d.]+) \/ 5"/);
        if (characterScoreMatch) {
          stats.character_score = parseFloat(characterScoreMatch[1]);
        }

        // Extract numeric statistics - fixed based on actual HTML structure
        // The structure shows: <li class="bold uppercase">Total Views :</li><li class="bold uppercase font-red-sunglo">204,325</li>
        const totalViewsMatch = html.match(/Total Views :<\/li>\s*<li[^>]*class="[^"]*font-red-sunglo[^"]*"[^>]*>([\d,]+)<\/li>/);
        if (totalViewsMatch) {
          stats.total_views = parseInt(totalViewsMatch[1].replace(/,/g, ''));
        }

        const averageViewsMatch = html.match(/Average Views :<\/li>\s*<li[^>]*class="[^"]*font-red-sunglo[^"]*"[^>]*>([\d,]+)<\/li>/);
        if (averageViewsMatch) {
          stats.average_views = parseInt(averageViewsMatch[1].replace(/,/g, ''));
        }

        const followersMatch = html.match(/Followers :<\/li>\s*<li[^>]*class="[^"]*font-red-sunglo[^"]*"[^>]*>([\d,]+)<\/li>/);
        if (followersMatch) {
          stats.followers = parseInt(followersMatch[1].replace(/,/g, ''));
        }

        const favoritesMatch = html.match(/Favorites :<\/li>\s*<li[^>]*class="[^"]*font-red-sunglo[^"]*"[^>]*>([\d,]+)<\/li>/);
        if (favoritesMatch) {
          stats.favorites = parseInt(favoritesMatch[1].replace(/,/g, ''));
        }

        const ratingsMatch = html.match(/Ratings :<\/li>\s*<li[^>]*class="[^"]*font-red-sunglo[^"]*"[^>]*>([\d,]+)<\/li>/);
        if (ratingsMatch) {
          stats.ratings = parseInt(ratingsMatch[1].replace(/,/g, ''));
        }

        // Extract pages from the last font-red-sunglo entry
        const fontRedMatches = html.match(/font-red-sunglo[^>]*>([\d,]+)<\/li>/g);
        if (fontRedMatches && fontRedMatches.length > 0) {
          const lastMatch = fontRedMatches[fontRedMatches.length - 1];
          const pagesValue = lastMatch.match(/>([\d,]+)</);
          if (pagesValue) {
            stats.pages = parseInt(pagesValue[1].replace(/,/g, ''));
          }
        }

        // Validate that we got meaningful data
        if (stats.pages > 0 || stats.ratings > 0 || stats.followers > 0 || stats.favorites > 0 || stats.views > 0) {
          console.log(`✅ Successfully scraped stats for fiction ${fictionId} on attempt ${attempt}`);
          return stats;
        } else {
          console.log(`⚠️ Attempt ${attempt} returned zero stats for fiction ${fictionId}, retrying...`);
          lastError = new Error('Zero stats returned');
        }

        // Add delay between retries (exponential backoff)
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Max 5 seconds
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

      } catch (error) {
        console.log(`❌ Attempt ${attempt} threw error for fiction ${fictionId}:`, error);
        lastError = error;

        // Add delay between retries
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    console.log(`❌ All ${maxRetries} attempts failed for fiction ${fictionId}`);
    return null; // Return null instead of zeros to indicate failure
  }
}