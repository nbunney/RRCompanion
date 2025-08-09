import { Client } from 'mysql';

export interface RisingStarEntry {
  id?: number;
  fiction_id: number;
  genre: string;
  position: number;
  captured_at?: Date;
}

export class RisingStarsService {
  private dbClient: Client;

  constructor() {
    this.dbClient = new Client();
  }

  // Get a fresh database connection
  private async getConnection(): Promise<Client> {
    try {
      // If client is not connected, connect it
      if (!this.dbClient.pool) {
        const dbConfig = {
          hostname: Deno.env.get('DB_HOST') || 'localhost',
          port: parseInt(Deno.env.get('DB_PORT') || '3306'),
          username: Deno.env.get('DB_USER') || 'root',
          password: Deno.env.get('DB_PASSWORD') || '',
          db: Deno.env.get('DB_NAME') || 'RRCompanion',
          charset: 'utf8mb4',
        };
        await this.dbClient.connect(dbConfig);
      }
      return this.dbClient;
    } catch (error) {
      console.error('Error getting database connection:', error);
      throw error;
    }
  }

  // Close database connection
  private async closeConnection(): Promise<void> {
    try {
      if (this.dbClient.pool) {
        await this.dbClient.close();
      }
    } catch (error) {
      console.error('Error closing database connection:', error);
    }
  }

  // Save a rising star entry
  async saveRisingStarEntry(entry: RisingStarEntry): Promise<void> {
    const client = await this.getConnection();
    try {
      const query = `
        INSERT INTO risingStars (fiction_id, genre, position, captured_at)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          position = VALUES(position),
          captured_at = VALUES(captured_at)
      `;

      await client.execute(query, [
        entry.fiction_id,
        entry.genre,
        entry.position,
        entry.captured_at || new Date()
      ]);

      console.log(`✅ Saved rising star entry for fiction ${entry.fiction_id} (position ${entry.position} in ${entry.genre})`);
    } catch (error) {
      console.error('❌ Error saving rising star entry:', error);
      throw error;
    } finally {
      await this.closeConnection();
    }
  }

  // Get rising stars data for a specific genre and date range
  async getRisingStarsData(genre?: string, startDate?: Date, endDate?: Date): Promise<RisingStarEntry[]> {
    const client = await this.getConnection();
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

      const result = await client.query(query, params);
      return result as RisingStarEntry[];
    } catch (error) {
      console.error('❌ Error getting rising stars data:', error);
      throw error;
    } finally {
      await this.closeConnection();
    }
  }

  // Get the latest rising stars data for all genres
  async getLatestRisingStarsData(): Promise<RisingStarEntry[]> {
    const client = await this.getConnection();
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

      const result = await client.query(query);
      return result as RisingStarEntry[];
    } catch (error) {
      console.error('❌ Error getting latest rising stars data:', error);
      throw error;
    } finally {
      await this.closeConnection();
    }
  }

  // Get rising stars data for a specific fiction
  async getRisingStarsDataForFiction(fictionId: number): Promise<RisingStarEntry[]> {
    const client = await this.getConnection();
    try {
      const query = `
        SELECT rs.*
        FROM risingStars rs
        WHERE rs.fiction_id = ?
        ORDER BY rs.captured_at DESC
      `;

      const result = await client.query(query, [fictionId]);
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
    } finally {
      await this.closeConnection();
    }
  }

  // Get fiction ID by Royal Road ID
  private async getFictionIdByRoyalRoadId(royalroadId: string): Promise<number | null> {
    const client = await this.getConnection();
    try {
      const result = await client.query(
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
    } finally {
      await this.closeConnection();
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