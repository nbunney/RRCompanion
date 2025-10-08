import { client } from '../config/database.ts';
import { RisingStarsMainService } from './risingStarsMain.ts';

interface CompetitiveZoneEntry {
  fiction_id: number;
  calculated_position: number;
  last_move: 'up' | 'down' | 'same' | 'new';
  last_position?: number;
  last_move_date?: string;
}

export class CompetitiveZoneCacheService {
  private dbClient = client;

  /**
   * Build and update the competitive zone cache
   * Uses a reference fiction from a less popular genre (like Mystery #50)
   * to calculate positions for ~150+ fictions competing for RS Main
   */
  async rebuildCompetitiveZone(): Promise<void> {
    const startTime = Date.now();
    console.log('🏗️  Starting competitive zone cache rebuild...');

    try {
      // Step 1: Get Rising Stars Main list (positions 1-50)
      const risingStarsMainService = new RisingStarsMainService();
      const rsMainList = await risingStarsMainService.getRisingStarsMainList();
      console.log(`✅ Got ${rsMainList.length} fictions from RS Main`);

      // Step 2: Find a reference fiction from a less popular genre
      // We'll use Mystery #50 as it typically gives us a good competitive zone
      const referenceFiction = await this.findReferenceFiction('mystery', 50);

      if (!referenceFiction) {
        console.warn('⚠️  Could not find reference fiction for competitive zone');
        return;
      }

      console.log(`🎯 Using reference fiction: ${referenceFiction.title} (Mystery #${referenceFiction.position})`);

      // Step 3: Calculate all fictions ahead of the reference fiction
      const competitiveZone = await this.calculateCompetitiveZone(referenceFiction.fiction_id);
      console.log(`📊 Calculated competitive zone: ${competitiveZone.length} fictions`);

      // Step 4: Add RS Main fictions (positions 1-50) to competitive zone
      console.log(`📋 Adding RS Main fictions to competitive zone...`);
      const rsMainWithMovement = rsMainList.map(entry => ({
        fiction_id: entry.fictionId,
        calculated_position: entry.position,
        last_move: entry.lastMove as 'up' | 'down' | 'same' | 'new' | undefined,
        last_position: entry.lastPosition as number | undefined,
        last_move_date: entry.lastMoveDate as string | undefined
      }));

      // Add movement fields to calculated zone entries (as undefined)
      const competitiveZoneWithFields = competitiveZone.map(entry => ({
        ...entry,
        last_move: undefined as 'up' | 'down' | 'same' | 'new' | undefined,
        last_position: undefined as number | undefined,
        last_move_date: undefined as string | undefined
      }));

      // Combine RS Main with calculated competitive zone
      const fullCompetitiveZone = [...rsMainWithMovement, ...competitiveZoneWithFields];
      console.log(`📊 Full competitive zone: ${fullCompetitiveZone.length} fictions (RS Main: ${rsMainWithMovement.length}, Calculated: ${competitiveZone.length})`);

      // Step 5: Get current cache to compare for movement
      const currentCache = await this.getCurrentCache();
      const currentCacheMap = new Map(
        currentCache.map(entry => [entry.fiction_id, entry])
      );

      // Step 6: Update cache with intelligent movement tracking
      let updatedCount = 0;
      let movedCount = 0;
      let preservedCount = 0;

      for (const fiction of fullCompetitiveZone) {
        const existing = currentCacheMap.get(fiction.fiction_id);

        let lastMove: 'up' | 'down' | 'same' | 'new';
        let lastPosition: number | undefined;
        let lastMoveDate: string | undefined;

        // Check if this fiction already has movement data (from RS Main)
        if (fiction.last_move !== undefined) {
          // RS Main fiction - use existing movement data
          lastMove = fiction.last_move;
          lastPosition = fiction.last_position;
          lastMoveDate = fiction.last_move_date;
        } else if (existing) {
          // Calculated fiction - check if position changed from previous cache
          if (fiction.calculated_position < existing.calculated_position) {
            // Moved up
            lastMove = 'up';
            lastPosition = existing.calculated_position;
            lastMoveDate = new Date().toISOString();
            movedCount++;
          } else if (fiction.calculated_position > existing.calculated_position) {
            // Moved down
            lastMove = 'down';
            lastPosition = existing.calculated_position;
            lastMoveDate = new Date().toISOString();
            movedCount++;
          } else {
            // Position unchanged - preserve previous movement data
            lastMove = existing.last_move;
            lastPosition = existing.last_position || undefined;
            lastMoveDate = existing.last_move_date || undefined;
            preservedCount++;
          }
        } else {
          // New fiction not in cache
          lastMove = 'new';
          lastPosition = undefined;
          lastMoveDate = undefined;
        }

        // Upsert to database
        await this.upsertCacheEntry({
          fiction_id: fiction.fiction_id,
          calculated_position: fiction.calculated_position,
          last_move: lastMove,
          last_position: lastPosition,
          last_move_date: lastMoveDate
        });

        updatedCount++;
      }

      // Step 7: Remove fictions that are no longer in the competitive zone
      const currentFictionIds = fullCompetitiveZone.map(f => f.fiction_id);
      await this.removeStaleEntries(currentFictionIds);

      const elapsed = Date.now() - startTime;
      console.log(`✅ Competitive zone cache rebuilt in ${elapsed}ms`);
      console.log(`   - ${updatedCount} fictions updated`);
      console.log(`   - ${movedCount} fictions moved positions`);
      console.log(`   - ${preservedCount} fictions preserved movement data`);
      console.log(`   - Position range: #${Math.min(...fullCompetitiveZone.map(f => f.calculated_position))} to #${Math.max(...fullCompetitiveZone.map(f => f.calculated_position))}`);

    } catch (error) {
      console.error('❌ Error rebuilding competitive zone cache:', error);
      throw error;
    }
  }

