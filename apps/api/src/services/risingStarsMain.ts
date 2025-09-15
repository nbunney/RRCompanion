import { client } from '../config/database.ts';

export interface RisingStarsMainEntry {
  position: number;
  fictionId: number;
  title: string;
  authorName: string;
  royalroadId: string;
  imageUrl?: string;
  daysOnList: number;
  lastMove: 'up' | 'down' | 'same' | 'new';
  lastPosition?: number;
  firstSeenAt: string;
  lastSeenAt: string;
}

export class RisingStarsMainService {
  private dbClient = client;

  async getRisingStarsMainList(): Promise<RisingStarsMainEntry[]> {
    try {
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

      // Get previous positions for movement calculation
      // For each fiction, find the most recent different position
      const previousPositions = new Map<number, number>();
      
      for (const fiction of mainFictions) {
        const previousPositionQuery = `
          SELECT position 
          FROM risingStars 
          WHERE fiction_id = ? 
            AND position != ? 
            AND captured_at < ?
          ORDER BY captured_at DESC 
          LIMIT 1
        `;
        const previousPositionResult = await this.dbClient.query(previousPositionQuery, [
          fiction.fiction_id, 
          fiction.position, 
          latestScrape
        ]);
        
        if (previousPositionResult.length > 0) {
          previousPositions.set(fiction.fiction_id, previousPositionResult[0].position);
        }
      }
      
      console.log(`🔍 Rising Stars Main - Found previous positions for ${previousPositions.size} fictions`);

      // Get first appearance data for each fiction
      const firstAppearanceQuery = `
        SELECT 
          fiction_id,
          MIN(captured_at) as first_seen_at
        FROM risingStars 
        WHERE position BETWEEN 1 AND 50
        GROUP BY fiction_id
      `;
      const firstAppearances = await this.dbClient.query(firstAppearanceQuery);
      const firstAppearanceMap = new Map<number, string>();
      firstAppearances.forEach((entry: any) => {
        firstAppearanceMap.set(entry.fiction_id, entry.first_seen_at);
      });

      // Process the data
      const result: RisingStarsMainEntry[] = mainFictions.map((fiction: any) => {
        const previousPosition = previousPositions.get(fiction.fiction_id);
        let lastMove: 'up' | 'down' | 'same' | 'new' = 'new';

        if (previousPosition !== undefined) {
          if (fiction.position < previousPosition) {
            lastMove = 'up'; // Better position (lower number)
          } else if (fiction.position > previousPosition) {
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

        return {
          position: fiction.position,
          fictionId: fiction.fiction_id,
          title: fiction.title,
          authorName: fiction.author_name,
          royalroadId: fiction.royalroad_id,
          imageUrl: fiction.image_url,
          daysOnList,
          lastMove,
          lastPosition: previousPosition,
          firstSeenAt,
          lastSeenAt: fiction.last_seen_at
        };
      });

      return result;
    } catch (error) {
      console.error('Error getting Rising Stars Main list:', error);
      throw error;
    }
  }
}
