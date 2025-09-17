import { client } from '../config/database.ts';
import { RoyalRoadService } from './royalroad.ts';
import { FictionService } from './fiction.ts';
import { cacheService } from './cache.ts';
import type { CreateFictionRequest } from '../types/index.ts';

export interface RisingStarsPosition {
  fictionId: number;
  title: string;
  authorName: string;
  royalroadId: string;
  imageUrl?: string;
  isOnMain: boolean;
  mainPosition?: number;
  estimatedPosition: number;
  fictionsAhead: number;
  fictionsToClimb: number;
  lastUpdated: string;
  genrePositions: { genre: string; position: number | null; isOnList: boolean; lastScraped: string | null }[];
  fictionsAheadDetails?: { fictionId: number; title: string; authorName: string; royalroadId: string; imageUrl?: string }[];
}

export class RisingStarsPositionService {
  private dbClient = client;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Try to scrape a fiction from Royal Road and add it to our database
   */
  private async scrapeAndCreateFiction(royalroadId: string): Promise<any | null> {
    try {
      console.log(`🔍 Attempting to scrape fiction ${royalroadId} from Royal Road...`);

      const royalroadService = new RoyalRoadService();
      const fictionResponse = await royalroadService.getFiction(royalroadId);

      if (!fictionResponse.success || !fictionResponse.data) {
        console.log(`❌ Failed to scrape fiction ${royalroadId}: ${fictionResponse.message || 'No data returned'}`);
        return null;
      }

      const fictionData = fictionResponse.data;

      // Convert Royal Road fiction data to our CreateFictionRequest format
      const createFictionData: CreateFictionRequest = {
        royalroad_id: royalroadId,
        title: fictionData.title,
        author_name: fictionData.author.name,
        author_id: fictionData.author.id,
        author_avatar: fictionData.author.avatar || undefined,
        description: fictionData.description,
        image_url: fictionData.image || undefined,
        status: fictionData.status,
        type: fictionData.type,
        tags: fictionData.tags,
        warnings: fictionData.warnings,
        pages: fictionData.stats.pages,
        ratings: fictionData.stats.ratings,
        followers: fictionData.stats.followers,
        favorites: fictionData.stats.favorites,
        views: fictionData.stats.views,
        score: fictionData.stats.score,
        overall_score: fictionData.stats.overall_score,
        style_score: fictionData.stats.style_score,
        story_score: fictionData.stats.story_score,
        grammar_score: fictionData.stats.grammar_score,
        character_score: fictionData.stats.character_score,
        total_views: fictionData.stats.total_views,
        average_views: fictionData.stats.average_views,
      };

      // Create the fiction in our database
      const createdFiction = await FictionService.createFiction(createFictionData);
      console.log(`✅ Successfully created fiction ${royalroadId} in database`);

      return createdFiction;
    } catch (error) {
      console.error(`❌ Error scraping fiction ${royalroadId}:`, error);
      return null;
    }
  }

