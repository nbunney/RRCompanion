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

    // Get fictions that need history updates
    const fictionsToUpdate = await dbService.getFictionsToUpdate(50);

    if (fictionsToUpdate.length === 0) {
      console.log('⚠️ No fictions need history updates');
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'No fictions need history updates',
          processedCount: 0,
          executionTime: Date.now() - startTime
        } as ScrapingResponse)
      };
    }

    console.log(`🔍 Found ${fictionsToUpdate.length} fictions to update`);

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
                pages: historyData.pages,
                ratings: historyData.ratings,
                followers: historyData.followers,
                favorites: historyData.favorites,
                views: historyData.views,
                score: historyData.score,
                captured_at: historyData.captured_at
              });
            }

            processedCount++;
            console.log(`✅ Processed fiction ${fiction.royalroad_id}: ${fiction.title}`);

            // Add delay between requests
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (error) {
            console.error(`❌ Error processing fiction ${fiction.royalroad_id}:`, error);
            // Continue with next fiction
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

    console.log(`✅ Fiction History scraping completed: ${processedCount} processed, ${savedCount} saved`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        processedCount,
        savedCount,
        totalCount: fictionsToUpdate.length,
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
