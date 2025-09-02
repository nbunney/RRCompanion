import { Client } from 'mysql';
import { RoyalRoadService, RisingStarFiction } from './royalroad.ts';
import { RisingStarsService, RisingStarEntry } from './risingStars.ts';
import { FictionService } from './fiction.ts';

export interface FictionHistoryEntry {
  id?: number;
  fiction_id: number;
  royalroad_id: string;
  description?: string;
  status?: string;
  type?: string;
  tags?: any;
  warnings?: any;
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
  captured_at?: Date;
}

export class FictionHistoryService {
  private royalroadService: RoyalRoadService;
  private risingStarsService: RisingStarsService;
  private dbClient: Client;

  constructor() {
    this.royalroadService = new RoyalRoadService();
    this.risingStarsService = new RisingStarsService();
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

  // Save fiction history data to the database
  async saveFictionHistoryData(risingStars: RisingStarFiction[]): Promise<void> {
    try {
      console.log(`\n💾 Saving ${risingStars.length} fiction history entries to database...`);

      // Create a single timestamp for this collection run
      const collectionTimestamp = new Date();

      // Track which fictions we've already processed to avoid duplicate API calls
      const processedFictionIds = new Set<string>();

      for (let i = 0; i < risingStars.length; i++) {
        const star = risingStars[i];

        try {
          console.log(`\n🔍 Processing fiction history entry ${i + 1}/${risingStars.length}: ${star.id} (${star.title})`);

          // First, check if the fiction exists in our database
          let fictionId = await this.getFictionIdByRoyalRoadId(star.id);

          // If fiction exists, check if we already have a history entry for today
          if (fictionId) {
            const hasHistoryToday = await this.hasFictionHistoryEntryToday(fictionId);
            if (hasHistoryToday) {
              console.log(`⏭️ Fiction ${star.id} already has a history entry for today, skipping API call`);

              // Still create rising star entry (one for each list appearance)
              if (star.genre && star.position) {
                const risingStarEntry: RisingStarEntry = {
                  fiction_id: fictionId,
                  genre: star.genre,
                  position: star.position,
                  captured_at: collectionTimestamp
                };
                await this.risingStarsService.saveRisingStarEntry(risingStarEntry);
                console.log(`✅ Saved rising star entry for fiction ${star.id} (position ${star.position} in ${star.genre})`);
              }
              continue; // Skip to next fiction
            }
          }

          // Fetch fresh data from Royal Road API if we haven't processed this fiction yet
          if (processedFictionIds.has(star.id)) {
            console.log(`⏭️ Fiction ${star.id} already processed in this batch, skipping API call`);
          } else {
            // Fetch fresh data from Royal Road API
            console.log(`📡 Fetching fresh data for fiction ${star.id} from Royal Road API...`);
            await this.createFictionFromRisingStar(star);
            processedFictionIds.add(star.id);
          }

          // Get the fiction ID (should exist now)
          fictionId = await this.getFictionIdByRoyalRoadId(star.id);
          if (!fictionId) {
            console.error(`❌ Could not find fiction ID for Royal Road ID ${star.id}`);
            continue;
          }

          // Create fiction history entry (only once per fiction per day)
          const fictionHistoryEntry: FictionHistoryEntry = {
            fiction_id: fictionId,
            royalroad_id: star.id,
            description: star.description || undefined,
            status: star.status || undefined,
            type: star.type || undefined,
            tags: star.tags ? JSON.stringify(star.tags) : undefined,
            warnings: star.warnings ? JSON.stringify(star.warnings) : undefined,
            pages: star.pages || 0,
            ratings: star.ratings || 0,
            followers: star.stats?.followers || 0,
            favorites: star.stats?.favorites || 0,
            views: star.stats?.views || 0,
            score: star.stats?.score || 0,
            overall_score: star.stats?.overall_score || 0,
            style_score: star.stats?.style_score || 0,
            story_score: star.stats?.story_score || 0,
            grammar_score: star.stats?.grammar_score || 0,
            character_score: star.stats?.character_score || 0,
            total_views: star.stats?.total_views || 0,
            average_views: star.stats?.average_views || 0,
            captured_at: collectionTimestamp
          };

          // Save fiction history entry
          await this.saveFictionHistoryEntry(fictionHistoryEntry);
          console.log(`✅ Created fiction history entry for fiction ${star.id} (ID: ${fictionId})`);

          // Always create rising star entry (one for each list appearance)
          if (star.genre && star.position) {
            const risingStarEntry: RisingStarEntry = {
              fiction_id: fictionId,
              genre: star.genre,
              position: star.position,
              captured_at: collectionTimestamp
            };
            // Save immediately instead of batching
            await this.risingStarsService.saveRisingStarEntry(risingStarEntry);
            console.log(`✅ Saved rising star entry for fiction ${star.id} (position ${star.position} in ${star.genre})`);
          }

          console.log(`✅ Fiction ${star.id} ready for history entry (ID: ${fictionId})`);

          // Add delay between requests
          if (i < risingStars.length - 1) {
            console.log('⏳ Waiting 1 second before processing next fiction...');
            await new Promise(resolve => setTimeout(resolve, 1000));
          }

        } catch (error) {
          console.error(`❌ Error processing fiction ${star.id}:`, error);
          continue;
        }
      }

      // Rising star entries are now saved immediately during processing

      console.log(`✅ Successfully processed ${risingStars.length} fiction history entries`);
    } catch (error) {
      console.error('❌ Error saving fiction history data:', error);
      throw error;
    }
  }

  // Get fiction ID by Royal Road ID
  private async getFictionIdByRoyalRoadId(royalroadId: string): Promise<number | null> {
    try {
      const client = await this.getConnection();
      const result = await client.query('SELECT id FROM fiction WHERE royalroad_id = ?', [royalroadId]);
      return result.length > 0 ? result[0].id : null;
    } catch (error) {
      console.error('Error getting fiction ID:', error);
      return null;
    }
  }

  // Create or update a fiction from Rising Star data by fetching full details from Royal Road API
  async createFictionFromRisingStar(star: RisingStarFiction): Promise<void> {
    try {
      // Get full fiction data from Royal Road API
      const fictionResponse = await this.royalroadService.getFiction(star.id);

      if (fictionResponse.success && fictionResponse.data) {
        const fiction = fictionResponse.data;

        console.log(`📊 Full fiction data for ${star.id}:`, {
          title: fiction.title,
          author: fiction.author,
          stats: fiction.stats,
          pages: fiction.stats?.pages,
          ratings: fiction.stats?.ratings,
          followers: fiction.stats?.followers,
          favorites: fiction.stats?.favorites,
          views: fiction.stats?.views,
          score: fiction.stats?.score,
          overall_score: fiction.stats?.overall_score,
          style_score: fiction.stats?.style_score,
          story_score: fiction.stats?.story_score,
          grammar_score: fiction.stats?.grammar_score,
          character_score: fiction.stats?.character_score,
          total_views: fiction.stats?.total_views,
          average_views: fiction.stats?.average_views,
        });

        // Update the Rising Star with complete data
        star.title = fiction.title;
        star.author.name = fiction.author.name;
        star.author.id = fiction.author.id;
        star.author.avatar = fiction.author.avatar;
        star.description = fiction.description;
        star.image_url = fiction.image;
        star.status = fiction.status;
        star.type = fiction.type;
        star.tags = fiction.tags;
        star.warnings = fiction.warnings;
        star.pages = fiction.stats.pages;
        star.ratings = fiction.stats.ratings;
        star.stats.followers = fiction.stats.followers;
        star.stats.favorites = fiction.stats.favorites;
        star.stats.views = fiction.stats.views;
        star.stats.score = fiction.stats.score;
        star.stats.overall_score = fiction.stats.overall_score;
        star.stats.style_score = fiction.stats.style_score;
        star.stats.story_score = fiction.stats.story_score;
        star.stats.grammar_score = fiction.stats.grammar_score;
        star.stats.character_score = fiction.stats.character_score;
        star.stats.total_views = fiction.stats.total_views;
        star.stats.average_views = fiction.stats.average_views;

        // Clean and validate data before database insertion
        const cleanString = (str: any): string => {
          if (str === null || str === undefined) return '';
          return String(str).trim();
        };

        const cleanNumber = (num: any): number => {
          if (num === null || num === undefined) return 0;
          const parsed = Number(num);
          return isNaN(parsed) ? 0 : parsed;
        };

        // Check if fiction already exists
        const client = await this.getConnection();
        const existingFiction = await client.query('SELECT id FROM fiction WHERE royalroad_id = ?', [star.id]);

        if (existingFiction.length > 0) {
          // Update existing fiction with fresh data
          const fictionId = existingFiction[0].id;
          await client.execute(`
            UPDATE fiction SET
              title = ?, author_name = ?, author_id = ?, author_avatar = ?,
              description = ?, image_url = ?, status = ?, type = ?, tags = ?, warnings = ?,
              pages = ?, ratings = ?, followers = ?, favorites = ?, views = ?, score = ?,
              overall_score = ?, style_score = ?, story_score = ?, grammar_score = ?, character_score = ?,
              total_views = ?, average_views = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `, [
            cleanString(fiction.title),
            cleanString(fiction.author.name),
            cleanString(fiction.author.id),
            cleanString(fiction.author.avatar),
            cleanString(fiction.description),
            cleanString(fiction.image),
            cleanString(fiction.status),
            cleanString(fiction.type),
            fiction.tags ? JSON.stringify(fiction.tags) : null,
            fiction.warnings ? JSON.stringify(fiction.warnings) : null,
            cleanNumber(fiction.stats.pages),
            cleanNumber(fiction.stats.ratings),
            cleanNumber(fiction.stats.followers),
            cleanNumber(fiction.stats.favorites),
            cleanNumber(fiction.stats.views),
            cleanNumber(fiction.stats.score),
            cleanNumber(fiction.stats.overall_score),
            cleanNumber(fiction.stats.style_score),
            cleanNumber(fiction.stats.story_score),
            cleanNumber(fiction.stats.grammar_score),
            cleanNumber(fiction.stats.character_score),
            cleanNumber(fiction.stats.total_views),
            cleanNumber(fiction.stats.average_views),
            fictionId
          ]);

          console.log(`✅ Updated fiction ${fiction.title} with ID ${fictionId}`);
        } else {
          // Insert new fiction with fresh data
          const result = await client.execute(`
            INSERT INTO fiction (
              royalroad_id, title, author_name, author_id, author_avatar,
              description, image_url, status, type, tags, warnings,
              pages, ratings, followers, favorites, views, score, overall_score, style_score,
              story_score, grammar_score, character_score, total_views, average_views
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            cleanString(fiction.id),
            cleanString(fiction.title),
            cleanString(fiction.author.name),
            cleanString(fiction.author.id),
            cleanString(fiction.author.avatar),
            cleanString(fiction.description),
            cleanString(fiction.image),
            cleanString(fiction.status),
            cleanString(fiction.type),
            fiction.tags ? JSON.stringify(fiction.tags) : null,
            fiction.warnings ? JSON.stringify(fiction.warnings) : null,
            cleanNumber(fiction.stats.pages),
            cleanNumber(fiction.stats.ratings),
            cleanNumber(fiction.stats.followers),
            cleanNumber(fiction.stats.favorites),
            cleanNumber(fiction.stats.views),
            cleanNumber(fiction.stats.score),
            cleanNumber(fiction.stats.overall_score),
            cleanNumber(fiction.stats.style_score),
            cleanNumber(fiction.stats.story_score),
            cleanNumber(fiction.stats.grammar_score),
            cleanNumber(fiction.stats.character_score),
            cleanNumber(fiction.stats.total_views),
            cleanNumber(fiction.stats.average_views)
          ]);

          const fictionId = result.lastInsertId;
          console.log(`✅ Created fiction ${fiction.title} with ID ${fictionId}`);
        }
      } else {
        console.error(`❌ Failed to fetch fiction data for ${star.id}: ${fictionResponse.message}`);
        throw new Error(`Failed to fetch fiction data: ${fictionResponse.message}`);
      }

    } catch (error) {
      console.error(`❌ Error creating/updating fiction from Rising Star ${star.id}:`, error);
      throw error;
    }
  }

  // Save a single fiction to history (public method)
  async saveFictionToHistory(fictionId: number, royalroadId: string, fictionData: any): Promise<void> {
    try {
      console.log(`📊 Saving fiction ${fictionId} to history table...`);

      // Create fiction history entry
      const fictionHistoryEntry: FictionHistoryEntry = {
        fiction_id: fictionId,
        royalroad_id: royalroadId,
        description: fictionData.description || undefined,
        status: fictionData.status || undefined,
        type: fictionData.type || undefined,
        tags: fictionData.tags ? JSON.stringify(fictionData.tags) : undefined,
        warnings: fictionData.warnings ? JSON.stringify(fictionData.warnings) : undefined,
        pages: fictionData.pages || 0,
        ratings: fictionData.ratings || 0,
        followers: fictionData.followers || 0,
        favorites: fictionData.favorites || 0,
        views: fictionData.views || 0,
        score: fictionData.score || 0,
        overall_score: fictionData.overall_score || 0,
        style_score: fictionData.style_score || 0,
        story_score: fictionData.story_score || 0,
        grammar_score: fictionData.grammar_score || 0,
        character_score: fictionData.character_score || 0,
        total_views: fictionData.total_views || 0,
        average_views: fictionData.average_views || 0,
        captured_at: new Date()
      };

      // Save the entry (this method handles checking for existing entries)
      await this.saveFictionHistoryEntry(fictionHistoryEntry);
      console.log(`✅ Successfully saved fiction ${fictionId} to history table`);
    } catch (error) {
      console.error(`❌ Error saving fiction ${fictionId} to history:`, error);
      throw error;
    }
  }

  // Save a single fiction history entry
  private async saveFictionHistoryEntry(entry: FictionHistoryEntry): Promise<void> {
    try {
      const client = await this.getConnection();

      // Check if an entry already exists for this fiction today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const existingEntry = await client.query(`
        SELECT id FROM fictionHistory 
        WHERE fiction_id = ? AND captured_at >= ? AND captured_at < ?
      `, [entry.fiction_id, today, tomorrow]);

      if (existingEntry.length > 0) {
        // Update existing entry
        await client.execute(`
          UPDATE fictionHistory SET
            description = ?,
            status = ?,
            type = ?,
            tags = ?,
            warnings = ?,
            pages = ?,
            ratings = ?,
            followers = ?,
            favorites = ?,
            views = ?,
            score = ?,
            overall_score = ?,
            style_score = ?,
            story_score = ?,
            grammar_score = ?,
            character_score = ?,
            total_views = ?,
            average_views = ?,
            captured_at = ?
          WHERE id = ?
        `, [
          entry.description || null,
          entry.status || null,
          entry.type || null,
          entry.tags || null,
          entry.warnings || null,
          entry.pages,
          entry.ratings,
          entry.followers,
          entry.favorites,
          entry.views,
          entry.score,
          entry.overall_score,
          entry.style_score,
          entry.story_score,
          entry.grammar_score,
          entry.character_score,
          entry.total_views,
          entry.average_views,
          entry.captured_at || new Date(),
          existingEntry[0].id
        ]);

        console.log(`✅ Updated existing fiction history entry for fiction ${entry.fiction_id}`);
      } else {
        // Insert new entry
        await client.execute(`
          INSERT INTO fictionHistory (
            fiction_id, royalroad_id, description, status, type, tags, warnings,
            pages, ratings, followers, favorites, views, score, overall_score, style_score,
            story_score, grammar_score, character_score, total_views, average_views, captured_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          entry.fiction_id,
          entry.royalroad_id,
          entry.description || null,
          entry.status || null,
          entry.type || null,
          entry.tags || null,
          entry.warnings || null,
          entry.pages,
          entry.ratings,
          entry.followers,
          entry.favorites,
          entry.views,
          entry.score,
          entry.overall_score,
          entry.style_score,
          entry.story_score,
          entry.grammar_score,
          entry.character_score,
          entry.total_views,
          entry.average_views,
          entry.captured_at || new Date()
        ]);

        console.log(`✅ Created new fiction history entry for fiction ${entry.fiction_id}`);
      }
    } catch (error) {
      console.error('❌ Error saving fiction history entry:', error);
      throw error;
    }
  }

  // Check if a fiction already has a history entry for today
  async hasFictionHistoryEntryToday(fictionId: number): Promise<boolean> {
    try {
      const client = await this.getConnection();

      // Get today's date range (start of day to end of day)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const result = await client.query(`
        SELECT COUNT(*) as count FROM fictionHistory 
        WHERE fiction_id = ? AND captured_at >= ? AND captured_at < ?
      `, [fictionId, today, tomorrow]);

      return result[0].count > 0;
    } catch (error) {
      console.error('❌ Error checking if fiction has history entry today:', error);
      return false;
    }
  }

  // Get the last fiction history entry for a specific fiction
  async getLastFictionHistoryEntry(fictionId: number): Promise<FictionHistoryEntry | null> {
    try {
      const client = await this.getConnection();
      const query = `
        SELECT * FROM fictionHistory 
        WHERE fiction_id = ? 
        ORDER BY captured_at DESC 
        LIMIT 1
      `;

      const result = await client.query(query, [fictionId]);
      return result.length > 0 ? result[0] as FictionHistoryEntry : null;
    } catch (error) {
      console.error('❌ Error getting last fiction history entry:', error);
      return null;
    }
  }

  // Get all fiction history entries for a specific fiction
  async getFictionHistoryByFictionId(fictionId: number): Promise<FictionHistoryEntry[]> {
    try {
      const client = await this.getConnection();
      const query = `
        SELECT * FROM fictionHistory 
        WHERE fiction_id = ? 
        ORDER BY captured_at DESC
      `;

      const result = await client.query(query, [fictionId]);
      return result as FictionHistoryEntry[];
    } catch (error) {
      console.error('❌ Error getting fiction history by fiction ID:', error);
      return [];
    }
  }

  // Get fiction history data
  async getFictionHistoryData(startDate?: Date, endDate?: Date): Promise<FictionHistoryEntry[]> {
    try {
      const client = await this.getConnection();
      let query = `
        SELECT fh.*, f.royalroad_id, f.title, f.author_name
        FROM fictionHistory fh
        JOIN fiction f ON fh.fiction_id = f.id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (startDate) {
        query += ` AND fh.captured_at >= ?`;
        params.push(startDate);
      }

      if (endDate) {
        query += ` AND fh.captured_at <= ?`;
        params.push(endDate);
      }

      query += ` ORDER BY fh.captured_at DESC`;

      const result = await client.query(query, params);
      return result as FictionHistoryEntry[];
    } catch (error) {
      console.error('❌ Error getting fiction history data:', error);
      return [];
    }
  }

  // Process all fictions
  async processAllFictions(): Promise<void> {
    try {
      console.log('🎯 Processing all fictions in the database...');

      // Get all fictions from the database
      const allFictionsResult = await FictionService.getFictions();
      const allFictions = allFictionsResult.fictions;

      if (allFictions.length === 0) {
        console.log('ℹ️ No fictions found in database');
        return;
      }

      console.log(`📊 Found ${allFictions.length} fictions to process`);

      // Process each fiction
      for (let i = 0; i < allFictions.length; i++) {
        const fiction = allFictions[i];

        try {
          console.log(`\n🔍 Processing fiction ${i + 1}/${allFictions.length}: ${fiction.royalroad_id} (${fiction.title})`);

          // Check if we already have a history entry for today
          const hasHistoryToday = await this.hasFictionHistoryEntryToday(fiction.id);
          if (hasHistoryToday) {
            console.log(`⏭️ Fiction ${fiction.royalroad_id} already has a history entry for today, skipping`);
            continue;
          }

          // Fetch fresh data from Royal Road API
          console.log(`📡 Fetching fresh data for fiction ${fiction.royalroad_id} from Royal Road API...`);
          const fictionResponse = await this.royalroadService.getFiction(fiction.royalroad_id);

          if (fictionResponse.success && fictionResponse.data) {
            const freshData = fictionResponse.data;

            // Create fiction history entry
            const fictionHistoryEntry: FictionHistoryEntry = {
              fiction_id: fiction.id,
              royalroad_id: fiction.royalroad_id,
              description: freshData.description || undefined,
              status: freshData.status || undefined,
              type: freshData.type || undefined,
              tags: freshData.tags ? JSON.stringify(freshData.tags) : undefined,
              warnings: freshData.warnings ? JSON.stringify(freshData.warnings) : undefined,
              pages: freshData.stats?.pages || 0,
              ratings: freshData.stats?.ratings || 0,
              followers: freshData.stats?.followers || 0,
              favorites: freshData.stats?.favorites || 0,
              views: freshData.stats?.views || 0,
              score: freshData.stats?.score || 0,
              overall_score: freshData.stats?.overall_score || 0,
              style_score: freshData.stats?.style_score || 0,
              story_score: freshData.stats?.story_score || 0,
              grammar_score: freshData.stats?.grammar_score || 0,
              character_score: freshData.stats?.character_score || 0,
              total_views: freshData.stats?.total_views || 0,
              average_views: freshData.stats?.average_views || 0,
              captured_at: new Date()
            };

            // Save fiction history entry
            await this.saveFictionHistoryEntry(fictionHistoryEntry);
            console.log(`✅ Created fiction history entry for fiction ${fiction.royalroad_id} (ID: ${fiction.id})`);

            // Update the fiction record with fresh data
            await FictionService.updateFiction(fiction.royalroad_id, {
              title: freshData.title,
              author_name: freshData.author.name,
              author_id: freshData.author.id,
              author_avatar: freshData.author.avatar,
              description: freshData.description,
              image_url: freshData.image,
              status: freshData.status,
              type: freshData.type,
              tags: freshData.tags,
              warnings: freshData.warnings,
              pages: freshData.stats?.pages,
              ratings: freshData.stats?.ratings,
              followers: freshData.stats?.followers,
              favorites: freshData.stats?.favorites,
              views: freshData.stats?.views,
              score: freshData.stats?.score,
              overall_score: freshData.stats?.overall_score,
              style_score: freshData.stats?.style_score,
              story_score: freshData.stats?.story_score,
              grammar_score: freshData.stats?.grammar_score,
              character_score: freshData.stats?.character_score,
              total_views: freshData.stats?.total_views,
              average_views: freshData.stats?.average_views,
            });

          } else {
            console.error(`❌ Failed to fetch data for fiction ${fiction.royalroad_id}: ${fictionResponse.message}`);
          }

          // Add delay between requests to be respectful to Royal Road
          if (i < allFictions.length - 1) {
            console.log('⏳ Waiting 1 second before processing next fiction...');
            await new Promise(resolve => setTimeout(resolve, 1000));
          }

        } catch (error) {
          console.error(`❌ Error processing fiction ${fiction.royalroad_id}:`, error);
          continue;
        }
      }

      console.log('✅ All fictions processing completed');

    } catch (error) {
      console.error('❌ Error during all fictions processing:', error);
      throw error;
    }
  }



  // Run nightly collection process
  async runNightlyCollection(): Promise<boolean> {
    try {
      console.log('🌙 Starting nightly fiction collection (Rising Stars + All Fictions)...');

      // First, get current Rising Stars data to identify fictions that need updating
      const risingStarsResponse = await this.royalroadService.getAllRisingStars();

      if (risingStarsResponse.success && risingStarsResponse.data) {
        console.log(`📊 Found ${risingStarsResponse.data.length} fictions currently on Rising Stars`);

        // Save Rising Stars data to fiction history
        await this.saveFictionHistoryData(risingStarsResponse.data);

        // Update fiction details for all Rising Stars entries
        await this.updateRisingStarsFictionDetails(risingStarsResponse.data);
      } else {
        console.error('❌ Failed to collect Rising Stars data for nightly update:', risingStarsResponse.message);
      }

      // Process all fictions in the database
      await this.processAllFictions();

      console.log('✅ Nightly fiction collection (Rising Stars + All Fictions) completed successfully');
      return true;
    } catch (error) {
      console.error('❌ Error during nightly fiction collection:', error);
      return false;
    }
  }

  // Run Rising Stars collection only (for frequent updates)
  async runRisingStarsCollection(): Promise<boolean> {
    try {
      console.log('⭐ Starting Rising Stars collection...');

      // Get all Rising Stars data
      const response = await this.royalroadService.getAllRisingStars();

      if (response.success && response.data) {
        console.log(`📊 Collected ${response.data.length} fiction entries from Rising Stars`);

        // Save the data to fiction history (Rising Stars only)
        await this.saveFictionHistoryData(response.data);

        console.log('✅ Rising Stars collection completed successfully');
        return true;
      } else {
        console.error('❌ Failed to collect Rising Stars data:', response.message);
        return false;
      }
    } catch (error) {
      console.error('❌ Error during Rising Stars collection:', error);
      return false;
    }
  }

  // Run collection for all fictions in the database
  async runAllFictionsCollection(): Promise<boolean> {
    try {
      console.log('📚 Starting collection for all fictions in database...');

      // Get all fictions from the database
      const allFictions = await FictionService.getAllFictions();
      console.log(`📊 Found ${allFictions.length} fictions in database to update`);

      if (allFictions.length === 0) {
        console.log('⚠️ No fictions found in database');
        return true;
      }

      // Create a single timestamp for this collection run
      const collectionTimestamp = new Date();

      // Process each fiction
      for (let i = 0; i < allFictions.length; i++) {
        const fiction = allFictions[i];

        try {
          console.log(`\n🔍 Processing fiction ${i + 1}/${allFictions.length}: ${fiction.royalroad_id} (${fiction.title})`);

          // Check if we already have a history entry for today
          const hasHistoryToday = await this.hasFictionHistoryEntryToday(fiction.id!);
          if (hasHistoryToday) {
            console.log(`⏭️ Fiction ${fiction.royalroad_id} already has a history entry for today, skipping`);
            continue;
          }

          // Fetch fresh data from Royal Road API
          console.log(`📡 Fetching fresh data for fiction ${fiction.royalroad_id} from Royal Road API...`);
          const fictionResponse = await this.royalroadService.getFiction(fiction.royalroad_id);

          if (fictionResponse.success && fictionResponse.data) {
            const freshData = fictionResponse.data;

            // Create fiction history entry
            const fictionHistoryEntry: FictionHistoryEntry = {
              fiction_id: fiction.id!,
              royalroad_id: fiction.royalroad_id,
              description: freshData.description || undefined,
              status: freshData.status || undefined,
              type: freshData.type || undefined,
              tags: freshData.tags ? JSON.stringify(freshData.tags) : undefined,
              warnings: freshData.warnings ? JSON.stringify(freshData.warnings) : undefined,
              pages: freshData.stats?.pages || 0,
              ratings: freshData.stats?.ratings || 0,
              followers: freshData.stats?.followers || 0,
              favorites: freshData.stats?.favorites || 0,
              views: freshData.stats?.views || 0,
              score: freshData.stats?.score || 0,
              overall_score: freshData.stats?.overall_score || 0,
              style_score: freshData.stats?.style_score || 0,
              story_score: freshData.stats?.story_score || 0,
              grammar_score: freshData.stats?.grammar_score || 0,
              character_score: freshData.stats?.character_score || 0,
              total_views: freshData.stats?.total_views || 0,
              average_views: freshData.stats?.average_views || 0,
              captured_at: collectionTimestamp
            };

            // Save fiction history entry
            await this.saveFictionHistoryEntry(fictionHistoryEntry);
            console.log(`✅ Created fiction history entry for fiction ${fiction.royalroad_id} (ID: ${fiction.id})`);

            // Update the fiction record with fresh data
            await FictionService.updateFiction(fiction.royalroad_id, {
              title: freshData.title,
              author_name: freshData.author.name,
              author_id: freshData.author.id,
              author_avatar: freshData.author.avatar,
              description: freshData.description,
              image_url: freshData.image,
              status: freshData.status,
              type: freshData.type,
              tags: freshData.tags,
              warnings: freshData.warnings,
              pages: freshData.stats?.pages,
              ratings: freshData.stats?.ratings,
              followers: freshData.stats?.followers,
              favorites: freshData.stats?.favorites,
              views: freshData.stats?.views,
              score: freshData.stats?.score,
              overall_score: freshData.stats?.overall_score,
              style_score: freshData.stats?.style_score,
              story_score: freshData.stats?.story_score,
              grammar_score: freshData.stats?.grammar_score,
              character_score: freshData.stats?.character_score,
              total_views: freshData.stats?.total_views,
              average_views: freshData.stats?.average_views,
            });

            console.log(`✅ Updated fiction record for ${fiction.royalroad_id}`);
          } else {
            console.error(`❌ Failed to fetch data for fiction ${fiction.royalroad_id}: ${fictionResponse.message}`);
          }

          // Add delay between requests to be respectful to RoyalRoad
          if (i < allFictions.length - 1) {
            console.log('⏳ Waiting 1 second before processing next fiction...');
            await new Promise(resolve => setTimeout(resolve, 1000));
          }

        } catch (error) {
          console.error(`❌ Error processing fiction ${fiction.royalroad_id}:`, error);
          continue;
        }
      }

      console.log(`✅ Successfully processed ${allFictions.length} fictions from database`);
      return true;
    } catch (error) {
      console.error('❌ Error during all fictions collection:', error);
      return false;
    }
  }

  // Update fiction details for all Rising Stars entries
  private async updateRisingStarsFictionDetails(risingStarsData: any[]): Promise<void> {
    try {
      console.log('🔄 Updating fiction details for Rising Stars entries...');

      // Get unique fiction IDs from Rising Stars data
      const fictionIds = [...new Set(risingStarsData.map(entry => entry.fiction_id))];
      console.log(`📝 Found ${fictionIds.length} unique fictions on Rising Stars to update`);

      for (let i = 0; i < fictionIds.length; i++) {
        const fictionId = fictionIds[i];

        try {
          // Get current fiction data from RoyalRoad
          const fictionResponse = await this.royalroadService.getFiction(fictionId);

          if (fictionResponse.success && fictionResponse.data) {
            const freshData = fictionResponse.data;

            // Update the fiction record with fresh data
            await FictionService.updateFiction(fictionId, {
              title: freshData.title,
              author_name: freshData.author.name,
              author_id: freshData.author.id,
              author_avatar: freshData.author.avatar,
              description: freshData.description,
              image_url: freshData.image,
              status: freshData.status,
              type: freshData.type,
              tags: freshData.tags,
              warnings: freshData.warnings,
              pages: freshData.stats?.pages,
              ratings: freshData.stats?.ratings,
              followers: freshData.stats?.followers,
              favorites: freshData.stats?.favorites,
              views: freshData.stats?.views,
              score: freshData.stats?.score,
              overall_score: freshData.stats?.overall_score,
              style_score: freshData.stats?.style_score,
              story_score: freshData.stats?.story_score,
              grammar_score: freshData.stats?.grammar_score,
              character_score: freshData.stats?.character_score,
              total_views: freshData.stats?.total_views,
              average_views: freshData.stats?.average_views,
            });

            console.log(`✅ Updated fiction details for Rising Stars entry ${i + 1}/${fictionIds.length}: ${freshData.title}`);
          } else {
            console.error(`❌ Failed to fetch data for Rising Stars fiction ${fictionId}: ${fictionResponse.message}`);
          }

          // Add delay between requests to be respectful to RoyalRoad
          if (i < fictionIds.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
          }

        } catch (error) {
          console.error(`❌ Error updating Rising Stars fiction ${fictionId}:`, error);
          continue; // Continue with next fiction even if one fails
        }
      }

      console.log('✅ Rising Stars fiction details update completed');
    } catch (error) {
      console.error('❌ Error during Rising Stars fiction details update:', error);
      throw error;
    }
  }
} 