  /**
   * Calculate how close a fiction is to being on Rising Stars main page
   */
  async calculateRisingStarsPosition(royalroadId: string): Promise<RisingStarsPosition | null> {
    try {
      // Check cache first
      const cacheKey = `rising-stars-position-${royalroadId}`;
      const cachedData = cacheService.getWithCleanup<RisingStarsPosition>(cacheKey);
      if (cachedData) {
        console.log(`📦 Rising Stars Position - Cache hit for fiction ${royalroadId}`);
        return cachedData;
      }

      console.log(`🔄 Rising Stars Position - Cache miss for fiction ${royalroadId}, fetching fresh data`);
      // Get fiction details by Royal Road ID
      const fictionQuery = `
        SELECT id, title, author_name, royalroad_id, image_url 
        FROM fiction 
        WHERE royalroad_id = ?
      `;
      const fictionResult = await this.dbClient.query(fictionQuery, [royalroadId]);

      let fiction;
      if (fictionResult.length === 0) {
        // Fiction not found in database, try to scrape it from Royal Road
        console.log(`📚 Fiction ${royalroadId} not found in database, attempting to scrape...`);
        const scrapedFiction = await this.scrapeAndCreateFiction(royalroadId);

        if (!scrapedFiction) {
          console.log(`❌ Could not scrape fiction ${royalroadId} from Royal Road`);
          return null;
        }

        // Use the scraped fiction data
        fiction = {
          id: scrapedFiction.id,
          title: scrapedFiction.title,
          author_name: scrapedFiction.author_name,
          royalroad_id: scrapedFiction.royalroad_id
        };
      } else {
        fiction = fictionResult[0];
      }

      // Get the most recent completed scrape timestamp
      const latestScrapeQuery = `
        SELECT MAX(captured_at) as latest_scrape 
        FROM risingStars 
        WHERE captured_at < DATE_SUB(NOW(), INTERVAL 5 MINUTE)
      `;
      const latestScrapeResult = await this.dbClient.query(latestScrapeQuery);
      const latestScrape = latestScrapeResult[0]?.latest_scrape;

      if (!latestScrape) {
        throw new Error('No recent Rising Stars data available');
      }

      // Check if fiction has ever appeared in any Rising Stars genre list
      const genreCheckQuery = `
        SELECT COUNT(*) as count 
        FROM risingStars 
        WHERE fiction_id = ?
      `;
      const genreCheckResult = await this.dbClient.query(genreCheckQuery, [fiction.id]);

      if (genreCheckResult[0].count === 0) {
        throw new Error(`Fiction "${fiction.title}" by ${fiction.author_name} is not currently on any Rising Stars genre list. Once this fiction is on a genre list try again.`);
      }

      // Check if fiction is already on Rising Stars main (most recent entry)
      const mainCheckQuery = `
        SELECT position 
        FROM risingStars 
        WHERE fiction_id = ? 
        AND genre = 'main' 
        ORDER BY captured_at DESC
        LIMIT 1
      `;
      const mainCheckResult = await this.dbClient.query(mainCheckQuery, [fiction.id]);

      if (mainCheckResult.length > 0) {
        // Fiction is already on main page
        const genrePositions = await this.getFictionGenrePositions(fiction.id, latestScrape);

        const result = {
          fictionId: fiction.id,
          title: fiction.title,
          authorName: fiction.author_name,
          royalroadId: fiction.royalroad_id,
          imageUrl: fiction.image_url,
          isOnMain: true,
          mainPosition: mainCheckResult[0].position,
          estimatedPosition: mainCheckResult[0].position,
          fictionsAhead: mainCheckResult[0].position - 1,
          fictionsToClimb: 0,
          lastUpdated: latestScrape,
          genrePositions
        };

        // Cache the result
        cacheService.set(cacheKey, result, this.CACHE_TTL);
        console.log(`✅ Rising Stars Position - Data fetched and cached for fiction ${royalroadId} (on main page)`);
        
        return result;
      }

      // Fiction is not on main page - calculate position
      const positionData = await this.calculateEstimatedPosition(fiction.id, latestScrape);
      const genrePositions = await this.getFictionGenrePositions(fiction.id, latestScrape);

      const result = {
        fictionId: fiction.id,
        title: fiction.title,
        authorName: fiction.author_name,
        royalroadId: fiction.royalroad_id,
        imageUrl: fiction.image_url,
        isOnMain: false,
        estimatedPosition: positionData.estimatedPosition,
        fictionsAhead: positionData.fictionsAhead,
        fictionsToClimb: Math.max(0, positionData.fictionsAhead - 49),
        lastUpdated: latestScrape,
        genrePositions,
        fictionsAheadDetails: positionData.fictionsAheadDetails
      };

      // Cache the result
      cacheService.set(cacheKey, result, this.CACHE_TTL);
      console.log(`✅ Rising Stars Position - Data fetched and cached for fiction ${royalroadId}`);
      
      return result;

    } catch (error) {
      console.error('Error calculating Rising Stars position:', error);
      throw error;
    }
  }

