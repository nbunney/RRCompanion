import { client } from '../config/database.ts';
import { cacheService } from './cache.ts';
import { decodeHtmlEntities } from '../utils/htmlEntities.ts';
import type { Fiction, CreateFictionRequest, UpdateFictionRequest } from '../types/index.ts';

export class FictionService {
  // Utility function to clean strings for database insertion
  private static cleanStringForDB(str: string | null | undefined): string | null {
    if (!str || typeof str !== 'string') return null;

    // Basic cleaning - remove null bytes and trim
    return str
      .replace(/\0/g, '') // Remove null bytes
      .trim();
  }

  // Create a new fiction
  static async createFiction(fictionData: CreateFictionRequest): Promise<Fiction> {
    // Clean and prepare the data - ensure no null values are passed to MySQL
    const cleanData = {
      royalroad_id: fictionData.royalroad_id,
      title: this.cleanStringForDB(fictionData.title) || '',
      author_name: this.cleanStringForDB(fictionData.author_name) || '',
      author_id: fictionData.author_id || null,
      author_avatar: this.cleanStringForDB(fictionData.author_avatar) || null,
      description: fictionData.description ? this.cleanStringForDB(fictionData.description) : null,
      image_url: this.cleanStringForDB(fictionData.image_url) || null,
      status: this.cleanStringForDB(fictionData.status) || null,
      type: this.cleanStringForDB(fictionData.type) || null,
      tags: fictionData.tags ? this.cleanStringForDB(JSON.stringify(fictionData.tags)) : null,
      warnings: fictionData.warnings ? this.cleanStringForDB(JSON.stringify(fictionData.warnings)) : null,
      pages: fictionData.pages || 0,
      ratings: fictionData.ratings || 0,
      followers: fictionData.followers || 0,
      favorites: fictionData.favorites || 0,
      views: typeof fictionData.views === 'number' ? fictionData.views : 0,
      score: typeof fictionData.score === 'number' ? fictionData.score : 0,
      overall_score: typeof fictionData.overall_score === 'number' ? fictionData.overall_score : 0,
      style_score: typeof fictionData.style_score === 'number' ? fictionData.style_score : 0,
      story_score: typeof fictionData.story_score === 'number' ? fictionData.story_score : 0,
      grammar_score: typeof fictionData.grammar_score === 'number' ? fictionData.grammar_score : 0,
      character_score: typeof fictionData.character_score === 'number' ? fictionData.character_score : 0,
      total_views: typeof fictionData.total_views === 'number' ? fictionData.total_views : 0,
      average_views: typeof fictionData.average_views === 'number' ? fictionData.average_views : 0,
    };

    // Convert null values to empty strings to prevent replaceAll errors
    const params = [
      cleanData.royalroad_id,
      cleanData.title,
      cleanData.author_name,
      cleanData.author_id,
      cleanData.author_avatar || '', // Convert null to empty string
      cleanData.description || '', // Convert null to empty string
      cleanData.image_url || '', // Convert null to empty string
      cleanData.status || '', // Convert null to empty string
      cleanData.type || '', // Convert null to empty string
      cleanData.tags || '', // Convert null to empty string
      cleanData.warnings || '', // Convert null to empty string
      cleanData.pages,
      cleanData.ratings,
      cleanData.followers,
      cleanData.favorites,
      cleanData.views,
      cleanData.score,
      cleanData.overall_score,
      cleanData.style_score,
      cleanData.story_score,
      cleanData.grammar_score,
      cleanData.character_score,
      cleanData.total_views,
      cleanData.average_views,
    ];

    // Debug: Log the parameters to see what's being passed
    console.log('📚 MySQL parameters:', params.map((p, i) => `${i}: ${typeof p} = ${p}`));

    const result = await client.execute(`
      INSERT INTO fiction (
        royalroad_id, title, author_name, author_id, author_avatar,
        description, image_url, status, type, tags, warnings,
        pages, ratings, followers, favorites, views, score, overall_score, style_score,
        story_score, grammar_score, character_score, total_views, average_views
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, params);

    const fiction = await client.query(
      'SELECT * FROM fiction WHERE id = ?',
      [result.lastInsertId]
    );

    return this.mapDatabaseRowToFiction(fiction[0]);
  }

  // Check if fiction exists by RoyalRoad ID (minimal query)
  static async checkFictionExists(royalroadId: string): Promise<boolean> {
    const result = await client.query(
      'SELECT 1 FROM fiction WHERE royalroad_id = ? LIMIT 1',
      [royalroadId]
    );

    return result.length > 0;
  }

  // Get fiction by Royal Road ID
  static async getFictionByRoyalRoadId(royalroadId: string): Promise<Fiction | null> {
    const result = await client.query(
      'SELECT * FROM fiction WHERE royalroad_id = ?',
      [royalroadId]
    );

    if (result.length === 0) {
      return null;
    }

    const fiction = this.mapDatabaseRowToFiction(result[0]);

    // Get the most recent title and image_url from fictionHistory if available
    const historyResult = await client.query(
      'SELECT title, image_url FROM fictionHistory WHERE fiction_id = ? ORDER BY captured_at DESC LIMIT 1',
      [fiction.id]
    );

    // Prefer title and image_url from fictionHistory if they exist
    if (historyResult.length > 0) {
      if (historyResult[0].title) {
        fiction.title = historyResult[0].title;
      }
      if (historyResult[0].image_url) {
        fiction.image_url = historyResult[0].image_url;
      }
    }

    return fiction;
  }

  // Get fiction by database ID
  static async getFictionById(id: number): Promise<Fiction | null> {
    const result = await client.query(
      'SELECT * FROM fiction WHERE id = ?',
      [id]
    );

    if (result.length === 0) {
      return null;
    }

    const fiction = this.mapDatabaseRowToFiction(result[0]);

    // Get the most recent title and image_url from fictionHistory if available
    const historyResult = await client.query(
      'SELECT title, image_url FROM fictionHistory WHERE fiction_id = ? ORDER BY captured_at DESC LIMIT 1',
      [fiction.id]
    );

    // Prefer title and image_url from fictionHistory if they exist
    if (historyResult.length > 0) {
      if (historyResult[0].title) {
        fiction.title = historyResult[0].title;
      }
      if (historyResult[0].image_url) {
        fiction.image_url = historyResult[0].image_url;
      }
    }

    return fiction;
  }

  // Update fiction
  static async updateFiction(royalroadId: string, fictionData: UpdateFictionRequest): Promise<Fiction | null> {
    const updates: string[] = [];
    const params: any[] = [];

    // Build dynamic update query with cleaned data
    if (fictionData.title !== undefined) {
      updates.push('title = ?');
      params.push(this.cleanStringForDB(fictionData.title) || '');
    }
    if (fictionData.author_name !== undefined) {
      updates.push('author_name = ?');
      params.push(this.cleanStringForDB(fictionData.author_name) || '');
    }
    if (fictionData.author_id !== undefined) {
      updates.push('author_id = ?');
      params.push(fictionData.author_id || '');
    }
    if (fictionData.author_avatar !== undefined) {
      updates.push('author_avatar = ?');
      params.push(this.cleanStringForDB(fictionData.author_avatar) || '');
    }
    if (fictionData.description !== undefined) {
      updates.push('description = ?');
      params.push(this.cleanStringForDB(fictionData.description) || '');
    }
    if (fictionData.image_url !== undefined) {
      updates.push('image_url = ?');
      params.push(this.cleanStringForDB(fictionData.image_url) || '');
    }
    if (fictionData.status !== undefined) {
      updates.push('status = ?');
      params.push(this.cleanStringForDB(fictionData.status) || '');
    }
    if (fictionData.type !== undefined) {
      updates.push('type = ?');
      params.push(this.cleanStringForDB(fictionData.type) || '');
    }
    if (fictionData.tags !== undefined) {
      updates.push('tags = ?');
      const tagsString = Array.isArray(fictionData.tags) ? JSON.stringify(fictionData.tags) : '';
      params.push(this.cleanStringForDB(tagsString) || '');
    }
    if (fictionData.warnings !== undefined) {
      updates.push('warnings = ?');
      const warningsString = Array.isArray(fictionData.warnings) ? JSON.stringify(fictionData.warnings) : '';
      params.push(this.cleanStringForDB(warningsString) || '');
    }
    if (fictionData.pages !== undefined) {
      updates.push('pages = ?');
      params.push(typeof fictionData.pages === 'number' ? fictionData.pages : 0);
    }
    if (fictionData.ratings !== undefined) {
      updates.push('ratings = ?');
      params.push(typeof fictionData.ratings === 'number' ? fictionData.ratings : 0);
    }
    if (fictionData.followers !== undefined) {
      updates.push('followers = ?');
      params.push(typeof fictionData.followers === 'number' ? fictionData.followers : 0);
    }
    if (fictionData.favorites !== undefined) {
      updates.push('favorites = ?');
      params.push(typeof fictionData.favorites === 'number' ? fictionData.favorites : 0);
    }
    if (fictionData.views !== undefined) {
      updates.push('views = ?');
      params.push(typeof fictionData.views === 'number' ? fictionData.views : 0);
    }
    if (fictionData.score !== undefined) {
      updates.push('score = ?');
      params.push(typeof fictionData.score === 'number' ? fictionData.score : 0);
    }

    if (updates.length === 0) {
      return this.getFictionByRoyalRoadId(royalroadId);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(royalroadId);

    await client.execute(
      `UPDATE fiction SET ${updates.join(', ')} WHERE royalroad_id = ?`,
      params
    );

    return this.getFictionByRoyalRoadId(royalroadId);
  }

  // Get all fictions with pagination
  static async getFictions(page: number = 1, limit: number = 20): Promise<{ fictions: Fiction[]; total: number; totalPages: number }> {
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await client.query('SELECT COUNT(*) as total FROM fiction');
    const total = countResult[0].total;

    // Get fictions for current page
    const result = await client.query(
      'SELECT * FROM fiction ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );

    const fictions = result.map((row: any) => this.mapDatabaseRowToFiction(row));
    const totalPages = Math.ceil(total / limit);

    return { fictions, total, totalPages };
  }

  // Get all fictions without pagination (for scraping)
  static async getAllFictions(): Promise<Fiction[]> {
    const result = await client.query(
      'SELECT * FROM fiction ORDER BY created_at DESC'
    );

    return result.map((row: any) => this.mapDatabaseRowToFiction(row));
  }

  // Search fictions
  static async searchFictions(query: string, page: number = 1, limit: number = 20): Promise<{ fictions: Fiction[]; total: number; totalPages: number }> {
    const offset = (page - 1) * limit;
    const searchQuery = `%${query}%`;

    // Get total count
    const countResult = await client.query(
      'SELECT COUNT(*) as total FROM fiction WHERE title LIKE ? OR author_name LIKE ? OR description LIKE ?',
      [searchQuery, searchQuery, searchQuery]
    );
    const total = countResult[0].total;

    // Get fictions for current page
    const result = await client.query(
      'SELECT * FROM fiction WHERE title LIKE ? OR author_name LIKE ? OR description LIKE ? ORDER BY score DESC, followers DESC LIMIT ? OFFSET ?',
      [searchQuery, searchQuery, searchQuery, limit, offset]
    );

    const fictions = result.map((row: any) => this.mapDatabaseRowToFiction(row));
    const totalPages = Math.ceil(total / limit);

    return { fictions, total, totalPages };
  }

  // Delete fiction
  static async deleteFiction(royalroadId: string): Promise<boolean> {
    const result = await client.execute(
      'DELETE FROM fiction WHERE royalroad_id = ?',
      [royalroadId]
    );

    return (result.affectedRows || 0) > 0;
  }

  // Get fictions by author
  static async getFictionsByAuthor(authorId: string): Promise<Fiction[]> {
    const result = await client.query(
      'SELECT * FROM fiction WHERE author_id = ? ORDER BY score DESC, followers DESC',
      [authorId]
    );

    return result.map((row: any) => this.mapDatabaseRowToFiction(row));
  }

  // Get top fictions by score
  static async getTopFictions(limit: number = 10): Promise<Fiction[]> {
    const result = await client.query(
      'SELECT * FROM fiction ORDER BY score DESC, followers DESC LIMIT ?',
      [limit]
    );

    return result.map((row: any) => this.mapDatabaseRowToFiction(row));
  }

  // Get popular fictions by followers
  static async getPopularFictions(limit: number = 10): Promise<Fiction[]> {
    const result = await client.query(
      'SELECT * FROM fiction ORDER BY followers DESC, score DESC LIMIT ?',
      [limit]
    );

    return result.map((row: any) => this.mapDatabaseRowToFiction(row));
  }

  // Get popular fictions by site users (how many users have added them to their lists)
  static async getPopularFictionsBySiteUsers(limit: number = 10): Promise<any[]> {
    const cacheKey = `popular_fictions_by_site_users_${limit}`;
    const cachedResult = cacheService.get<any[]>(cacheKey);

    if (cachedResult) {
      console.log('📦 Returning cached popular fictions data');
      return cachedResult;
    }

    const result = await client.query(`
      SELECT f.id, f.royalroad_id, f.title, f.author_name, f.author_id, f.author_avatar, 
             f.description, f.image_url, f.status, f.type, f.tags, f.warnings,
             f.pages, f.ratings, f.followers, f.favorites, f.views, f.score,
             f.created_at, f.updated_at,
             COUNT(uf.id) as user_count
      FROM fiction f
      LEFT JOIN userFiction uf ON f.id = uf.fiction_id
      GROUP BY f.id
      ORDER BY user_count DESC, f.score DESC
      LIMIT ?
    `, [limit]);

    // Cache the result for 10 minutes
    cacheService.set(cacheKey, result, 600000);

    return result; // Return raw result to preserve user_count
  }



  // Helper method to map database row to Fiction object
  private static mapDatabaseRowToFiction(row: any): Fiction {
    return {
      id: row.id,
      royalroad_id: row.royalroad_id,
      title: decodeHtmlEntities(row.title),
      author_name: decodeHtmlEntities(row.author_name),
      author_id: row.author_id,
      author_avatar: row.author_avatar,
      description: decodeHtmlEntities(row.description),
      image_url: row.image_url,
      status: row.status,
      type: row.type,
      tags: row.tags ? JSON.parse(row.tags) : [],
      warnings: row.warnings ? JSON.parse(row.warnings) : [],
      pages: row.pages,
      ratings: row.ratings,
      followers: row.followers,
      favorites: row.favorites,
      views: row.views,
      score: row.score,
      overall_score: row.overall_score,
      style_score: row.style_score,
      story_score: row.story_score,
      grammar_score: row.grammar_score,
      character_score: row.character_score,
      total_views: row.total_views,
      average_views: row.average_views,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
} 