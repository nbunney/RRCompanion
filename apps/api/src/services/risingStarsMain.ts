import { client } from '../config/database.ts';
import { cacheService } from './cache.ts';

export interface RisingStarsMainEntry {
  position: number;
  fictionId: number;
  title: string;
  authorName: string;
  royalroadId: string;
  imageUrl?: string;
  daysOnList: number;
  highestPosition: number;
  lastMove: 'up' | 'down' | 'same' | 'new';
  lastPosition?: number;
  lastMoveDate?: string;
  firstSeenAt: string;
  lastSeenAt: string;
}

export class RisingStarsMainService {
  private dbClient = client;
  private readonly CACHE_KEY = 'rising-stars-main';
  private readonly CACHE_TTL = 60 * 1000; // 1 minute

  async getRisingStarsMainList(): Promise<RisingStarsMainEntry[]> {
    try {
      // Check cache first
      const cachedData = cacheService.getWithCleanup<RisingStarsMainEntry[]>(this.CACHE_KEY);
      if (cachedData) {
        return cachedData;
      }

      console.log('🔄 Rising Stars Main - Cache miss, fetching fresh data');

      // Get the most recent Rising Stars Main data
      const latestScrapeQuery = `
        SELECT MAX(captured_at) as latest_scrape 
        FROM risingStars 
        WHERE genre = 'main'
      `;
      const latestScrapeResult = await this.dbClient.query(latestScrapeQuery);
      const latestScrape = latestScrapeResult[0]?.latest_scrape;

      if (!latestScrape) {
        throw new Error('No recent Rising Stars data available');
      }

      // Get all fictions currently on Rising Stars Main (position 1-50)
      const mainFictionsQuery = `
        SELECT 
          rs.position,
          rs.fiction_id,
          f.title,
          f.author_name,
          f.royalroad_id,
          f.image_url,
          rs.captured_at as last_seen_at
        FROM risingStars rs
        JOIN fiction f ON rs.fiction_id = f.id
        WHERE rs.captured_at = ? 
          AND rs.genre = 'main'
          AND rs.position BETWEEN 1 AND 50
        ORDER BY rs.position ASC
      `;
      const mainFictions = await this.dbClient.query(mainFictionsQuery, [latestScrape]);
      console.log(`🔍 Rising Stars Main - Latest scrape: ${latestScrape}`);
      console.log(`🔍 Rising Stars Main - Found ${mainFictions.length} fictions`);
      console.log(`🔍 Rising Stars Main - Position range: ${mainFictions.length > 0 ? `${mainFictions[0].position}-${mainFictions[mainFictions.length - 1].position}` : 'none'}`);

      // Get previous positions for movement calculation in a single query
      // For each fiction, find the most recent different position
      const previousPositions = new Map<number, { position: number; date: string }>();

      if (mainFictions.length > 0) {
        // Build WHERE clause for all fictions at once
        const fictionIds = mainFictions.map((f: any) => f.fiction_id);
        const placeholders = fictionIds.map(() => '?').join(',');

        // For each fiction, we need to find the most recent position that's DIFFERENT from current
        // We'll do this by joining with the current position and filtering in SQL
        const previousPositionQuery = `
          SELECT 
            rs_prev.fiction_id,
            rs_prev.position,
            rs_prev.captured_at
          FROM risingStars rs_prev
          INNER JOIN (
            SELECT 
              rs_curr.fiction_id,
              rs_curr.position as current_position,
              MAX(rs_hist.captured_at) as max_captured_at
            FROM risingStars rs_curr
            LEFT JOIN risingStars rs_hist 
              ON rs_curr.fiction_id = rs_hist.fiction_id
              AND rs_hist.genre = 'main'
              AND rs_hist.captured_at < ?
              AND rs_hist.position != rs_curr.position
            WHERE rs_curr.fiction_id IN (${placeholders})
              AND rs_curr.genre = 'main'
              AND rs_curr.captured_at = ?
            GROUP BY rs_curr.fiction_id, rs_curr.position
            HAVING MAX(rs_hist.captured_at) IS NOT NULL
          ) latest ON rs_prev.fiction_id = latest.fiction_id 
            AND rs_prev.captured_at = latest.max_captured_at
          WHERE rs_prev.genre = 'main'
        `;

        const previousPositionResult = await this.dbClient.query(
          previousPositionQuery,
          [latestScrape, ...fictionIds, latestScrape]
        );

        previousPositionResult.forEach((row: any) => {
          const formattedDate = new Date(row.captured_at).toISOString();
          previousPositions.set(row.fiction_id, {
            position: row.position,
            date: formattedDate
          });
        });
      }

      console.log(`🔍 Rising Stars Main - Found previous positions for ${previousPositions.size} fictions`);

      // Get first appearance data for each fiction
      const firstAppearanceQuery = `
        SELECT 
          fiction_id,
          MIN(captured_at) as first_seen_at
        FROM risingStars 
        WHERE genre = 'main'
        GROUP BY fiction_id
      `;
      const firstAppearances = await this.dbClient.query(firstAppearanceQuery);
      const firstAppearanceMap = new Map<number, string>();
      firstAppearances.forEach((entry: any) => {
        firstAppearanceMap.set(entry.fiction_id, entry.first_seen_at);
      });

      // Get highest position data for each fiction
      const highestPositionQuery = `
        SELECT 
          fiction_id,
          MIN(position) as highest_position
        FROM risingStars 
        WHERE genre = 'main'
        GROUP BY fiction_id
      `;
      const highestPositions = await this.dbClient.query(highestPositionQuery);
      const highestPositionMap = new Map<number, number>();
      highestPositions.forEach((entry: any) => {
        highestPositionMap.set(entry.fiction_id, entry.highest_position);
      });

      console.log(`🔍 Rising Stars Main - Found highest positions for ${highestPositionMap.size} fictions`);

      // Process the data
      const result: RisingStarsMainEntry[] = mainFictions.map((fiction: any) => {
        const previousData = previousPositions.get(fiction.fiction_id);
        let lastMove: 'up' | 'down' | 'same' | 'new' = 'new';
        let lastPosition: number | undefined;
        let lastMoveDate: string | undefined;

        if (previousData !== undefined) {
          lastPosition = previousData.position;
          lastMoveDate = previousData.date;

          // Debug logging
          console.log(`🔍 Fiction ${fiction.fiction_id}: current position ${fiction.position}, previous position ${previousData.position}, lastMoveDate: ${previousData.date}`);

          if (fiction.position < previousData.position) {
            lastMove = 'up'; // Better position (lower number)
          } else if (fiction.position > previousData.position) {
            lastMove = 'down'; // Worse position (higher number)
          } else {
            lastMove = 'same';
          }
        }

        // Calculate days on list
        const firstSeenAt = firstAppearanceMap.get(fiction.fiction_id) || fiction.last_seen_at;
        const daysOnList = Math.floor(
          (new Date(fiction.last_seen_at).getTime() - new Date(firstSeenAt).getTime()) / (1000 * 60 * 60 * 24)
        ) + 1;

        // Get highest position
        const highestPosition = highestPositionMap.get(fiction.fiction_id) || fiction.position;

        return {
          position: fiction.position,
          fictionId: fiction.fiction_id,
          title: fiction.title,
          authorName: fiction.author_name,
          royalroadId: fiction.royalroad_id,
          imageUrl: fiction.image_url,
          daysOnList,
          highestPosition,
          lastMove,
          lastPosition,
          lastMoveDate,
          firstSeenAt,
          lastSeenAt: fiction.last_seen_at
        };
      });

      // Cache the result
      cacheService.set(this.CACHE_KEY, result, this.CACHE_TTL);
      console.log('✅ Rising Stars Main - Data fetched and cached successfully');
      return result;
    } catch (error) {
      console.error('Error getting Rising Stars Main list:', error);
      throw error;
    }
  }
}
