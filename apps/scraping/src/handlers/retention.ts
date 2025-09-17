import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { DatabaseService } from '../services/database';
import { ScrapingResponse, ScrapingEvent, RetentionData } from '../types';
import { getLambdaConfig, context } from '../utils/config';

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  const lambdaConfig = getLambdaConfig(context);

  console.log('🚀 Retention scraping started');
  console.log('Event:', JSON.stringify(event, null, 2));

  const dbService = new DatabaseService();

  try {
    await dbService.connect();

    // Parse event body to get user ID and retention data
    let userId: string;
    let retentionData: RetentionData[];

    if (event.body) {
      const body = JSON.parse(event.body) as ScrapingEvent & { retentionData: RetentionData[] };
      userId = body.userId || '';
      retentionData = body.retentionData || [];
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: 'Request body is required',
          executionTime: Date.now() - startTime
        } as ScrapingResponse)
      };
    }

    if (!userId || retentionData.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: 'User ID and retention data are required',
          executionTime: Date.now() - startTime
        } as ScrapingResponse)
      };
    }

    let savedCount = 0;

    // Save retention data
    for (const retention of retentionData) {
      try {
        await dbService.saveRetentionData({
          ...retention,
          userId,
          captured_at: new Date().toISOString()
        });
        savedCount++;
        console.log(`✅ Saved retention data for fiction: ${retention.fictionId}`);
      } catch (error) {
        console.error(`❌ Error saving retention data for fiction ${retention.fictionId}:`, error);
        // Continue with next retention entry
      }
    }

    console.log(`✅ Retention scraping completed: ${savedCount} entries saved`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        processedCount: retentionData.length,
        savedCount,
        executionTime: Date.now() - startTime
      } as ScrapingResponse)
    };

  } catch (error) {
    console.error('❌ Retention scraping failed:', error);

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
