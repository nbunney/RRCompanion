import { client } from '../config/database.ts';

export interface RisingStarEntry {
  id?: number;
  fiction_id: number;
  genre: string;
  position: number;
  captured_at?: Date;
}

export class RisingStarsService {
  // Use the shared database client from the config
  private dbClient = client;

  // Save a rising star entry
  async saveRisingStarEntry(entry: RisingStarEntry): Promise<void> {
    try {
      const query = `
        INSERT INTO risingStars (fiction_id, genre, position, captured_at)
        VALUES (?, ?, ?, ?)
      `;

      await this.dbClient.execute(query, [
        entry.fiction_id,
        entry.genre,
        entry.position,
        entry.captured_at || new Date()
      ]);

      console.log(`✅ Saved rising star entry for fiction ${entry.fiction_id} (position ${entry.position} in ${entry.genre})`);
    } catch (error) {
      console.error('❌ Error saving rising star entry:', error);
      throw error;
    }
  }

  // Get rising stars data for a specific genre and date range
  async getRisingStarsData(genre?: string, startDate?: Date, endDate?: Date): Promise<RisingStarEntry[]> {
    try {
      let query = `
        SELECT rs.*, f.title, f.author_name
        FROM risingStars rs
        JOIN fiction f ON rs.fiction_id = f.id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (genre) {
        query += ` AND rs.genre = ?`;
        params.push(genre);
      }

      if (startDate) {
        query += ` AND rs.captured_at >= ?`;
        params.push(startDate);
      }

      if (endDate) {
        query += ` AND rs.captured_at <= ?`;
        params.push(endDate);
      }

      query += ` ORDER BY rs.captured_at DESC, rs.position ASC`;

      const result = await this.dbClient.query(query, params);
      return result as RisingStarEntry[];
    } catch (error) {
      console.error('❌ Error getting rising stars data:', error);
      throw error;
    }
  }

  // Get the latest rising stars data for all genres
  async getLatestRisingStarsData(): Promise<RisingStarEntry[]> {
    try {
      const query = `
        SELECT rs.*, f.title, f.author_name
        FROM risingStars rs
        JOIN fiction f ON rs.fiction_id = f.id
        WHERE rs.captured_at = (
          SELECT MAX(captured_at) 
          FROM risingStars 
          WHERE genre = rs.genre
        )
        ORDER BY rs.genre, rs.position
      `;

      const result = await this.dbClient.query(query);
      return result as RisingStarEntry[];
    } catch (error) {
      console.error('❌ Error getting latest rising stars data:', error);
      throw error;
    }
  }

  // Get rising stars data for a specific fiction
  async getRisingStarsDataForFiction(fictionId: number): Promise<RisingStarEntry[]> {
    try {
      const query = `
        SELECT rs.*
        FROM risingStars rs
        WHERE rs.fiction_id = ?
        ORDER BY rs.captured_at DESC
      `;

      const result = await this.dbClient.query(query, [fictionId]);
      return result.map((row: any) => ({
        id: row.id,
        fiction_id: row.fiction_id,
        genre: row.genre,
        position: row.position,
        captured_at: row.captured_at,
      }));
    } catch (error) {
      console.error('❌ Error getting rising stars data for fiction:', error);
      throw error;
    }
  }

  // Get fiction ID by Royal Road ID
  private async getFictionIdByRoyalRoadId(royalroadId: string): Promise<number | null> {
    try {
      const result = await this.dbClient.query(
        'SELECT id FROM fiction WHERE royalroad_id = ?',
        [royalroadId]
      );

      if (result && result.length > 0) {
        return result[0].id;
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting fiction ID by Royal Road ID:', error);
      throw error;
    }
  }

  // Get the top 5 Rising Stars from the main genre only
  async getTopRisingStars(limit: number = 5): Promise<any[]> {
    try {
      // Get the most recent timestamp
      const maxTimestampQuery = `SELECT MAX(captured_at) as max_timestamp FROM risingStars`;
      const maxResult = await this.dbClient.query(maxTimestampQuery);
      const maxTimestamp = maxResult[0]?.max_timestamp;

      if (!maxTimestamp) {
        console.log('❌ No Rising Stars data found in database');
        return [];
      }

      // Get top 5 positions from main genre at the most recent timestamp
      const query = `
        SELECT rs.*, f.title, f.author_name, f.royalroad_id
        FROM risingStars rs
        JOIN fiction f ON rs.fiction_id = f.id
        WHERE rs.genre = 'main' 
        AND rs.position <= 5 
        AND rs.captured_at = ?
        ORDER BY rs.position ASC
        LIMIT ?
      `;

      const result = await this.dbClient.query(query, [maxTimestamp, limit]);
      console.log('🔍 Debug - Top Rising Stars query result:', result);
      return result as any[];
    } catch (error) {
      console.error('❌ Error getting top rising stars:', error);
      throw error;
    }
  }

  // Save multiple rising star entries
  async saveRisingStarsData(entries: RisingStarEntry[]): Promise<void> {
    console.log(`\n💾 Saving ${entries.length} rising star entries to database...`);

    for (const entry of entries) {
      await this.saveRisingStarEntry(entry);
      // Add a small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`✅ Successfully saved ${entries.length} rising star entries`);
  }
} 