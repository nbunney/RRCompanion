import { client } from '../config/database.ts';

export interface RisingStarBestPosition {
  id: number;
  fiction_id: number;
  genre: string;
  best_position: number;
  first_day_on_list: string | null;
  first_achieved_at: string;
  last_updated_at: string;
  created_at: string;
}

export class RisingStarsBestPositionsService {
  private dbClient = client;

  /**
   * Calculate and update best positions for all fictions across all genres
   * This should be run daily to capture any new best positions
   */
  async updateAllBestPositions(): Promise<{ updated: number; inserted: number }> {
    console.log('🏆 Updating Rising Stars best positions...');

    try {
      let updated = 0;
      let inserted = 0;

      // Get all unique fiction_id and genre combinations with their best (lowest) position
      const bestPositionsQuery = `
        SELECT 
          fiction_id,
          genre,
          MIN(position) as best_position,
          MIN(captured_at) as first_achieved_at,
          DATE(MIN(captured_at)) as first_day_on_list
        FROM risingStars
        GROUP BY fiction_id, genre
        HAVING MIN(position) IS NOT NULL
      `;

      const bestPositions = await this.dbClient.query(bestPositionsQuery);
      console.log(`📊 Found ${bestPositions.length} fiction/genre combinations to process`);

      for (const record of bestPositions) {
        // Check if this fiction/genre combo already exists
        const existingQuery = `
          SELECT id, best_position, first_achieved_at
          FROM risingStarsBestPositions
          WHERE fiction_id = ? AND genre = ?
        `;

        const existing = await this.dbClient.query(existingQuery, [
          record.fiction_id,
          record.genre
        ]);

        if (existing.length > 0) {
          // ONLY update if the new position is better (lower number)
          // NEVER allow a worse (higher) position to replace a better one
          const currentBest = existing[0];
          if (record.best_position < currentBest.best_position) {
            const updateQuery = `
              UPDATE risingStarsBestPositions
              SET best_position = ?,
                  first_achieved_at = ?,
                  last_updated_at = NOW()
              WHERE fiction_id = ? AND genre = ?
            `;

            await this.dbClient.execute(updateQuery, [
              record.best_position,
              record.first_achieved_at,
              record.fiction_id,
              record.genre
            ]);

            updated++;
          }
        } else {
          // Insert new record
          const insertQuery = `
            INSERT INTO risingStarsBestPositions 
            (fiction_id, genre, best_position, first_day_on_list, first_achieved_at, last_updated_at, created_at)
            VALUES (?, ?, ?, ?, ?, NOW(), NOW())
          `;

          await this.dbClient.execute(insertQuery, [
            record.fiction_id,
            record.genre,
            record.best_position,
            record.first_day_on_list,
            record.first_achieved_at
          ]);

          inserted++;
          console.log(`➕ Inserted: Fiction ${record.fiction_id} in ${record.genre} - Best: #${record.best_position}`);
        }
      }

      console.log(`🎉 Best positions update complete: ${updated} updated, ${inserted} inserted`);
      return { updated, inserted };

    } catch (error) {
      console.error('❌ Error updating best positions:', error);
      throw error;
    }
  }

  /**
   * Get the best position for a specific fiction in a specific genre
   * Checks both current risingStars data and historical best positions
   */
  async getBestPosition(fictionId: number, genre: string): Promise<number | null> {
    try {
      // Get best position from historical table
      const historicalQuery = `
        SELECT best_position
        FROM risingStarsBestPositions
        WHERE fiction_id = ? AND genre = ?
      `;

      const historical = await this.dbClient.query(historicalQuery, [fictionId, genre]);
      const historicalBest = historical.length > 0 ? historical[0].best_position : null;

      // Get best position from current risingStars table
      const currentQuery = `
        SELECT MIN(position) as best_position
        FROM risingStars
        WHERE fiction_id = ? AND genre = ?
      `;

      const current = await this.dbClient.query(currentQuery, [fictionId, genre]);
      const currentBest = current.length > 0 && current[0].best_position ? current[0].best_position : null;

      // Return the lower (better) of the two
      if (historicalBest !== null && currentBest !== null) {
        return Math.min(historicalBest, currentBest);
      } else if (historicalBest !== null) {
        return historicalBest;
      } else if (currentBest !== null) {
        return currentBest;
      }

      return null;
    } catch (error) {
      console.error(`❌ Error getting best position for fiction ${fictionId} in ${genre}:`, error);
      throw error;
    }
  }

