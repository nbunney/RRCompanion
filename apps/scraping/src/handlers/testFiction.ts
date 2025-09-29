import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { DatabaseService } from '../services/database';
import { RoyalRoadScrapingService } from '../services/royalroad';
import { ScrapingResponse } from '../types';

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();

  console.log('🧪 Test Fiction scraping started');
  console.log('Event:', JSON.stringify(event, null, 2));

  // Get fiction ID from query parameters or default to 1
  const fictionId = event.queryStringParameters?.fictionId || '1';

  const dbService = new DatabaseService();
  const scrapingService = new RoyalRoadScrapingService();

  try {
    await dbService.connect();

    // Get fiction details from database
    const fiction = await dbService.query(`
      SELECT id, royalroad_id, title, author_name 
      FROM fiction 
      WHERE id = ?
    `, [fictionId]);

    if (fiction.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          success: false,
          error: `Fiction with ID ${fictionId} not found in database`,
          executionTime: Date.now() - startTime
        } as ScrapingResponse)
      };
    }

    const fictionData = fiction[0];
    console.log(`📚 Testing fiction: ${fictionData.title} (Royal Road ID: ${fictionData.royalroad_id})`);

    // Scrape the fiction from Royal Road
    console.log(`🔍 Scraping fiction ${fictionData.royalroad_id} from Royal Road...`);
    const scrapedData = await scrapingService.scrapeFiction(fictionData.royalroad_id);

    if (!scrapedData) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          success: false,
          error: 'Fiction not found on Royal Road - may have been deleted',
          royalroadId: fictionData.royalroad_id,
          executionTime: Date.now() - startTime
        } as ScrapingResponse)
      };
    }

    console.log('📊 Scraped data:', JSON.stringify(scrapedData, null, 2));

    // Create fiction history entry
    const historyEntry = {
      fiction_id: parseInt(fictionId),
      royalroad_id: fictionData.royalroad_id,
      title: scrapedData.title || null,
      image_url: scrapedData.image || null,
      pages: scrapedData.stats?.pages || 0,
      ratings: scrapedData.stats?.ratings || 0,
      followers: scrapedData.stats?.followers || 0,
      favorites: scrapedData.stats?.favorites || 0,
      views: scrapedData.stats?.views || 0,
      score: scrapedData.stats?.overall_score || 0, // Use overall_score as the main score
      overall_score: scrapedData.stats?.overall_score || 0,
      style_score: scrapedData.stats?.style_score || 0,
      story_score: scrapedData.stats?.story_score || 0,
      grammar_score: scrapedData.stats?.grammar_score || 0,
      character_score: scrapedData.stats?.character_score || 0,
      total_views: scrapedData.stats?.total_views || 0,
      average_views: scrapedData.stats?.average_views || 0,
      description: scrapedData.description || null,
      status: scrapedData.status || null,
      type: scrapedData.type || null,
      tags: scrapedData.tags || null,
      warnings: scrapedData.warnings || null,
      captured_at: new Date().toISOString()
    };

    console.log('💾 History entry to save:', JSON.stringify(historyEntry, null, 2));

    // Save to database
    await dbService.saveFictionHistoryEntries([historyEntry]);
    console.log('✅ History entry saved successfully');

    // Update main fiction record with latest data
    await dbService.updateFictionRecord(fictionData.id, {
      image_url: scrapedData.image,
      description: scrapedData.description,
      status: scrapedData.status,
      type: scrapedData.type,
      tags: scrapedData.tags,
      warnings: scrapedData.warnings,
      pages: scrapedData.stats?.pages,
      ratings: scrapedData.stats?.ratings,
      followers: scrapedData.stats?.followers,
      favorites: scrapedData.stats?.favorites,
      views: scrapedData.stats?.views,
      score: scrapedData.stats?.score,
      overall_score: scrapedData.stats?.overall_score,
      style_score: scrapedData.stats?.style_score,
      story_score: scrapedData.stats?.story_score,
      grammar_score: scrapedData.stats?.grammar_score,
      character_score: scrapedData.stats?.character_score,
      total_views: scrapedData.stats?.total_views,
      average_views: scrapedData.stats?.average_views
    });
    console.log('✅ Main fiction record updated successfully');

    // Get the saved entry to verify
    const savedEntry = await dbService.query(`
      SELECT * FROM fictionHistory 
      WHERE fiction_id = ? 
      ORDER BY captured_at DESC 
      LIMIT 1
    `, [fictionId]);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Test fiction scraping completed',
        fiction: {
          id: fictionData.id,
          title: fictionData.title,
          royalroad_id: fictionData.royalroad_id
        },
        scrapedData: {
          title: scrapedData.title,
          author: scrapedData.author,
          stats: scrapedData.stats
        },
        historyEntry: historyEntry,
        savedEntry: savedEntry[0],
        executionTime: Date.now() - startTime
      } as ScrapingResponse)
    };

  } catch (error) {
    console.error('❌ Test fiction scraping failed:', error);

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
