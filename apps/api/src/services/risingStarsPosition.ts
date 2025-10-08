import { client } from '../config/database.ts';
import { cacheService } from './cache.ts';
import { risingStarsBestPositionsService } from './risingStarsBestPositions.ts';
import { decodeHtmlEntities } from '../utils/htmlEntities.ts';
import { getRSMainBottomWithMovement, getFictionMovement } from '../utils/risingStarsQueries.ts';
import { RisingStarsMainService } from './risingStarsMain.ts';
import { competitiveZoneCacheService } from './competitiveZoneCache.ts';

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
  genrePositions: { genre: string; position: number | null; bestPosition: number | null; isOnList: boolean; lastScraped: string | null }[];
  fictionsAheadDetails?: {
    fictionId: number;
    title: string;
    authorName: string;
    royalroadId: string;
    imageUrl?: string;
    lastMove?: 'up' | 'down' | 'same' | 'new';
    lastPosition?: number;
    lastMoveDate?: string;
    position?: number; // Actual position on RS Main
    isUserFiction?: boolean; // Flag to identify the user's own fiction
  }[];
}

export class RisingStarsPositionService {
  private dbClient = client;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes


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
        // Fiction not found in database - scraping is now handled by serverless functions
        console.log(`📚 Fiction ${royalroadId} not found in database. Please ensure the serverless scraping functions are running.`);
        return null;
      } else {
        fiction = fictionResult[0];
      }

      // Get the most recent fiction details from fictionHistory
      const historyQuery = `
        SELECT title, image_url 
        FROM fictionHistory 
        WHERE fiction_id = ? 
        ORDER BY captured_at DESC 
        LIMIT 1
      `;
      const historyResult = await this.dbClient.query(historyQuery, [fiction.id]);

      // Use the most recent title and image_url if available
      if (historyResult.length > 0) {
        if (historyResult[0].title) {
          fiction.title = historyResult[0].title;
        }
        if (historyResult[0].image_url) {
          fiction.image_url = historyResult[0].image_url;
        }
      }

      // Get the most recent completed scrape timestamp
      const latestScrapeQuery = `
        SELECT MAX(captured_at) as latest_scrape 
        FROM risingStars 
      `;
      const latestScrapeResult = await this.dbClient.query(latestScrapeQuery);
      const latestScrapeRaw = latestScrapeResult[0]?.latest_scrape;

      if (!latestScrapeRaw) {
        throw new Error('No recent Rising Stars data available');
      }

      // Convert to string if it's a Date object (for consistent querying)
      const latestScrape = latestScrapeRaw instanceof Date
        ? latestScrapeRaw.toISOString()
        : latestScrapeRaw;

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

      // Check if fiction is currently on Rising Stars main (most recent scrape)
      const mainCheckQuery = `
        SELECT position 
        FROM risingStars 
        WHERE fiction_id = ? 
        AND genre = 'main' 
        AND captured_at = ?
      `;
      const mainCheckResult = await this.dbClient.query(mainCheckQuery, [fiction.id, latestScrape]);

      if (mainCheckResult.length > 0) {
        // Fiction is already on main page
        const genrePositions = await this.getFictionGenrePositions(fiction.id, latestScrape);

        const result = {
          fictionId: fiction.id,
          title: decodeHtmlEntities(fiction.title),
          authorName: decodeHtmlEntities(fiction.author_name),
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

      // Fiction is not on main page - check competitive zone cache first
      console.log(`🔍 Checking competitive zone cache for fiction ${fiction.id}`);
      const cachedPosition = await competitiveZoneCacheService.getFictionPosition(fiction.id);

      let positionData;
      let genrePositions;

      if (cachedPosition) {
        // Fast path: Fiction is in competitive zone cache
        console.log(`⚡ Cache hit! Fiction at position #${cachedPosition.calculated_position}`);
        
        // Get context fictions (7 on either side)
        const startPos = Math.max(1, cachedPosition.calculated_position - 7);
        const endPos = cachedPosition.calculated_position + 7;
        const contextFictions = await competitiveZoneCacheService.getFictionsInRange(startPos, endPos);

        // Mark the user's fiction
        const fictionsAheadDetails = contextFictions.map((f: any) => ({
          fictionId: f.fiction_id,
          title: decodeHtmlEntities(f.title),
          authorName: decodeHtmlEntities(f.author_name),
          royalroadId: f.royalroad_id,
          imageUrl: f.image_url,
          position: f.calculated_position,
          lastMove: f.last_move as 'up' | 'down' | 'same' | 'new',
          lastPosition: f.last_position || undefined,
          lastMoveDate: f.last_move_date || undefined,
          isUserFiction: f.fiction_id === fiction.id
        }));

        genrePositions = await this.getFictionGenrePositions(fiction.id, latestScrape);

        positionData = {
          estimatedPosition: cachedPosition.calculated_position,
          fictionsAhead: cachedPosition.calculated_position - 1,
          fictionsAheadDetails
        };

        console.log(`✅ Used competitive zone cache: position #${cachedPosition.calculated_position}, showing ${fictionsAheadDetails.length} context fictions`);
      } else {
        // Slow path: Full calculation
        console.log(`🐌 Not in cache, doing full calculation`);
        positionData = await this.calculateEstimatedPosition(fiction.id, latestScrape, {
          title: decodeHtmlEntities(fiction.title),
          authorName: decodeHtmlEntities(fiction.author_name),
          royalroadId: fiction.royalroad_id,
          imageUrl: fiction.image_url
        });
        genrePositions = await this.getFictionGenrePositions(fiction.id, latestScrape);
      }

      const result = {
        fictionId: fiction.id,
        title: decodeHtmlEntities(fiction.title),
        authorName: decodeHtmlEntities(fiction.author_name),
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
  private async calculateEstimatedPosition(fictionId: number, scrapeTimestamp: string, userFictionData?: { title: string; authorName: string; royalroadId: string; imageUrl?: string }): Promise<{
    estimatedPosition: number;
    fictionsAhead: number;
    fictionsAheadDetails: {
      fictionId: number;
      title: string;
      authorName: string;
      royalroadId: string;
      imageUrl?: string;
      lastMove?: 'up' | 'down' | 'same' | 'new';
      lastPosition?: number;
      lastMoveDate?: string;
      position?: number;
      isUserFiction?: boolean;
    }[];
  }> {
    // Get all genres (from any timestamp)
    const genresQuery = `
      SELECT DISTINCT genre 
      FROM risingStars 
      ORDER BY genre
    `;
    const genresResult = await this.dbClient.query(genresQuery);
    const allGenres = genresResult.map((row: any) => row.genre);

    // Step 1: Add all fictions from Rising Stars main (most recent scrape)
    const mainFictionsQuery = `
      SELECT DISTINCT fiction_id 
      FROM risingStars 
      WHERE genre = 'main' 
      AND captured_at = ?
      LIMIT 50
    `;
    const mainFictionsResult = await this.dbClient.query(mainFictionsQuery, [scrapeTimestamp]);
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

    // Build combined list using optimized queries
    let fictionsAheadDetails: {
      fictionId: number;
      title: string;
      authorName: string;
      royalroadId: string;
      imageUrl?: string;
      lastMove?: 'up' | 'down' | 'same' | 'new';
      lastPosition?: number;
      lastMoveDate?: string;
      position?: number;
      isUserFiction?: boolean;
    }[] = [];

    console.log(`🔍 Position Calculator - Using optimized queries`);

    // Step 1: Get RS Main positions 46-50 from the main Rising Stars list (already cached)
    try {
      const risingStarsMainService = new RisingStarsMainService();
      const allRSMain = await risingStarsMainService.getRisingStarsMainList();

      // Filter to get only positions 46-50
      const rsMainBottom5 = allRSMain
        .filter(entry => entry.position >= 46 && entry.position <= 50)
        .map(entry => ({
          fictionId: entry.fictionId,
          title: entry.title,
          authorName: entry.authorName,
          royalroadId: entry.royalroadId,
          imageUrl: entry.imageUrl,
          position: entry.position,
          lastMove: entry.lastMove,
          lastPosition: entry.lastPosition,
          lastMoveDate: entry.lastMoveDate,
          isUserFiction: false
        }));

      console.log(`📋 Got RS Main bottom 5 from main list: ${rsMainBottom5.length} fictions (positions ${rsMainBottom5.map(f => `#${f.position}`).join(', ')})`);

      if (rsMainBottom5.length > 0) {
        fictionsAheadDetails.push(...rsMainBottom5);
      }
    } catch (error) {
      console.error('⚠️  Failed to get RS Main bottom 5:', error);
      console.error('⚠️  Error details:', error instanceof Error ? error.message : String(error));
    }

    // Step 2: Add user's fiction with movement data (single optimized query)
    if (userFictionData) {
      try {
        const userMovement = await getFictionMovement(fictionId, 'main', scrapeTimestamp);
        const userPosition = userMovement.currentPosition || estimatedPosition;

        console.log(`👤 User fiction at #${userPosition}, movement: ${userMovement.lastMove}`);

        fictionsAheadDetails.push({
          fictionId,
          title: userFictionData.title,
          authorName: userFictionData.authorName,
          royalroadId: userFictionData.royalroadId,
          imageUrl: userFictionData.imageUrl,
          position: userPosition,
          lastMove: userMovement.lastMove,
          lastPosition: userMovement.lastPosition,
          lastMoveDate: userMovement.lastMoveDate,
          isUserFiction: true
        });
      } catch (error) {
        console.error('⚠️  Failed to get user fiction movement:', error);
      }
    }

    // Step 3: Get fiction details for fictions ahead that are NOT on Rising Stars Main
    const fictionIdsArray = Array.from(fictionsAhead);

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
        // Get fiction details with their positions using optimized query
        const limitedFictionIds = filteredFictionIds.slice(0, 10) as number[]; // Reduce from 20 to 10 to avoid timeout
        const fictionDetailsQuery = `
          SELECT 
            f.id,
            f.title,
            f.author_name,
            f.royalroad_id,
            f.image_url,
            rs.position
          FROM fiction f
          LEFT JOIN risingStars rs ON f.id = rs.fiction_id 
            AND rs.genre = 'main' 
            AND rs.captured_at = ?
          WHERE f.id IN (${limitedFictionIds.map(() => '?').join(',')})
          ORDER BY f.id ASC
        `;
        const fictionDetailsResult = await this.dbClient.query(fictionDetailsQuery, [scrapeTimestamp, ...limitedFictionIds]);

        // Add non-Main fictions with calculated positions starting from 51
        let nextPosition = 51; // Start from position 51 (just after RS Main's #50)
        const nonMainFictions = fictionDetailsResult.map((row: any) => {
          const assignedPosition = nextPosition++;
          return {
            fictionId: row.id,
            title: decodeHtmlEntities(row.title),
            authorName: decodeHtmlEntities(row.author_name),
            royalroadId: row.royalroad_id,
            imageUrl: row.image_url,
            position: assignedPosition, // Assign sequential position starting from 51
            lastMove: 'new' as const,
            isUserFiction: false
          };
        });

        fictionsAheadDetails.push(...nonMainFictions);
      }
    }

    // Remove duplicates (keep user's version if duplicate)
    const seenFictionIds = new Set<number>();
    const uniqueFictions = fictionsAheadDetails.filter(f => {
      if (seenFictionIds.has(f.fictionId)) {
        console.log(`🔍 Duplicate found: ${f.fictionId} - keeping ${f.isUserFiction ? 'USER version' : 'other version'}`);
        return f.isUserFiction; // Keep user's version if duplicate
      }
      seenFictionIds.add(f.fictionId);
      return true;
    });

    // Sort by position
    uniqueFictions.sort((a, b) => {
      const posA = a.position || estimatedPosition;
      const posB = b.position || estimatedPosition;
      return posA - posB;
    });

    console.log(`🔍 Position Calculator - Final list has ${uniqueFictions.length} unique fictions`);
    console.log(`🔍 Position Calculator - Fiction IDs: ${uniqueFictions.map(f => `${f.fictionId}${f.isUserFiction ? '(YOU)' : ''}`).join(', ')}`);
    console.log(`🔍 Position Calculator - Positions: ${uniqueFictions.map(f => `#${f.position}`).join(', ')}`);

    return {
      estimatedPosition,
      fictionsAhead: totalFictionsAhead,
      fictionsAheadDetails: uniqueFictions
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
   * Now includes best historical position from risingStarsBestPositions table
   */
  async getFictionGenrePositions(fictionId: number, latestScrape: string): Promise<{ genre: string; position: number | null; bestPosition: number | null; isOnList: boolean; lastScraped: string | null }[]> {
    try {
      // Get fiction tags from the most recent fictionHistory entry
      const fictionQuery = `
        SELECT tags 
        FROM fictionHistory 
        WHERE fiction_id = ? 
        ORDER BY captured_at DESC 
        LIMIT 1
      `;
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

      // Get all best positions at once
      const allBestPositions = await risingStarsBestPositionsService.getAllBestPositions(fictionId);

      // Get positions for each relevant genre
      const genrePositions: {
        genre: string;
        position: number | null;
        bestPosition: number | null;
        isOnList: boolean;
        lastScraped: string | null
      }[] = [];

      for (const genre of relevantGenres) {
        // Get current position from risingStars table
        const positionQuery = `
          SELECT position, captured_at 
          FROM risingStars 
          WHERE fiction_id = ? 
          AND genre = ? 
          ORDER BY captured_at DESC
          LIMIT 1
        `;

        const positionResult = await this.dbClient.query(positionQuery, [fictionId, genre]);
        const currentPosition = positionResult.length > 0 ? positionResult[0].position : null;

        // Get best position (checks both tables internally)
        const bestPosition = allBestPositions.get(genre) || null;

        genrePositions.push({
          genre,
          position: currentPosition,
          bestPosition: bestPosition,
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