  /**
   * Calculate estimated position for fiction not on main page
   */
  private async calculateEstimatedPosition(fictionId: number, scrapeTimestamp: string): Promise<{
    estimatedPosition: number;
    fictionsAhead: number;
    fictionsAheadDetails: { fictionId: number; title: string; authorName: string; royalroadId: string }[];
  }> {
    // Get all genres (from any timestamp)
    const genresQuery = `
      SELECT DISTINCT genre 
      FROM risingStars 
      ORDER BY genre
    `;
    const genresResult = await this.dbClient.query(genresQuery);
    const allGenres = genresResult.map((row: any) => row.genre);

    // Step 1: Add all fictions from Rising Stars main (most recent)
    const mainFictionsQuery = `
      SELECT DISTINCT fiction_id 
      FROM risingStars 
      WHERE genre = 'main' 
      ORDER BY captured_at DESC
      LIMIT 50
    `;
    const mainFictionsResult = await this.dbClient.query(mainFictionsQuery);
    const fictionsAhead = new Set(mainFictionsResult.map((row: any) => row.fiction_id));


    // Step 2: Find genres where this fiction appears and add fictions above it (most recent)
    const fictionGenresQuery = `
      SELECT genre, position, captured_at
      FROM risingStars 
      WHERE fiction_id = ? 
      ORDER BY captured_at DESC
    `;
    const fictionGenresResult = await this.dbClient.query(fictionGenresQuery, [fictionId]);

    // Group fiction genres by genre to get the most recent entry for each genre
    const fictionGenresByGenre = new Map();
    for (const fictionGenre of fictionGenresResult) {
      if (!fictionGenresByGenre.has(fictionGenre.genre)) {
        fictionGenresByGenre.set(fictionGenre.genre, fictionGenre);
      }
    }

    for (const [genre, fictionGenre] of fictionGenresByGenre) {
      const position = fictionGenre.position;
      const capturedAt = fictionGenre.captured_at;

      // Add all fictions above this fiction in this genre (same timestamp)
      const aboveFictionsQuery = `
        SELECT DISTINCT fiction_id 
        FROM risingStars 
        WHERE genre = ? 
        AND position < ? 
        AND captured_at = ?
      `;
      const aboveFictionsResult = await this.dbClient.query(aboveFictionsQuery, [genre, position, capturedAt]);

      aboveFictionsResult.forEach((row: any) => {
        fictionsAhead.add(row.fiction_id);
      });
    }


    // Step 3: For genres where this fiction doesn't appear, add any fiction that is above a fiction in the current list
    const fictionGenres = Array.from(fictionGenresByGenre.keys());
    const missingGenres = allGenres.filter((genre: any) => !fictionGenres.includes(genre));

    for (const missingGenre of missingGenres) {
      // Convert current fictionsAhead set to array for the query
      const currentFictionIds = Array.from(fictionsAhead);

      if (currentFictionIds.length > 0) {
        // Find fictions in this genre that are above any fiction in our current list
        const genreFictionsQuery = `
          SELECT DISTINCT rs1.fiction_id 
          FROM risingStars rs1
          WHERE rs1.genre = ? 
          AND rs1.captured_at = ?
          AND EXISTS (
            SELECT 1 FROM risingStars rs2 
            WHERE rs2.fiction_id IN (${currentFictionIds.map(() => '?').join(',')})
            AND rs2.genre = ?
            AND rs2.captured_at = ?
            AND rs1.position < rs2.position
          )
        `;

        const queryParams = [missingGenre, scrapeTimestamp, ...currentFictionIds, missingGenre, scrapeTimestamp];
        const genreFictionsResult = await this.dbClient.query(genreFictionsQuery, queryParams);

        // Add fictions that are above any fiction in our current list
        genreFictionsResult.forEach((row: any) => {
          fictionsAhead.add(row.fiction_id);
        });
      }
    }

    const totalFictionsAhead = fictionsAhead.size;
    const estimatedPosition = totalFictionsAhead + 1;

    // Get fiction details for fictions ahead that are NOT on Rising Stars Main
    // Look at ALL fictions ahead, then filter out the ones on Main
    const fictionIdsArray = Array.from(fictionsAhead);
    let fictionsAheadDetails: { fictionId: number; title: string; authorName: string; royalroadId: string }[] = [];


    if (fictionIdsArray.length > 0) {
      // Get the fiction IDs that are on Rising Stars Main (most recent)
      const mainFictionIdsQuery = `
        SELECT DISTINCT fiction_id 
        FROM risingStars 
        WHERE genre = 'main' 
        ORDER BY captured_at DESC
        LIMIT 50
      `;
      const mainFictionIdsResult = await this.dbClient.query(mainFictionIdsQuery);
      const mainFictionIds = mainFictionIdsResult.map((row: any) => row.fiction_id);


      // Filter out main fiction IDs from ALL fictions ahead (not just first 20)
      const filteredFictionIds = fictionIdsArray.filter(id => !mainFictionIds.includes(id));


      if (filteredFictionIds.length > 0) {
        // Get details for all filtered fictions (limit to 20 for display purposes)
        const fictionDetailsQuery = `
          SELECT id, title, author_name, royalroad_id, image_url 
          FROM fiction 
          WHERE id IN (${filteredFictionIds.map(() => '?').join(',')})
          ORDER BY id ASC
          LIMIT 20
        `;
        const fictionDetailsResult = await this.dbClient.query(fictionDetailsQuery, filteredFictionIds);
        fictionsAheadDetails = fictionDetailsResult.map((row: any) => ({
          fictionId: row.id,
          title: row.title,
          authorName: row.author_name,
          royalroadId: row.royalroad_id,
          imageUrl: row.image_url
        }));

      }
    }

    return {
      estimatedPosition,
      fictionsAhead: totalFictionsAhead,
      fictionsAheadDetails
    };
  }

