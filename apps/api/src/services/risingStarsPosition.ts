import { client } from '../config/database.ts';
import { RoyalRoadService } from './royalroad.ts';
import { FictionService } from './fiction.ts';
import type { CreateFictionRequest } from '../types/index.ts';

export interface RisingStarsPosition {
  fictionId: number;
  title: string;
  authorName: string;
  royalroadId: string;
  isOnMain: boolean;
  mainPosition?: number;
  estimatedPosition: number;
  fictionsAhead: number;
  fictionsToClimb: number;
  lastUpdated: string;
}

export class RisingStarsPositionService {
  private dbClient = client;
  private lastRequestTimes = new Map<string, number>(); // royalroadId -> timestamp

  /**
   * Check if enough time has passed since last request (1 minute cooldown)
   */
  private canMakeRequest(royalroadId: string): boolean {
    const now = Date.now();
    const lastRequest = this.lastRequestTimes.get(royalroadId);

    if (!lastRequest) {
      return true; // First request
    }

    const timeSinceLastRequest = now - lastRequest;
    const oneMinute = 60 * 1000; // 60 seconds in milliseconds

    return timeSinceLastRequest >= oneMinute;
  }

  /**
   * Record that a request was made for this fiction
   */
  private recordRequest(royalroadId: string): void {
    this.lastRequestTimes.set(royalroadId, Date.now());
  }

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
      // Check rate limiting
      if (!this.canMakeRequest(royalroadId)) {
        const now = Date.now();
        const lastRequest = this.lastRequestTimes.get(royalroadId)!;
        const timeSinceLastRequest = now - lastRequest;
        const oneMinute = 60 * 1000;
        const remainingTime = Math.ceil((oneMinute - timeSinceLastRequest) / 1000);

        throw new Error(`Rate limited. Please wait ${remainingTime} seconds before requesting again.`);
      }

      // Record this request
      this.recordRequest(royalroadId);

      // Get fiction details by Royal Road ID
      const fictionQuery = `
        SELECT id, title, author_name, royalroad_id 
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

      // Check if fiction appears in any Rising Stars genre list
      const genreCheckQuery = `
        SELECT COUNT(*) as count 
        FROM risingStars 
        WHERE fiction_id = ? 
        AND captured_at = ?
      `;
      const genreCheckResult = await this.dbClient.query(genreCheckQuery, [fiction.id, latestScrape]);

      if (genreCheckResult[0].count === 0) {
        throw new Error(`Fiction "${fiction.title}" by ${fiction.author_name} is not currently on any Rising Stars genre list. Once this fiction is on a genre list try again.`);
      }

      // Check if fiction is already on Rising Stars main
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
        return {
          fictionId: fiction.id,
          title: fiction.title,
          authorName: fiction.author_name,
          royalroadId: fiction.royalroad_id,
          isOnMain: true,
          mainPosition: mainCheckResult[0].position,
          estimatedPosition: mainCheckResult[0].position,
          fictionsAhead: mainCheckResult[0].position - 1,
          fictionsToClimb: 0,
          lastUpdated: latestScrape
        };
      }

      // Fiction is not on main page - calculate position
      const positionData = await this.calculateEstimatedPosition(fiction.id, latestScrape);

      return {
        fictionId: fiction.id,
        title: fiction.title,
        authorName: fiction.author_name,
        royalroadId: fiction.royalroad_id,
        isOnMain: false,
        estimatedPosition: positionData.estimatedPosition,
        fictionsAhead: positionData.fictionsAhead,
        fictionsToClimb: Math.max(0, positionData.fictionsAhead - 49),
        lastUpdated: latestScrape
      };

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
  }> {
    // Get all genres
    const genresQuery = `
      SELECT DISTINCT genre 
      FROM risingStars 
      WHERE captured_at = ?
      ORDER BY genre
    `;
    const genresResult = await this.dbClient.query(genresQuery, [scrapeTimestamp]);
    const allGenres = genresResult.map((row: any) => row.genre);

    // Step 1: Add all fictions from Rising Stars main
    const mainFictionsQuery = `
      SELECT DISTINCT fiction_id 
      FROM risingStars 
      WHERE genre = 'main' 
      AND captured_at = ?
      ORDER BY position ASC
    `;
    const mainFictionsResult = await this.dbClient.query(mainFictionsQuery, [scrapeTimestamp]);
    const fictionsAhead = new Set(mainFictionsResult.map((row: any) => row.fiction_id));

    // Step 2: Find genres where this fiction appears and add fictions above it
    const fictionGenresQuery = `
      SELECT genre, position 
      FROM risingStars 
      WHERE fiction_id = ? 
      AND captured_at = ?
    `;
    const fictionGenresResult = await this.dbClient.query(fictionGenresQuery, [fictionId, scrapeTimestamp]);

    for (const fictionGenre of fictionGenresResult) {
      const genre = fictionGenre.genre;
      const position = fictionGenre.position;

      // Add all fictions above this fiction in this genre
      const aboveFictionsQuery = `
        SELECT DISTINCT fiction_id 
        FROM risingStars 
        WHERE genre = ? 
        AND position < ? 
        AND captured_at = ?
      `;
      const aboveFictionsResult = await this.dbClient.query(aboveFictionsQuery, [genre, position, scrapeTimestamp]);

      aboveFictionsResult.forEach((row: any) => {
        fictionsAhead.add(row.fiction_id);
      });
    }

    // Step 3: For genres where this fiction doesn't appear, add any fiction that is above a fiction in the current list
    const fictionGenres = fictionGenresResult.map((row: any) => row.genre);
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

    return {
      estimatedPosition,
      fictionsAhead: totalFictionsAhead
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
        WHERE captured_at < DATE_SUB(NOW(), INTERVAL 5 MINUTE)
      `;
      const result = await this.dbClient.query(query);
      return result[0]?.latest_scrape || null;
    } catch (error) {
      console.error('Error getting latest scrape timestamp:', error);
      return null;
    }
  }
}
