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

      // Get previous day's data to calculate movement
      // Find the most recent scrape from the previous day
      const previousDayQuery = `
        SELECT 
          rs.position,
          rs.fiction_id,
          rs.captured_at
        FROM risingStars rs
        WHERE DATE(rs.captured_at) = DATE_SUB(DATE(?), INTERVAL 1 DAY)
          AND rs.position BETWEEN 1 AND 50
          AND rs.captured_at = (
            SELECT MAX(captured_at) 
            FROM risingStars 
            WHERE DATE(captured_at) = DATE_SUB(DATE(?), INTERVAL 1 DAY)
          )
      `;
      const previousDayData = await this.dbClient.query(previousDayQuery, [latestScrape, latestScrape]);
      console.log(`🔍 Rising Stars Main - Previous day data: ${previousDayData.length} entries`);

      // Create a map of previous positions for quick lookup
      const previousPositions = new Map<number, number>();
      previousDayData.forEach((entry: any) => {
        previousPositions.set(entry.fiction_id, entry.position);
      });

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
