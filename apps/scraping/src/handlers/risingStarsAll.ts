import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { DatabaseService } from '../services/database';
import { RoyalRoadScrapingService } from '../services/royalroad';
import { ScrapingResponse, ScrapingEvent } from '../types';
import { getLambdaConfig, shouldContinueProcessing, context } from '../utils/config';

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  const lambdaConfig = getLambdaConfig(context);

  console.log('🚀 Rising Stars All scraping started');
  console.log('Event:', JSON.stringify(event, null, 2));

  const dbService = new DatabaseService();
  const scrapingService = new RoyalRoadScrapingService();

  try {
    await dbService.connect();

    // Scrape Rising Stars for all genres
    const entries = await scrapingService.scrapeRisingStarsAll();

    if (entries.length === 0) {
      console.log('⚠️ No Rising Stars entries found');
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'No Rising Stars entries found',
          processedCount: 0,
          executionTime: Date.now() - startTime
        } as ScrapingResponse)
      };
    }

    // Process entries in smaller batches due to the larger volume
    const batchSize = 25;
    let processedCount = 0;
    let savedCount = 0;

    for (let i = 0; i < entries.length; i += batchSize) {
      // Check if we should continue processing
      if (!shouldContinueProcessing(startTime, lambdaConfig.maxExecutionTime)) {
        console.log('⏰ Approaching timeout, stopping processing');
        break;
      }

      const batch = entries.slice(i, i + batchSize);

      try {
        // Get or create fictions for this batch
        const fictionIds = new Map<string, number>();

        for (const entry of batch) {
          if (!entry.royalroad_id) continue;

          // Check if fiction exists in database
          let fiction = await dbService.getFictionByRoyalRoadId(entry.royalroad_id);

          if (!fiction) {
            // For all genres scraping, we'll create minimal fiction records
            // and let the main scraping handle detailed data
            const fictionId = await dbService.createFiction({
              royalroad_id: entry.royalroad_id,
              title: entry.title || 'Unknown Title',
              author_name: entry.author_name || 'Unknown Author',
              author_id: '',
              author_avatar: entry.image_url,
              description: '',
              image_url: entry.image_url,
              status: '',
              type: '',
              tags: [],
              warnings: [],
              pages: 0,
              ratings: 0,
              followers: 0,
              favorites: 0,
              views: 0,
              score: 0,
              overall_score: 0,
              style_score: 0,
              story_score: 0,
              grammar_score: 0,
              character_score: 0,
              total_views: 0,
              average_views: 0
            });
            fictionIds.set(entry.royalroad_id, fictionId);
          } else {
            fictionIds.set(entry.royalroad_id, fiction.id);
          }
        }

        // Save Rising Stars entries
        const risingStarsEntries = batch
          .filter(entry => entry.royalroad_id && fictionIds.has(entry.royalroad_id))
          .map(entry => ({
            fiction_id: fictionIds.get(entry.royalroad_id!)!,
            genre: entry.genre,
            position: entry.position,
            captured_at: entry.captured_at
          }));

        if (risingStarsEntries.length > 0) {
          await dbService.saveRisingStarEntries(risingStarsEntries);
          savedCount += risingStarsEntries.length;
        }

        processedCount += batch.length;
        console.log(`✅ Processed batch ${Math.floor(i / batchSize) + 1}: ${batch.length} entries`);

        // Add delay between batches
        if (i + batchSize < entries.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.error(`❌ Error processing batch ${Math.floor(i / batchSize) + 1}:`, error);
        // Continue with next batch
      }
    }

    console.log(`✅ Rising Stars All scraping completed: ${processedCount} processed, ${savedCount} saved`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        processedCount,
        savedCount,
        totalCount: entries.length,
        executionTime: Date.now() - startTime
      } as ScrapingResponse)
    };

  } catch (error) {
    console.error('❌ Rising Stars All scraping failed:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime
      } as ScrapingResponse)
    };
  } finally {
    await dbService.disconnect();
  }
};
