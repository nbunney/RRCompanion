import mysql from 'mysql2/promise';
import { getDatabaseConfig } from '../utils/config';
import { RisingStarEntry, FictionHistoryEntry, CampaignData, RetentionData } from '../types';

export class DatabaseService {
  private connection: mysql.Connection | null = null;
  private config = getDatabaseConfig();

  async connect(): Promise<void> {
    if (this.connection) {
      return;
    }

    try {
      this.connection = await mysql.createConnection({
        host: this.config.host,
        port: this.config.port,
        user: this.config.user,
        password: this.config.password,
        database: this.config.database,
        ssl: this.config.ssl,
        acquireTimeout: 60000,
        timeout: 60000,
        reconnect: true
      });

      console.log('✅ Database connected successfully');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.end();
      this.connection = null;
      console.log('✅ Database disconnected');
    }
  }

  async query(sql: string, params: any[] = []): Promise<any[]> {
    if (!this.connection) {
      await this.connect();
    }

    try {
      const [rows] = await this.connection!.execute(sql, params);
      return rows as any[];
    } catch (error) {
      console.error('❌ Database query failed:', error);
      throw error;
    }
  }

  async execute(sql: string, params: any[] = []): Promise<any> {
    if (!this.connection) {
      await this.connect();
    }

    try {
      const [result] = await this.connection!.execute(sql, params);
      return result;
    } catch (error) {
      console.error('❌ Database execute failed:', error);
      throw error;
    }
  }

  // Rising Stars operations
  async saveRisingStarEntry(entry: RisingStarEntry): Promise<void> {
    const query = `
      INSERT INTO risingStars (fiction_id, genre, position, captured_at)
      VALUES (?, ?, ?, ?)
    `;

    await this.execute(query, [
      entry.fiction_id,
      entry.genre,
      entry.position,
      entry.captured_at || new Date().toISOString()
    ]);
  }

  async saveRisingStarEntries(entries: RisingStarEntry[]): Promise<void> {
    if (entries.length === 0) return;

    const query = `
      INSERT INTO risingStars (fiction_id, genre, position, captured_at)
      VALUES ${entries.map(() => '(?, ?, ?, ?)').join(', ')}
    `;

    const params = entries.flatMap(entry => [
      entry.fiction_id,
      entry.genre,
      entry.position,
      entry.captured_at || new Date().toISOString()
    ]);

    await this.execute(query, params);
  }

  async getFictionByRoyalRoadId(royalroadId: string): Promise<any | null> {
    const query = `
      SELECT id, title, author_name, royalroad_id, image_url
      FROM fiction
      WHERE royalroad_id = ?
    `;

    const results = await this.query(query, [royalroadId]);
    return results.length > 0 ? results[0] : null;
  }

  async createFiction(fictionData: any): Promise<number> {
    const query = `
      INSERT INTO fiction (
        royalroad_id, title, author_name, author_id, author_avatar,
        description, image_url, status, type, tags, warnings,
        pages, ratings, followers, favorites, views, score,
        overall_score, style_score, story_score, grammar_score, character_score,
        total_views, average_views, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const result = await this.execute(query, [
      fictionData.royalroad_id,
      fictionData.title,
      fictionData.author_name,
      fictionData.author_id,
      fictionData.author_avatar,
      fictionData.description,
      fictionData.image_url,
      fictionData.status,
      fictionData.type,
      JSON.stringify(fictionData.tags),
      JSON.stringify(fictionData.warnings),
      fictionData.pages,
      fictionData.ratings,
      fictionData.followers,
      fictionData.favorites,
      fictionData.views,
      fictionData.score,
      fictionData.overall_score,
      fictionData.style_score,
      fictionData.story_score,
      fictionData.grammar_score,
      fictionData.character_score,
      fictionData.total_views,
      fictionData.average_views
    ]);

    return result.insertId;
  }

  // Fiction History operations
  async saveFictionHistoryEntry(entry: FictionHistoryEntry): Promise<void> {
    const query = `
      INSERT INTO fictionHistory (fiction_id, pages, ratings, followers, favorites, views, score, captured_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.execute(query, [
      entry.fiction_id,
      entry.pages,
      entry.ratings,
      entry.followers,
      entry.favorites,
      entry.views,
      entry.score,
      entry.captured_at
    ]);
  }

  async saveFictionHistoryEntries(entries: FictionHistoryEntry[]): Promise<void> {
    if (entries.length === 0) return;

    const query = `
      INSERT INTO fictionHistory (fiction_id, pages, ratings, followers, favorites, views, score, captured_at)
      VALUES ${entries.map(() => '(?, ?, ?, ?, ?, ?, ?, ?)').join(', ')}
    `;

    const params = entries.flatMap(entry => [
      entry.fiction_id,
      entry.pages,
      entry.ratings,
      entry.followers,
      entry.favorites,
      entry.views,
      entry.score,
      entry.captured_at
    ]);

    await this.execute(query, params);
  }

  // Campaign operations
  async saveCampaignData(campaign: CampaignData): Promise<void> {
    const query = `
      INSERT INTO advertising_campaigns (
        campaign_id, title, status, budget, spent, impressions, clicks, ctr, cpc, user_id, captured_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.execute(query, [
      campaign.campaignId,
      campaign.title,
      campaign.status,
      campaign.budget,
      campaign.spent,
      campaign.impressions,
      campaign.clicks,
      campaign.ctr,
      campaign.cpc,
      campaign.userId,
      campaign.captured_at
    ]);
  }

  // Retention operations
  async saveRetentionData(retention: RetentionData): Promise<void> {
    const query = `
      INSERT INTO retention_analytics (
        fiction_id, user_id, day1, day3, day7, day14, day30, captured_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.execute(query, [
      retention.fictionId,
      retention.userId,
      retention.day1,
      retention.day3,
      retention.day7,
      retention.day14,
      retention.day30,
      retention.captured_at
    ]);
  }

  // Utility methods
  async getFictionsToUpdate(limit: number = 100): Promise<any[]> {
    const query = `
      SELECT f.id, f.royalroad_id, f.title, f.author_name
      FROM fiction f
      LEFT JOIN fictionHistory fh ON f.id = fh.fiction_id
      WHERE fh.fiction_id IS NULL OR fh.captured_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)
      ORDER BY f.updated_at ASC
      LIMIT ?
    `;

    return await this.query(query, [limit]);
  }

  async getLatestRisingStarsTimestamp(): Promise<string | null> {
    const query = `
      SELECT MAX(captured_at) as latest_scrape
      FROM risingStars
    `;

    const results = await this.query(query);
    return results[0]?.latest_scrape || null;
  }
}
