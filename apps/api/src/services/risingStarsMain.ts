import { client } from '../config/database.ts';
import { cacheService } from './cache.ts';

// Helper function to decode HTML entities
function decodeHtmlEntities(text: string | null | undefined): string {
  if (!text || typeof text !== 'string') return text || '';

  // First, handle numeric entities (both decimal and hex)
  text = text.replace(/&#x([0-9a-fA-F]+);/g, (_match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });
  
  text = text.replace(/&#(\d+);/g, (_match, dec) => {
    return String.fromCharCode(parseInt(dec, 10));
  });

  // Then handle named entities
  const entities: { [key: string]: string } = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
    '&ndash;': '–',
    '&mdash;': '—',
    '&hellip;': '…',
    '&copy;': '©',
    '&reg;': '®',
    '&trade;': '™',
    '&lsquo;': '\u2018',
    '&rsquo;': '\u2019',
    '&ldquo;': '\u201C',
    '&rdquo;': '\u201D',
    '&bull;': '•',
    '&middot;': '·',
    '&deg;': '°'
  };

  return text.replace(/&[a-zA-Z0-9#]+;/g, (entity) => {
    return entities[entity] || entity;
  });
}

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
        // Create a map of current positions for easy lookup
        const currentPositionMap = new Map<number, number>();
        mainFictions.forEach((fiction: any) => {
          currentPositionMap.set(fiction.fiction_id, fiction.position);
        });

        // Get all fiction IDs
        const fictionIds = mainFictions.map((f: any) => f.fiction_id);
        const placeholders = fictionIds.map(() => '?').join(',');

        // For each fiction in our list, find the most recent record where position differs
        // We'll get all records before latestScrape, then filter in JavaScript
        const previousPositionQuery = `
          SELECT 
            rs.fiction_id,
            rs.position,
            rs.captured_at
          FROM risingStars rs
          INNER JOIN (
            SELECT fiction_id, MAX(captured_at) as max_captured
            FROM risingStars
            WHERE fiction_id IN (${placeholders})
              AND genre = 'main'
              AND captured_at < ?
            GROUP BY fiction_id, position
          ) latest ON rs.fiction_id = latest.fiction_id 
            AND rs.captured_at = latest.max_captured
          WHERE rs.genre = 'main'
          ORDER BY rs.fiction_id, rs.captured_at DESC
        `;

        const previousPositionResult = await this.dbClient.query(
          previousPositionQuery,
          [...fictionIds, latestScrape]
        );

        // For each fiction, find the first (most recent) position that differs from current
        previousPositionResult.forEach((row: any) => {
          const currentPosition = currentPositionMap.get(row.fiction_id);
          if (currentPosition !== undefined && row.position !== currentPosition && !previousPositions.has(row.fiction_id)) {
            const formattedDate = new Date(row.captured_at).toISOString();
            previousPositions.set(row.fiction_id, {
              position: row.position,
              date: formattedDate
            });
          }
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
          title: decodeHtmlEntities(fiction.title),
          authorName: decodeHtmlEntities(fiction.author_name),
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
