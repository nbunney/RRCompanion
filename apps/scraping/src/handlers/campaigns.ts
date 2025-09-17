import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { DatabaseService } from '../services/database';
import { ScrapingResponse, ScrapingEvent, CampaignData } from '../types';
import { getLambdaConfig, context } from '../utils/config';

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  const lambdaConfig = getLambdaConfig(context);

  console.log('🚀 Campaign scraping started');
  console.log('Event:', JSON.stringify(event, null, 2));

  const dbService = new DatabaseService();

  try {
    await dbService.connect();

    // Parse event body to get user ID and campaign data
    let userId: string;
    let campaignData: CampaignData[];

    if (event.body) {
      const body = JSON.parse(event.body) as ScrapingEvent & { campaignData: CampaignData[] };
      userId = body.userId || '';
      campaignData = body.campaignData || [];
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

    if (!userId || campaignData.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: 'User ID and campaign data are required',
          executionTime: Date.now() - startTime
        } as ScrapingResponse)
      };
    }

    let savedCount = 0;

    // Save campaign data
    for (const campaign of campaignData) {
      try {
        await dbService.saveCampaignData({
          ...campaign,
          userId,
          captured_at: new Date().toISOString()
        });
        savedCount++;
        console.log(`✅ Saved campaign: ${campaign.title}`);
      } catch (error) {
        console.error(`❌ Error saving campaign ${campaign.campaignId}:`, error);
        // Continue with next campaign
      }
    }

    console.log(`✅ Campaign scraping completed: ${savedCount} campaigns saved`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        processedCount: campaignData.length,
        savedCount,
        executionTime: Date.now() - startTime
      } as ScrapingResponse)
    };

  } catch (error) {
    console.error('❌ Campaign scraping failed:', error);

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
