import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { DatabaseService } from '../services/database';
import { RoyalRoadScrapingService } from '../services/royalroad';
import { ScrapingResponse, ScrapingEvent } from '../types';
import { getLambdaConfig, shouldContinueProcessing, createBatchProcessor, context } from '../utils/config';

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  const lambdaConfig = getLambdaConfig(context);

  console.log('🚀 Rising Stars Main scraping started');
  console.log('Event:', JSON.stringify(event, null, 2));

  const dbService = new DatabaseService();
  const scrapingService = new RoyalRoadScrapingService();

  try {
    await dbService.connect();

    // Scrape Rising Stars main page
    const entries = await scrapingService.scrapeRisingStarsMain();

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

    // Process entries in batches to handle timeouts
    const batchSize = 50;
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
            // Scrape fiction data and create in database
            const fictionData = await scrapingService.scrapeFiction(entry.royalroad_id);
            if (fictionData) {
              const fictionId = await dbService.createFiction({
                royalroad_id: entry.royalroad_id,
                title: fictionData.title,
                author_name: fictionData.author.name,
                author_id: fictionData.author.id,
                author_avatar: fictionData.author.avatar,
                description: fictionData.description,
                image_url: fictionData.image,
                status: fictionData.status,
                type: fictionData.type,
                tags: fictionData.tags,
                warnings: fictionData.warnings,
                pages: fictionData.stats.pages,
                ratings: fictionData.stats.ratings,
                followers: fictionData.stats.followers,
                favorites: fictionData.stats.favorites,
                views: fictionData.stats.views,
                score: fictionData.stats.score,
                overall_score: fictionData.stats.overall_score,
                style_score: fictionData.stats.style_score,
                story_score: fictionData.stats.story_score,
                grammar_score: fictionData.stats.grammar_score,
                character_score: fictionData.stats.character_score,
                total_views: fictionData.stats.total_views,
                average_views: fictionData.stats.average_views
              });
              fictionIds.set(entry.royalroad_id, fictionId);
            }
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

        // Add delay between batches to avoid overwhelming the server
        if (i + batchSize < entries.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`❌ Error processing batch ${Math.floor(i / batchSize) + 1}:`, error);
        // Continue with next batch
      }
    }

    console.log(`✅ Rising Stars Main scraping completed: ${processedCount} processed, ${savedCount} saved`);

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
    console.error('❌ Rising Stars Main scraping failed:', error);

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
