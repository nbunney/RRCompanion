import { Client } from 'mysql';
import { client } from '../config/database.ts';
import { RisingStarsService, RisingStarEntry } from './risingStars.ts';
import { FictionService } from './fiction.ts';

export interface FictionHistoryEntry {
  id?: number;
  fiction_id: number;
  pages: number;
  ratings: number;
  followers: number;
  favorites: number;
  views: number;
  score: number;
  captured_at: string;
}

export interface RisingStarFiction {
  id: string;
  title: string;
  author: string;
  genre: string;
  position: number;
  pages?: number;
  ratings?: number;
  followers?: number;
  favorites?: number;
  views?: number;
  score?: number;
  image?: string;
}

export interface RoyalRoadFiction {
  id: string;
  title: string;
  author: {
    name: string;
    id: string;
    avatar: string;
  };
  description: string;
  image: string;
  status: string;
  tags: string[];
  warnings: string[];
  type: string;
  chapters: any[];
  stats: {
    pages: number;
    ratings: number;
    followers: number;
    favorites: number;
    views: number;
    score: number;
    overall_score: number;
    style_score: number;
    story_score: number;
    grammar_score: number;
    character_score: number;
    total_views: number;
    average_views: number;
  };
}

export class FictionHistoryService {
  private risingStarsService: RisingStarsService;
  private dbClient = client;

  constructor() {
    this.risingStarsService = new RisingStarsService();
  }

  // Get a fresh database connection
  private async getConnection(): Promise<Client> {
    try {
      return client;
    } catch (error) {
      console.error('Error getting database connection:', error);
      throw error;
    }
  }

  // Close database connection
  private async closeConnection(): Promise<void> {
    try {
      // Connection is managed by the client singleton
    } catch (error) {
      console.error('Error closing database connection:', error);
    }
  }

  // Check if fiction exists by RoyalRoad ID
  private async getFictionByRoyalRoadId(royalroadId: string): Promise<any | null> {
    try {
      const result = await client.query('SELECT * FROM fiction WHERE royalroad_id = ?', [royalroadId]);
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error getting fiction by Royal Road ID:', error);
      return null;
    }
  }

  // Bulk scrape multiple fictions
  // Scraping functionality has been moved to serverless functions
  // This method is deprecated - use serverless scraping instead
  private async bulkScrapeFictions(fictions: any[]): Promise<void> {
    console.log('⚠️ bulkScrapeFictions is deprecated - scraping moved to serverless functions');
    console.log('Please use the serverless scraping endpoints instead');
  }

  // Bulk insert Fiction History entries
  async saveFictionHistoryEntries(entries: FictionHistoryEntry[]): Promise<void> {
    if (entries.length === 0) return;

    const query = `
      INSERT INTO fictionHistory (fiction_id, pages, ratings, followers, favorites, views, score, captured_at)
      VALUES ${entries.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ')}
    `;

    const values = entries.flatMap(entry => [
      entry.fiction_id,
      entry.pages,
      entry.ratings,
      entry.followers,
      entry.favorites,
      entry.views,
      entry.score,
      entry.captured_at
    ]);

    await this.dbClient.execute(query, values);
  }

  // Bulk insert Rising Stars entries
  async saveRisingStarEntries(entries: RisingStarEntry[]): Promise<void> {
    if (entries.length === 0) return;

    const query = `
      INSERT INTO risingStars (fiction_id, genre, position, captured_at)
      VALUES ${entries.map(() => '(?, ?, ?, ?)').join(', ')}
    `;

    const values = entries.flatMap(entry => [
      entry.fiction_id,
      entry.genre,
      entry.position,
      entry.captured_at
    ]);

    await this.dbClient.execute(query, values);
  }

  // Scraping functionality has been moved to serverless functions
  // This method is deprecated - use serverless scraping instead
  async saveFictionHistoryData(risingStars: RisingStarFiction[], scrapeTimestamp?: string): Promise<void> {
    console.log('⚠️ saveFictionHistoryData is deprecated - scraping moved to serverless functions');
    console.log('Please use the serverless scraping endpoints instead');
    console.log('See apps/scraping/README.md for details');
  }

  // Get fiction history by fiction ID
  async getFictionHistoryByFictionId(fictionId: number): Promise<FictionHistoryEntry[]> {
    try {
      const query = `
        SELECT * FROM fictionHistory
        WHERE fiction_id = ?
        ORDER BY captured_at DESC
      `;
      
      const result = await client.query(query, [fictionId]);
      return result as FictionHistoryEntry[];
    } catch(error) {
      console.error('❌ Error getting fiction history by fiction ID:', error);
      return [];
    }
  }

  // Get the last fiction history entry for a fiction
  async getLastFictionHistoryEntry(fictionId: number): Promise<FictionHistoryEntry | null> {
    try {
      const query = `
        SELECT * FROM fictionHistory
        WHERE fiction_id = ?
        ORDER BY captured_at DESC
        LIMIT 1
      `;
      
      const result = await client.query(query, [fictionId]);
      return result.length > 0 ? result[0] as FictionHistoryEntry : null;
    } catch(error) {
      console.error('❌ Error getting last fiction history entry:', error);
      return null;
    }
  }

  // Save a single fiction to history (public method)
  async saveFictionToHistory(fictionId: number): Promise<void> {
    console.log('⚠️ saveFictionToHistory is deprecated - scraping moved to serverless functions');
    console.log('Please use the serverless scraping endpoints instead');
    console.log('See apps/scraping/README.md for details');
  }

  // Get fiction history data for a date range
  async getFictionHistoryData(startDate: string, endDate: string): Promise<FictionHistoryEntry[]> {
    try {
      const query = `
        SELECT * FROM fictionHistory
        WHERE captured_at BETWEEN ? AND ?
        ORDER BY captured_at DESC
      `;
      
      const result = await client.query(query, [startDate, endDate]);
      return result as FictionHistoryEntry[];
    } catch(error) {
      console.error('❌ Error getting fiction history data:', error);
      return [];
    }
  }

  // Run nightly collection (deprecated - moved to serverless)
  async runNightlyCollection(): Promise<boolean> {
    console.log('⚠️ runNightlyCollection is deprecated - scraping moved to serverless functions');
    console.log('Please use the serverless scraping endpoints instead');
    return false;
  }

  // Run Rising Stars collection (deprecated - moved to serverless)
  async runRisingStarsCollection(): Promise<boolean> {
    console.log('⚠️ runRisingStarsCollection is deprecated - scraping moved to serverless functions');
    console.log('Please use the serverless scraping endpoints instead');
    return false;
  }

  // Run all fictions collection (deprecated - moved to serverless)
  async runAllFictionsCollection(): Promise<boolean> {
    console.log('⚠️ runAllFictionsCollection is deprecated - scraping moved to serverless functions');
    console.log('Please use the serverless scraping endpoints instead');
    return false;
  }
}