  /**
   * Find a reference fiction from a specific genre at a specific position
   */
  private async findReferenceFiction(genre: string, position: number): Promise<{
    fiction_id: number;
    title: string;
    position: number;
  } | null> {
    const query = `
      SELECT rs.fiction_id, f.title, rs.position
      FROM risingStars rs
      JOIN fiction f ON rs.fiction_id = f.id
      WHERE rs.genre = ?
        AND rs.position = ?
      ORDER BY rs.captured_at DESC
      LIMIT 1
    `;

    const result = await this.dbClient.query(query, [genre, position]);
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Calculate all fictions in the competitive zone using the reference fiction
   * This uses the same algorithm as the position calculator
   */
  private async calculateCompetitiveZone(referenceFictionId: number): Promise<Array<{
    fiction_id: number;
    calculated_position: number;
  }>> {
    // Get the most recent scrape timestamp
    const latestScrapeQuery = `SELECT MAX(captured_at) as latest_scrape FROM risingStars`;
    const latestScrapeResult = await this.dbClient.query(latestScrapeQuery);
    const latestScrapeRaw = latestScrapeResult[0]?.latest_scrape;

    if (!latestScrapeRaw) {
      throw new Error('No recent Rising Stars data available');
    }

    const latestScrape = latestScrapeRaw instanceof Date
      ? latestScrapeRaw.toISOString()
      : latestScrapeRaw;

    // Get all genres
    const genresQuery = `SELECT DISTINCT genre FROM risingStars ORDER BY genre`;
    const genresResult = await this.dbClient.query(genresQuery);
    const allGenres = genresResult.map((row: any) => row.genre);

    // Step 1: Add all fictions from Rising Stars main
    const mainFictionsQuery = `
      SELECT DISTINCT fiction_id 
      FROM risingStars 
      WHERE genre = 'main' 
        AND captured_at = ?
      LIMIT 50
    `;
    const mainFictionsResult = await this.dbClient.query(mainFictionsQuery, [latestScrape]);
    const fictionsAhead = new Set(mainFictionsResult.map((row: any) => row.fiction_id));

    // Step 2: Find genres where reference fiction appears and add fictions above it
    const fictionGenresQuery = `
      SELECT genre, position, captured_at
      FROM risingStars 
      WHERE fiction_id = ? 
      ORDER BY captured_at DESC
    `;
    const fictionGenresResult = await this.dbClient.query(fictionGenresQuery, [referenceFictionId]);

    const fictionGenresByGenre = new Map();
    for (const fictionGenre of fictionGenresResult) {
      if (!fictionGenresByGenre.has(fictionGenre.genre)) {
        fictionGenresByGenre.set(fictionGenre.genre, fictionGenre);
      }
    }

    for (const [genre, fictionGenre] of fictionGenresByGenre) {
      const position = fictionGenre.position;
      const capturedAt = fictionGenre.captured_at;

      const aboveFictionsQuery = `
        SELECT DISTINCT fiction_id 
        FROM risingStars 
        WHERE genre = ? 
          AND position < ? 
          AND captured_at = ?
      `;
      const aboveFictionsResult = await this.dbClient.query(aboveFictionsQuery, [genre, position, capturedAt]);

      aboveFictionsResult.forEach((row: any) => {
        fictionsAhead.add(row.fiction_id);
      });
    }

    // Step 3: For genres where reference fiction doesn't appear, add fictions above those in our list
    const fictionGenres = Array.from(fictionGenresByGenre.keys());
    const missingGenres = allGenres.filter((genre: any) => !fictionGenres.includes(genre));

    for (const missingGenre of missingGenres) {
      const currentFictionIds = Array.from(fictionsAhead);

      if (currentFictionIds.length > 0) {
        const genreFictionsQuery = `
          SELECT DISTINCT rs1.fiction_id 
          FROM risingStars rs1
          WHERE rs1.genre = ? 
            AND rs1.captured_at = ?
            AND EXISTS (
              SELECT 1 FROM risingStars rs2 
              WHERE rs2.fiction_id IN (${currentFictionIds.map(() => '?').join(',')})
                AND rs2.genre = ?
                AND rs2.captured_at = ?
                AND rs1.position < rs2.position
            )
        `;

        const queryParams = [missingGenre, latestScrape, ...currentFictionIds, missingGenre, latestScrape];
        const genreFictionsResult = await this.dbClient.query(genreFictionsQuery, queryParams);

        genreFictionsResult.forEach((row: any) => {
          fictionsAhead.add(row.fiction_id);
        });
      }
    }

    // Convert to array with calculated positions
    const fictionIdsArray = Array.from(fictionsAhead) as number[];
    const result: Array<{ fiction_id: number; calculated_position: number }> = [];

    // Fictions in RS Main get their actual positions
    const mainPositionsQuery = `
      SELECT fiction_id, position
      FROM risingStars
      WHERE genre = 'main'
        AND captured_at = ?
        AND fiction_id IN (${fictionIdsArray.map(() => '?').join(',')})
    `;
    const mainPositionsResult = await this.dbClient.query(mainPositionsQuery, [latestScrape, ...fictionIdsArray]);
    const mainPositionsMap = new Map(mainPositionsResult.map((row: any) => [row.fiction_id, row.position]));

    // Assign positions
    for (const fiction_id of fictionIdsArray) {
      const position = mainPositionsMap.get(fiction_id) as number | undefined;
      if (position) {
        result.push({ fiction_id, calculated_position: position });
      }
    }

    // Fictions NOT in RS Main get sequential positions starting from 51
    const nonMainFictions = fictionIdsArray.filter(id => !mainPositionsMap.has(id));
    let nextPosition = 51;
    for (const fiction_id of nonMainFictions) {
      result.push({ fiction_id, calculated_position: nextPosition++ });
    }

    // Sort by position
    result.sort((a, b) => a.calculated_position - b.calculated_position);

    return result;
  }

  /**
   * Get current cache entries
   */
  private async getCurrentCache(): Promise<CompetitiveZoneEntry[]> {
    const query = `
      SELECT fiction_id, calculated_position, last_move, last_position, last_move_date
      FROM competitiveZoneCache
    `;
    return await this.dbClient.query(query);
  }

  /**
   * Upsert a cache entry
   */
  private async upsertCacheEntry(entry: CompetitiveZoneEntry): Promise<void> {
    const query = `
      INSERT INTO competitiveZoneCache 
        (fiction_id, calculated_position, last_move, last_position, last_move_date)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        calculated_position = VALUES(calculated_position),
        last_move = VALUES(last_move),
        last_position = VALUES(last_position),
        last_move_date = VALUES(last_move_date),
        updated_at = CURRENT_TIMESTAMP
    `;

    await this.dbClient.execute(query, [
      entry.fiction_id,
      entry.calculated_position,
      entry.last_move,
      entry.last_position || null,
      entry.last_move_date || null
    ]);
  }

  /**
   * Remove entries that are no longer in the competitive zone
   */
  private async removeStaleEntries(currentFictionIds: number[]): Promise<void> {
    if (currentFictionIds.length === 0) return;

    const query = `
      DELETE FROM competitiveZoneCache
      WHERE fiction_id NOT IN (${currentFictionIds.map(() => '?').join(',')})
    `;

    await this.dbClient.execute(query, currentFictionIds);
  }

  /**
   * Get a fiction's position from the cache
   */
  async getFictionPosition(fictionId: number): Promise<CompetitiveZoneEntry | null> {
    const query = `
      SELECT fiction_id, calculated_position, last_move, last_position, last_move_date
      FROM competitiveZoneCache
      WHERE fiction_id = ?
    `;

    const result = await this.dbClient.query(query, [fictionId]);
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Get fictions in a position range from cache
   */
  async getFictionsInRange(startPosition: number, endPosition: number): Promise<CompetitiveZoneEntry[]> {
    const query = `
      SELECT czc.fiction_id, czc.calculated_position, czc.last_move, czc.last_position, czc.last_move_date,
             f.title, f.author_name, f.royalroad_id, f.image_url
      FROM competitiveZoneCache czc
      JOIN fiction f ON czc.fiction_id = f.id
      WHERE czc.calculated_position BETWEEN ? AND ?
      ORDER BY czc.calculated_position ASC
    `;

    return await this.dbClient.query(query, [startPosition, endPosition]);
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    totalEntries: number;
    minPosition: number;
    maxPosition: number;
    lastUpdated: string;
  }> {
    const query = `
      SELECT 
        COUNT(*) as total_entries,
        MIN(calculated_position) as min_position,
        MAX(calculated_position) as max_position,
        MAX(updated_at) as last_updated
      FROM competitiveZoneCache
    `;

    const result = await this.dbClient.query(query);
    return {
      totalEntries: result[0].total_entries,
      minPosition: result[0].min_position,
      maxPosition: result[0].max_position,
      lastUpdated: result[0].last_updated
    };
  }
}

export const competitiveZoneCacheService = new CompetitiveZoneCacheService();

