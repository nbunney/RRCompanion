import { client } from '../config/database.ts';
import type { UserFiction, CreateUserFictionRequest, UpdateUserFictionRequest, UserFictionStatus } from '../types/index.ts';

export class UserFictionService {
  // Create a new userFiction relationship
  static async createUserFiction(userId: number, fictionData: CreateUserFictionRequest): Promise<UserFiction> {
    const result = await client.execute(`
      INSERT INTO userFiction (
        user_id, fiction_id, status, rating, review,
        current_chapter, total_chapters, is_favorite
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      userId,
      fictionData.fiction_id,
      fictionData.status || 'plan_to_read',
      fictionData.rating || null,
      fictionData.review || null,
      fictionData.current_chapter || 0,
      fictionData.total_chapters || 0,
      fictionData.is_favorite || false,
    ]);

    const userFiction = await client.query(
      'SELECT * FROM userFiction WHERE id = ?',
      [result.lastInsertId]
    );

    return this.mapDatabaseRowToUserFiction(userFiction[0]);
  }

  // Get userFiction by ID
  static async getUserFictionById(id: number): Promise<UserFiction | null> {
    const result = await client.query(`
      SELECT uf.*, f.*, u.email, u.name as user_name
      FROM userFiction uf
      LEFT JOIN fiction f ON uf.fiction_id = f.id
      LEFT JOIN users u ON uf.user_id = u.id
      WHERE uf.id = ?
    `, [id]);

    if (result.length === 0) {
      return null;
    }

    return this.mapDatabaseRowToUserFictionWithJoins(result[0]);
  }

  // Get userFiction by user and fiction IDs
  static async getUserFictionByUserAndFiction(userId: number, fictionId: number): Promise<UserFiction | null> {
    const result = await client.query(
      'SELECT * FROM userFiction WHERE user_id = ? AND fiction_id = ?',
      [userId, fictionId]
    );

    if (result.length === 0) {
      return null;
    }

    return this.mapDatabaseRowToUserFiction(result[0]);
  }

  // Get all userFictions for a user
  static async getUserFictionsByUser(userId: number, page: number = 1, limit: number = 20): Promise<{ userFictions: UserFiction[]; total: number; totalPages: number }> {
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await client.query(
      'SELECT COUNT(*) as total FROM userFiction WHERE user_id = ?',
      [userId]
    );
    const total = countResult[0].total;

    // Get userFictions for current page with joined data
    const result = await client.query(`
      SELECT uf.*, f.*, u.email, u.name as user_name
      FROM userFiction uf
      LEFT JOIN fiction f ON uf.fiction_id = f.id
      LEFT JOIN users u ON uf.user_id = u.id
      WHERE uf.user_id = ?
      ORDER BY uf.updated_at DESC
      LIMIT ? OFFSET ?
    `, [userId, limit, offset]);

    const userFictions = result.map((row: any) => this.mapDatabaseRowToUserFictionWithJoins(row));
    const totalPages = Math.ceil(total / limit);

    return { userFictions, total, totalPages };
  }

  // Get all userFictions for a user without pagination
  static async getAllUserFictionsByUser(userId: number): Promise<UserFiction[]> {
    const result = await client.query(`
      SELECT uf.*, f.*, u.email, u.name as user_name
      FROM userFiction uf
      LEFT JOIN fiction f ON uf.fiction_id = f.id
      LEFT JOIN users u ON uf.user_id = u.id
      WHERE uf.user_id = ?
      ORDER BY uf.is_favorite DESC, uf.created_at DESC
    `, [userId]);

    return result.map((row: any) => this.mapDatabaseRowToUserFictionWithJoins(row));
  }

  // Get userFictions by status
  static async getUserFictionsByStatus(userId: number, status: UserFictionStatus, page: number = 1, limit: number = 20): Promise<{ userFictions: UserFiction[]; total: number; totalPages: number }> {
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await client.query(
      'SELECT COUNT(*) as total FROM userFiction WHERE user_id = ? AND status = ?',
      [userId, status]
    );
    const total = countResult[0].total;

    // Get userFictions for current page with joined data
    const result = await client.query(`
      SELECT uf.*, f.*, u.email, u.name as user_name
      FROM userFiction uf
      LEFT JOIN fiction f ON uf.fiction_id = f.id
      LEFT JOIN users u ON uf.user_id = u.id
      WHERE uf.user_id = ? AND uf.status = ?
      ORDER BY uf.updated_at DESC
      LIMIT ? OFFSET ?
    `, [userId, status, limit, offset]);

    const userFictions = result.map((row: any) => this.mapDatabaseRowToUserFictionWithJoins(row));
    const totalPages = Math.ceil(total / limit);

    return { userFictions, total, totalPages };
  }

  // Get user's favorite fictions
  static async getUserFavorites(userId: number, page: number = 1, limit: number = 20): Promise<{ userFictions: UserFiction[]; total: number; totalPages: number }> {
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await client.query(
      'SELECT COUNT(*) as total FROM userFiction WHERE user_id = ? AND is_favorite = TRUE',
      [userId]
    );
    const total = countResult[0].total;

    // Get userFictions with custom order if available, fallback to default order
    const result = await client.query(`
      SELECT uf.*, f.*, u.email, u.name as user_name, ufo.position as custom_position
      FROM userFiction uf
      LEFT JOIN fiction f ON uf.fiction_id = f.id
      LEFT JOIN users u ON uf.user_id = u.id
      LEFT JOIN userFictionOrder ufo ON uf.user_id = ufo.user_id AND uf.fiction_id = ufo.fiction_id
      WHERE uf.user_id = ? AND uf.is_favorite = TRUE
      ORDER BY 
        CASE 
          WHEN ufo.position IS NOT NULL THEN ufo.position 
          ELSE 999999 
        END,
        uf.updated_at DESC
      LIMIT ? OFFSET ?
    `, [userId, limit, offset]);

    const userFictions = result.map((row: any) => this.mapDatabaseRowToUserFictionWithJoins(row));
    const totalPages = Math.ceil(total / limit);

    return { userFictions, total, totalPages };
  }

  // Update userFiction
  static async updateUserFiction(userId: number, fictionId: number, userFictionData: UpdateUserFictionRequest): Promise<UserFiction | null> {
    const updates: string[] = [];
    const params: any[] = [];

    // Build dynamic update query
    if (userFictionData.status !== undefined) {
      updates.push('status = ?');
      params.push(userFictionData.status);
    }
    if (userFictionData.rating !== undefined) {
      updates.push('rating = ?');
      params.push(userFictionData.rating);
    }
    if (userFictionData.review !== undefined) {
      updates.push('review = ?');
      params.push(userFictionData.review);
    }
    if (userFictionData.current_chapter !== undefined) {
      updates.push('current_chapter = ?');
      params.push(userFictionData.current_chapter);
    }
    if (userFictionData.total_chapters !== undefined) {
      updates.push('total_chapters = ?');
      params.push(userFictionData.total_chapters);
    }
    if (userFictionData.is_favorite !== undefined) {
      updates.push('is_favorite = ?');
      params.push(userFictionData.is_favorite);
    }

    if (updates.length === 0) {
      return this.getUserFictionByUserAndFiction(userId, fictionId);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    if (userFictionData.status === 'reading' || userFictionData.current_chapter !== undefined) {
      updates.push('last_read_at = CURRENT_TIMESTAMP');
    }
    params.push(userId, fictionId);

    await client.execute(
      `UPDATE userFiction SET ${updates.join(', ')} WHERE user_id = ? AND fiction_id = ?`,
      params
    );

    return this.getUserFictionByUserAndFiction(userId, fictionId);
  }

  // Delete userFiction
  static async deleteUserFiction(userId: number, fictionId: number): Promise<boolean> {
    const result = await client.execute(
      'DELETE FROM userFiction WHERE user_id = ? AND fiction_id = ?',
      [userId, fictionId]
    );

    return (result.affectedRows || 0) > 0;
  }

  // Toggle favorite status
  static async toggleFavorite(userId: number, fictionId: number): Promise<UserFiction | null> {
    const userFiction = await this.getUserFictionByUserAndFiction(userId, fictionId);
    if (!userFiction) {
      return null;
    }

    const newFavoriteStatus = !userFiction.is_favorite;
    return await this.updateUserFiction(userId, fictionId, { is_favorite: newFavoriteStatus });
  }

  // Update reading progress
  static async updateReadingProgress(userId: number, fictionId: number, currentChapter: number, totalChapters?: number): Promise<UserFiction | null> {
    const updateData: UpdateUserFictionRequest = {
      current_chapter: currentChapter,
      status: 'reading',
    };

    if (totalChapters !== undefined) {
      updateData.total_chapters = totalChapters;
    }

    return await this.updateUserFiction(userId, fictionId, updateData);
  }

  // Get reading statistics for a user
  static async getUserReadingStats(userId: number): Promise<{
    totalFictions: number;
    reading: number;
    completed: number;
    onHold: number;
    dropped: number;
    planToRead: number;
    favorites: number;
  }> {
    const result = await client.query(`
      SELECT 
        COUNT(*) as totalFictions,
        SUM(CASE WHEN status = 'reading' THEN 1 ELSE 0 END) as reading,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'on_hold' THEN 1 ELSE 0 END) as onHold,
        SUM(CASE WHEN status = 'dropped' THEN 1 ELSE 0 END) as dropped,
        SUM(CASE WHEN status = 'plan_to_read' THEN 1 ELSE 0 END) as planToRead,
        SUM(CASE WHEN is_favorite = TRUE THEN 1 ELSE 0 END) as favorites
      FROM userFiction 
      WHERE user_id = ?
    `, [userId]);

    const stats = result[0];
    return {
      totalFictions: stats.totalFictions || 0,
      reading: stats.reading || 0,
      completed: stats.completed || 0,
      onHold: stats.onHold || 0,
      dropped: stats.dropped || 0,
      planToRead: stats.planToRead || 0,
      favorites: stats.favorites || 0,
    };
  }

  // Reorder user's favorite fictions
  static async reorderFavorites(userId: number, fictionIds: number[]): Promise<void> {
    // Start a transaction to ensure data consistency
    await client.execute('START TRANSACTION');

    try {
      // Clear existing order for this user
      await client.execute(
        'DELETE FROM userFictionOrder WHERE user_id = ?',
        [userId]
      );

      // Insert new order
      for (let i = 0; i < fictionIds.length; i++) {
        await client.execute(
          'INSERT INTO userFictionOrder (user_id, fiction_id, position) VALUES (?, ?, ?)',
          [userId, fictionIds[i], i + 1]
        );
      }

      // Commit the transaction
      await client.execute('COMMIT');
    } catch (error) {
      // Rollback on error
      await client.execute('ROLLBACK');
      throw error;
    }
  }

  // Helper method to map database row to UserFiction object
  private static mapDatabaseRowToUserFiction(row: any): UserFiction {
    return {
      id: row.id,
      user_id: row.user_id,
      fiction_id: row.fiction_id,
      status: row.status,
      rating: row.rating,
      review: row.review,
      current_chapter: row.current_chapter,
      total_chapters: row.total_chapters,
      last_read_at: row.last_read_at,
      is_favorite: row.is_favorite,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  // Helper method to map database row to UserFiction object with joined data
  private static mapDatabaseRowToUserFictionWithJoins(row: any): UserFiction {
    const userFiction = this.mapDatabaseRowToUserFiction(row);

    // Add fiction data if available
    if (row.royalroad_id) {
      userFiction.fiction = {
        id: row.fiction_id,
        royalroad_id: row.royalroad_id,
        title: row.title,
        author_name: row.author_name,
        author_id: row.author_id,
        author_avatar: row.author_avatar,
        description: row.description,
        image_url: row.image_url,
        status: row.fiction_status,
        type: row.type,
        tags: row.tags ? JSON.parse(row.tags) : [],
        warnings: row.warnings ? JSON.parse(row.warnings) : [],
        pages: row.pages,
        ratings: row.ratings,
        followers: row.followers,
        favorites: row.favorites,
        views: row.views,
        score: row.score,
        sponsored: row.sponsored,
        created_at: row.fiction_created_at,
        updated_at: row.fiction_updated_at,
      };
    }

    // Add user data if available
    if (row.email) {
      userFiction.user = {
        id: row.user_id,
        email: row.email,
        name: row.user_name,
        created_at: row.user_created_at,
        updated_at: row.user_updated_at,
      };
    }

    return userFiction;
  }
} 