  /**
   * Get Rising Stars position for multiple fictions
   */
  async getRisingStarsPositions(royalroadIds: string[]): Promise<RisingStarsPosition[]> {
    const positions: RisingStarsPosition[] = [];

    for (const royalroadId of royalroadIds) {
      try {
        const position = await this.calculateRisingStarsPosition(royalroadId);
        if (position) {
          positions.push(position);
        }
      } catch (error) {
        console.error(`Error calculating position for fiction ${royalroadId}:`, error);
      }
    }

    return positions;
  }

  /**
   * Get the latest Rising Stars scrape timestamp
   */
  async getLatestScrapeTimestamp(): Promise<string | null> {
    try {
      const query = `
        SELECT MAX(captured_at) as latest_scrape 
        FROM risingStars 
      `;
      const result = await this.dbClient.query(query);
      return result[0]?.latest_scrape || null;
    } catch (error) {
      console.error('Error getting latest scrape timestamp:', error);
      return null;
    }
  }

  /**
   * Map fiction tags to Rising Stars genres
   */
  private mapTagsToGenres(tags: string[]): string[] {
    const tagToGenreMap: { [key: string]: string } = {
      // Direct matches
      'action': 'action',
      'adventure': 'adventure',
      'comedy': 'comedy',
      'drama': 'drama',
      'fantasy': 'fantasy',
      'historical': 'historical',
      'horror': 'horror',
      'mystery': 'mystery',
      'romance': 'romance',
      'satire': 'satire',
      'scifi': 'sci_fi',
      'slice_of_life': 'slice_of_life',
      'sports': 'sports',
      'supernatural': 'supernatural',
      'tragedy': 'tragedy',

      // Character/lead type matches
      'anti-hero_lead': 'anti-hero_lead',
      'antihero_lead': 'anti-hero_lead',
      'antihero': 'anti-hero_lead',
      'artificial_intelligence': 'artificial_intelligence',
      'ai': 'artificial_intelligence',
      'attractive_lead': 'attractive_lead',
      'cyberpunk': 'cyberpunk',
      'dungeon': 'dungeon',
      'dystopia': 'dystopia',
      'dystopian': 'dystopia',
      'female_lead': 'female_lead',
      'first_contact': 'first_contact',
      'gamelit': 'gamelit',
      'game_lit': 'gamelit',
      'gender_bender': 'gender_bender',
      'genetically_engineered': 'genetically_engineered%20',
      'grimdark': 'grimdark',
      'harem': 'harem',
      'high_fantasy': 'high_fantasy',

      'litrpg': 'litrpg',
      'lit_rpg': 'litrpg',
      'low_fantasy': 'low_fantasy',
      'male_lead': 'male_lead',
      'multiple_lead': 'multiple_lead',
      'multiple_lead_characters': 'multiple_lead',
      'mythos': 'mythos',
      'non_human_lead': 'non-human_lead',
      'non-human_lead': 'non_human_lead',
      'post_apocalyptic': 'post_apocalyptic',
      'post_apocalypse': 'post_apocalyptic',
      'progression': 'progression',
      'psychological': 'psychological',
      'reader_interactive': 'reader_interactive',
      'reincarnation': 'reincarnation',
      'ruling_class': 'ruling_class',
      'school_life': 'school_life',
      'schoollife': 'school_life',
      'secret_identity': 'secret_identity',
      'soft_scifi': 'soft_sci-fi',
      'soft_sci_fi': 'soft_sci-fi',
      'soft_sci-fi': 'soft_sci-fi',
      'space_opera': 'space_opera',
      'steampunk': 'steampunk',
      'strong_lead': 'strong_lead',
      'super_heroes': 'super_heroes',
      'superhero': 'super_heroes',
      'superheroes': 'super_heroes',
      'technologically_engineered': 'technologically_engineered',
      'time_loop': 'loop',
      'time_travel': 'time_travel',
      'urban_fantasy': 'urban_fantasy',
      'villainous_lead': 'villainous_lead',
      'virtual_reality': 'virtual_reality',
      'vr': 'virtual_reality',
      'war_and_military': 'war_and_military',
      'military': 'war_and_military',
      'wuxia': 'wuxia',
      'xianxia': 'xianxia',
      'summoned_hero': 'summoned_hero',

      // Additional matches based on your examples
      'martial_arts': 'martial_arts',
      'portal_fantasy': 'portal_fantasy',
      'isekai': 'portal_fantasy',
      'magic': 'magic',
      'strategy': 'strategy',
      'contemporary': 'contemporary',
      'hard_sci_fi': 'sci_fi',
      'hard_sci-fi': 'sci_fi'
    };

    const matchedGenres = new Set<string>();

    for (const tag of tags) {
      // Normalize tag: lowercase, replace spaces and special chars with underscores
      const normalizedTag = tag.toLowerCase()
        .replace(/[^a-z0-9_]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');

      if (tagToGenreMap[normalizedTag]) {
        matchedGenres.add(tagToGenreMap[normalizedTag]);
      }
    }

    return Array.from(matchedGenres);
  }

  /**
   * Get fiction's most recent position in each relevant genre
   */
  async getFictionGenrePositions(fictionId: number, latestScrape: string): Promise<{ genre: string; position: number | null; isOnList: boolean; lastScraped: string | null }[]> {
    try {
      // Get fiction tags
      const fictionQuery = 'SELECT tags FROM fiction WHERE id = ?';
      const fictionResult = await this.dbClient.query(fictionQuery, [fictionId]);

      if (fictionResult.length === 0) {
        return [];
      }

      let tags = fictionResult[0].tags || [];

      // Parse tags if they're stored as a JSON string
      if (typeof tags === 'string') {
        try {
          tags = JSON.parse(tags);
        } catch (error) {
          console.error('Error parsing tags JSON:', error);
          tags = [];
        }
      }

      const relevantGenres = this.mapTagsToGenres(tags);

      if (relevantGenres.length === 0) {
        return [];
      }

      // Get positions for each relevant genre
      const genrePositions = [];

      for (const genre of relevantGenres) {
        const positionQuery = `
          SELECT position, captured_at 
          FROM risingStars 
          WHERE fiction_id = ? 
          AND genre = ? 
          ORDER BY captured_at DESC
          LIMIT 1
        `;

        const positionResult = await this.dbClient.query(positionQuery, [fictionId, genre]);

        genrePositions.push({
          genre,
          position: positionResult.length > 0 ? positionResult[0].position : null,
          isOnList: positionResult.length > 0,
          lastScraped: positionResult.length > 0 ? positionResult[0].captured_at : null
        });
      }

      return genrePositions;
    } catch (error) {
      console.error('Error getting fiction genre positions:', error);
      return [];
    }
  }
}
