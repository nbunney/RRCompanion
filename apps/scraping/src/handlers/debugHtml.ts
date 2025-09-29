import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { RoyalRoadScrapingService } from '../services/royalroad';
import { ScrapingResponse } from '../types';

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();

  console.log('🔍 Debug Royal Road HTML structure');
  console.log('Event:', JSON.stringify(event, null, 2));

  // Get Royal Road ID from query parameters or default to 122933 (the one we tested)
  const royalroadId = event.queryStringParameters?.royalroadId || '122933';

  const scrapingService = new RoyalRoadScrapingService();

  try {
    console.log(`🔍 Fetching HTML for fiction ${royalroadId}...`);

    // Get the raw HTML response
    const response = await (scrapingService as any).httpClient.get(`/fiction/${royalroadId}`);
    console.log(`✅ Got HTML response (${response.data.length} characters)`);

    // Parse with cheerio
    const cheerio = require('cheerio');
    const $ = cheerio.load(response.data);

    // Log the page title to confirm we got the right page
    const pageTitle = $('title').text();
    console.log(`📄 Page title: ${pageTitle}`);

    // Look for stats-related elements
    console.log('\n🔍 Looking for stats elements...');

    // Check for .stats .stat pattern
    const statsElements = $('.stats .stat');
    console.log(`Found ${statsElements.length} elements matching '.stats .stat'`);

    statsElements.each((i: number, element: any) => {
      const $el = $(element);
      const label = $el.find('.label').text().trim();
      const value = $el.find('.value').text().trim();
      console.log(`  Stat ${i}: "${label}" = "${value}"`);
    });

    // Check for other possible stats patterns
    console.log('\n🔍 Looking for alternative stats patterns...');

    // Check for elements with stats-related text
    const possibleStatsSelectors = [
      '.fiction-stats',
      '.story-stats',
      '.stats-container',
      '.statistics',
      '[class*="stat"]',
      '[class*="rating"]',
      '[class*="follow"]',
      '[class*="view"]'
    ];

    possibleStatsSelectors.forEach(selector => {
      const elements = $(selector);
      if (elements.length > 0) {
        console.log(`Found ${elements.length} elements matching '${selector}'`);
        elements.each((i: number, element: any) => {
          const $el = $(element);
          console.log(`  ${selector}[${i}]: ${$el.text().trim().substring(0, 100)}...`);
        });
      }
    });

    // Look for any text that might contain numbers (potential stats)
    console.log('\n🔍 Looking for number patterns...');
    const allText = $('body').text();
    const numberPatterns = [
      /(\d+)\s*(?:pages?|chapters?)/gi,
      /(\d+)\s*(?:ratings?|stars?)/gi,
      /(\d+)\s*(?:followers?|follows?)/gi,
      /(\d+)\s*(?:favorites?|favs?)/gi,
      /(\d+)\s*(?:views?|reads?)/gi,
      /(\d+\.?\d*)\s*(?:score|rating)/gi
    ];

    numberPatterns.forEach((pattern, i) => {
      const matches = allText.match(pattern);
      if (matches) {
        console.log(`Number pattern ${i}: ${matches.slice(0, 5).join(', ')}`);
      }
    });

    // Look for score patterns specifically
    console.log('\n🔍 Looking for score patterns...');
    const scorePatterns = [
      /(\d+\.?\d*)\s*(?:★|stars?|rating)/gi,
      /(\d+\.?\d*)\s*\/\s*5/gi,
      /rating[:\s]*(\d+\.?\d*)/gi,
      /score[:\s]*(\d+\.?\d*)/gi,
      /(\d+\.?\d*)\s*out\s*of\s*5/gi
    ];

    scorePatterns.forEach((pattern, i) => {
      const matches = allText.match(pattern);
      if (matches) {
        console.log(`Score pattern ${i}: ${matches.slice(0, 10).join(', ')}`);
      }
    });

    // Look for any decimal numbers that could be scores
    const decimalPattern = /(\d+\.\d+)/g;
    const decimalMatches = allText.match(decimalPattern);
    if (decimalMatches) {
      console.log(`Decimal numbers found: ${decimalMatches.slice(0, 20).join(', ')}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'HTML structure analysis completed',
        royalroadId,
        pageTitle,
        statsElementsFound: statsElements.length,
        executionTime: Date.now() - startTime
      } as ScrapingResponse)
    };

  } catch (error) {
    console.error('❌ Debug scraping failed:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime
      } as ScrapingResponse)
    };
  }
};
