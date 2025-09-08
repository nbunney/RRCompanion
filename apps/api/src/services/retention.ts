import { client } from '../config/database.ts';

export interface RetentionChapter {
  id: number;
  chapter: string;
  views: number;
  userRetentionPercent: number;
  numberOfMembers: number;
  percentOfMembers: number;
  percentMembersRemaining: number;
  rawData: Record<string, any>;
}

export interface RetentionSummary {
  totalViews: number;
  totalMembers: number;
  averageRetention: number;
}

export interface RetentionData {
  fictionId: number | null;
  chapters: RetentionChapter[];
  summary: RetentionSummary;
}

export interface RetentionRecord {
  id: number;
  user_id: number | null;
  username: string | null;
  fiction_id: number | null;
  chapters: RetentionChapter[];
  summary: RetentionSummary;
  raw_data: Record<string, any>;
  scraped_at: string;
  url: string;
  created_at: string;
  updated_at: string;
}

export class RetentionService {
  async storeRetention(data: RetentionData, userId: number | null, username: string | null, url: string): Promise<number> {
    try {
      const result = await client.execute(
        `INSERT INTO retention_analytics (
          user_id, username, fiction_id, chapters, summary, raw_data, scraped_at, url, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          userId,
          username,
          data.fictionId,
          JSON.stringify(data.chapters),
          JSON.stringify(data.summary),
          JSON.stringify(data),
          new Date().toISOString(),
          url
        ]
      );

      return result.lastInsertId || 0;
    } catch (error) {
      console.error('Error storing retention data:', error);
      throw new Error(`Failed to store retention data: ${(error as Error).message}`);
    }
  }

  async getRetentionByUser(userId: number, limit: number = 50, offset: number = 0): Promise<RetentionRecord[]> {
    try {
      const result = await client.query(
        `SELECT * FROM retention_analytics 
         WHERE user_id = ? 
         ORDER BY created_at DESC 
         LIMIT ? OFFSET ?`,
        [userId, limit, offset]
      );

      return result.map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        username: row.username,
        fiction_id: row.fiction_id,
        chapters: JSON.parse(row.chapters || '[]'),
        summary: JSON.parse(row.summary || '{}'),
        raw_data: JSON.parse(row.raw_data || '{}'),
        scraped_at: row.scraped_at,
        url: row.url,
        created_at: row.created_at,
        updated_at: row.updated_at
      }));
    } catch (error) {
      console.error('Error getting retention data by user:', error);
      throw new Error(`Failed to get retention data: ${(error as Error).message}`);
    }
  }

  async getRetentionByFiction(fictionId: number, limit: number = 50, offset: number = 0): Promise<RetentionRecord[]> {
    try {
      const result = await client.query(
        `SELECT * FROM retention_analytics 
         WHERE fiction_id = ? 
         ORDER BY created_at DESC 
         LIMIT ? OFFSET ?`,
        [fictionId, limit, offset]
      );

      return result.map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        username: row.username,
        fiction_id: row.fiction_id,
        chapters: JSON.parse(row.chapters || '[]'),
        summary: JSON.parse(row.summary || '{}'),
        raw_data: JSON.parse(row.raw_data || '{}'),
        scraped_at: row.scraped_at,
        url: row.url,
        created_at: row.created_at,
        updated_at: row.updated_at
      }));
    } catch (error) {
      console.error('Error getting retention data by fiction:', error);
      throw new Error(`Failed to get retention data: ${(error as Error).message}`);
    }
  }

  async getAllRetention(limit: number = 50, offset: number = 0): Promise<RetentionRecord[]> {
    try {
      const result = await client.query(
        `SELECT * FROM retention_analytics 
         ORDER BY created_at DESC 
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );

      return result.map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        username: row.username,
        fiction_id: row.fiction_id,
        chapters: JSON.parse(row.chapters || '[]'),
        summary: JSON.parse(row.summary || '{}'),
        raw_data: JSON.parse(row.raw_data || '{}'),
        scraped_at: row.scraped_at,
        url: row.url,
        created_at: row.created_at,
        updated_at: row.updated_at
      }));
    } catch (error) {
      console.error('Error getting all retention data:', error);
      throw new Error(`Failed to get retention data: ${(error as Error).message}`);
    }
  }

  async getRetentionStats(): Promise<{
    totalRecords: number;
    totalFictions: number;
    totalUsers: number;
    averageChaptersPerRecord: number;
    averageRetentionRate: number;
  }> {
    try {
      const result = await client.query(
        `SELECT 
          COUNT(*) as total_records,
          COUNT(DISTINCT fiction_id) as total_fictions,
          COUNT(DISTINCT user_id) as total_users,
          AVG(JSON_LENGTH(chapters)) as avg_chapters,
          AVG(JSON_EXTRACT(summary, '$.averageRetention')) as avg_retention
        FROM retention_analytics`
      );

      const row = result[0] as any;
      return {
        totalRecords: row.total_records || 0,
        totalFictions: row.total_fictions || 0,
        totalUsers: row.total_users || 0,
        averageChaptersPerRecord: parseFloat(row.avg_chapters) || 0,
        averageRetentionRate: parseFloat(row.avg_retention) || 0
      };
    } catch (error) {
      console.error('Error getting retention stats:', error);
      throw new Error(`Failed to get retention stats: ${(error as Error).message}`);
    }
  }

  async deleteOldRetention(daysOld: number): Promise<number> {
    try {
      const result = await client.execute(
        `DELETE FROM retention_analytics 
         WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
        [daysOld]
      );

      return result.affectedRows || 0;
    } catch (error) {
      console.error('Error deleting old retention data:', error);
      throw new Error(`Failed to delete old retention data: ${(error as Error).message}`);
    }
  }
}
