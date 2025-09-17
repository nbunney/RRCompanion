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

  console.log('🚀 Fiction scraping started');
  console.log('Event:', JSON.stringify(event, null, 2));

  const dbService = new DatabaseService();
  const scrapingService = new RoyalRoadScrapingService();

  try {
    await dbService.connect();

    // Parse event body to get fiction ID
    let royalroadId: string;

    if (event.body) {
      const body = JSON.parse(event.body) as ScrapingEvent;
      royalroadId = body.royalroadId || '';
    } else {
      royalroadId = event.pathParameters?.royalroadId || '';
    }

    if (!royalroadId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: 'Royal Road ID is required',
          executionTime: Date.now() - startTime
        } as ScrapingResponse)
      };
    }

    // Check if fiction already exists
    const existingFiction = await dbService.getFictionByRoyalRoadId(royalroadId);

    if (existingFiction) {
      console.log(`📚 Fiction ${royalroadId} already exists in database`);
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'Fiction already exists',
          data: existingFiction,
          executionTime: Date.now() - startTime
        } as ScrapingResponse)
      };
    }

    // Scrape fiction data
    const fictionData = await scrapingService.scrapeFiction(royalroadId);

    if (!fictionData) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          success: false,
          error: 'Fiction not found - may have been deleted or moved',
          royalroadId,
          executionTime: Date.now() - startTime
        } as ScrapingResponse)
      };
    }

    // Create fiction in database
    const fictionId = await dbService.createFiction({
      royalroad_id: royalroadId,
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

    console.log(`✅ Fiction ${royalroadId} scraped and saved with ID: ${fictionId}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: {
          fictionId,
          royalroadId,
          title: fictionData.title,
          author: fictionData.author.name
        },
        executionTime: Date.now() - startTime
      } as ScrapingResponse)
    };

  } catch (error) {
    console.error('❌ Fiction scraping failed:', error);

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
