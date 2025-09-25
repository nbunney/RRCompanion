import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { DatabaseService } from '../services/database';
import { RoyalRoadScrapingService } from '../services/royalroad';
import { ScrapingResponse, ScrapingEvent, FictionHistoryEntry } from '../types';
import { getLambdaConfig, shouldContinueProcessing, context } from '../utils/config';

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  const lambdaConfig = getLambdaConfig(context);

  console.log('🚀 Fiction History scraping started');
  console.log('Event:', JSON.stringify(event, null, 2));

  const dbService = new DatabaseService();
  const scrapingService = new RoyalRoadScrapingService();

  try {
    await dbService.connect();

    // Get fictions that need history updates (haven't been processed today)
    const fictionsToUpdate = await dbService.getFictionsToUpdate(100);

    if (fictionsToUpdate.length === 0) {
      console.log('✅ All fictions have been processed today - no updates needed');
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'All fictions have been processed today',
          processedCount: 0,
          executionTime: Date.now() - startTime
        } as ScrapingResponse)
      };
    }

    console.log(`🔍 Found ${fictionsToUpdate.length} fictions that need processing today`);

    let processedCount = 0;
    let savedCount = 0;
    const batchSize = 10;

    for (let i = 0; i < fictionsToUpdate.length; i += batchSize) {
      // Check if we should continue processing
      if (!shouldContinueProcessing(startTime, lambdaConfig.maxExecutionTime)) {
        console.log('⏰ Approaching timeout, stopping processing');
        break;
      }

      const batch = fictionsToUpdate.slice(i, i + batchSize);

      try {
        const historyEntries: FictionHistoryEntry[] = [];

        for (const fiction of batch) {
          try {
            // Scrape fiction history
            const historyData = await scrapingService.scrapeFictionHistory(fiction.royalroad_id);

            if (historyData) {
              historyEntries.push({
                fiction_id: fiction.id,
                royalroad_id: fiction.royalroad_id,
                pages: historyData.pages,
                ratings: historyData.ratings,
                followers: historyData.followers,
                favorites: historyData.favorites,
                views: historyData.views,
                score: historyData.overall_score, // Use overall_score as the main score
                overall_score: historyData.overall_score,
                style_score: historyData.style_score,
                story_score: historyData.story_score,
                grammar_score: historyData.grammar_score,
                character_score: historyData.character_score,
                total_views: historyData.total_views,
                average_views: historyData.average_views,
                description: historyData.description,
                status: historyData.status,
                type: historyData.type,
                tags: historyData.tags,
                warnings: historyData.warnings,
                captured_at: historyData.captured_at
              });
            }

            processedCount++;
            console.log(`✅ Processed fiction ${fiction.royalroad_id}: ${fiction.title}`);

            // Add delay between requests
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (error: any) {
            // Handle different types of errors
            if (error.response?.status === 404) {
              console.log(`📚 Fiction ${fiction.royalroad_id} not found (likely deleted): ${fiction.title}`);
            } else if (error.response?.status === 429) {
              console.warn(`⏰ Rate limited for fiction ${fiction.royalroad_id}, adding extra delay`);
              await new Promise(resolve => setTimeout(resolve, 5000)); // Extra delay for rate limiting
            } else {
              console.error(`❌ Error processing fiction ${fiction.royalroad_id}:`, error.message || error);
            }
            // Continue with next fiction regardless of error type
          }
        }

        // Save history entries in batch
        if (historyEntries.length > 0) {
          await dbService.saveFictionHistoryEntries(historyEntries);
          savedCount += historyEntries.length;
          console.log(`✅ Saved ${historyEntries.length} history entries`);
        }

        console.log(`✅ Processed batch ${Math.floor(i / batchSize) + 1}: ${batch.length} fictions`);

        // Add delay between batches
        if (i + batchSize < fictionsToUpdate.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.error(`❌ Error processing batch ${Math.floor(i / batchSize) + 1}:`, error);
        // Continue with next batch
      }
    }

    console.log(`✅ Fiction History scraping completed: ${processedCount} processed, ${savedCount} saved (${fictionsToUpdate.length - processedCount} remaining)`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        processedCount,
        savedCount,
        totalCount: fictionsToUpdate.length,
        remainingCount: fictionsToUpdate.length - processedCount,
        executionTime: Date.now() - startTime
      } as ScrapingResponse)
    };

  } catch (error) {
    console.error('❌ Fiction History scraping failed:', error);

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