  /**
   * Get all best positions for a specific fiction across all genres
   */
  async getAllBestPositions(fictionId: number): Promise<Map<string, number>> {
    try {
      const positions = new Map<string, number>();

      // Get from historical table
      const historicalQuery = `
        SELECT genre, best_position
        FROM risingStarsBestPositions
        WHERE fiction_id = ?
      `;

      const historical = await this.dbClient.query(historicalQuery, [fictionId]);
      historical.forEach((row: any) => {
        positions.set(row.genre, row.best_position);
      });

      // Get from current risingStars table and update if better
      const currentQuery = `
        SELECT genre, MIN(position) as best_position
        FROM risingStars
        WHERE fiction_id = ?
        GROUP BY genre
      `;

      const current = await this.dbClient.query(currentQuery, [fictionId]);
      current.forEach((row: any) => {
        if (row.best_position !== null) {
          const existing = positions.get(row.genre);
          if (existing === undefined || row.best_position < existing) {
            positions.set(row.genre, row.best_position);
          }
        }
      });

      return positions;
    } catch (error) {
      console.error(`❌ Error getting all best positions for fiction ${fictionId}:`, error);
      throw error;
    }
  }

  /**
   * Clean up old Rising Stars data, keeping only noon scrapes for each day
   * Pacific Time noon is approximately 19:00-20:00 UTC depending on DST
   * Excludes the most recent 3 days from cleanup to preserve all scrapes for recent data
   */
  async cleanupOldRisingStarsData(dryRun: boolean = true, updateBestPositions: boolean = false): Promise<{ deleted: number; kept: number }> {
    console.log(`🧹 ${dryRun ? 'DRY RUN - ' : ''}Cleaning up old Rising Stars data...`);

    try {
      // Optionally update best positions first (can be slow with lots of data)
      if (updateBestPositions) {
        console.log('🏆 Updating best positions before cleanup...');
        await this.updateAllBestPositions();
      } else {
        console.log('⏭️  Skipping best positions update (run separately if needed)');
      }

      // Find all unique dates in the risingStars table, excluding the most recent 3 days
      const datesQuery = `
        SELECT DISTINCT DATE(captured_at) as scrape_date
        FROM risingStars
        WHERE DATE(captured_at) < DATE_SUB(CURDATE(), INTERVAL 3 DAY)
        ORDER BY scrape_date DESC
      `;

      const dates = await this.dbClient.query(datesQuery);
      console.log(`📅 Found ${dates.length} unique dates in Rising Stars data (excluding last 3 days)`);

      let totalDeleted = 0;
      let totalKept = 0;

      for (const dateRecord of dates) {
        const scrapeDate = dateRecord.scrape_date;

        // For each date, find the scrape closest to noon Pacific (19:00-20:00 UTC)
        // We'll look for scrapes between 18:00 and 21:00 UTC to catch variations
        const noonScrapeQuery = `
          SELECT captured_at, COUNT(*) as count
          FROM risingStars
          WHERE DATE(captured_at) = ?
            AND HOUR(captured_at) BETWEEN 18 AND 21
          GROUP BY captured_at
          ORDER BY ABS(HOUR(captured_at) - 19), ABS(MINUTE(captured_at) - 0)
          LIMIT 1
        `;

        const noonScrape = await this.dbClient.query(noonScrapeQuery, [scrapeDate]);

        if (noonScrape.length === 0) {
          console.log(`⚠️ No noon scrape found for ${scrapeDate}, keeping all scrapes for this day`);
          continue;
        }

        const keepTimestamp = noonScrape[0].captured_at;
        const keepCount = noonScrape[0].count;

        // Count how many records we'll delete for this date
        const countQuery = `
          SELECT COUNT(*) as count
          FROM risingStars
          WHERE DATE(captured_at) = ?
            AND captured_at != ?
        `;

        const countResult = await this.dbClient.query(countQuery, [scrapeDate, keepTimestamp]);
        const deleteCount = countResult[0].count;

        if (!dryRun && deleteCount > 0) {
          // Delete all scrapes for this date except the noon one
          const deleteQuery = `
            DELETE FROM risingStars
            WHERE DATE(captured_at) = ?
              AND captured_at != ?
          `;

          await this.dbClient.execute(deleteQuery, [scrapeDate, keepTimestamp]);
        }

        totalDeleted += deleteCount;
        totalKept += keepCount;

        console.log(`${dryRun ? '📊 Would delete' : '🗑️ Deleted'} ${deleteCount} records for ${scrapeDate}, keeping ${keepCount} records from ${keepTimestamp}`);
      }

      console.log(`${dryRun ? '📊 DRY RUN COMPLETE' : '✅ CLEANUP COMPLETE'}: Would delete ${totalDeleted} records, keeping ${totalKept}`);
      return { deleted: totalDeleted, kept: totalKept };

    } catch (error) {
      console.error('❌ Error cleaning up Rising Stars data:', error);
      throw error;
    }
  }
}

export const risingStarsBestPositionsService = new RisingStarsBestPositionsService();

