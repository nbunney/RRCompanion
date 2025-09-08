import { Router } from 'oak';
import { RisingStarsPositionService } from '../services/risingStarsPosition.ts';

const router = new Router();
const risingStarsPositionService = new RisingStarsPositionService();

/**
 * Calculate Rising Stars position for a specific fiction
 * GET /api/rising-stars-position/:fictionId
 */
router.get('/:royalroadId', async (ctx) => {
  try {
    const royalroadId = ctx.params.royalroadId;

    if (!royalroadId || !/^\d+$/.test(royalroadId)) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: 'Invalid Royal Road ID'
      };
      return;
    }

    const position = await risingStarsPositionService.calculateRisingStarsPosition(royalroadId);

    if (!position) {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        error: 'Fiction not found'
      };
      return;
    }

    ctx.response.body = {
      success: true,
      data: position
    };

  } catch (error) {
    console.error('Error in rising-stars-position endpoint:', error);

    // Check if it's a user-friendly error message
    if (error instanceof Error && (
      error.message.includes('not currently on any Rising Stars genre list') ||
      error.message.includes('No recent Rising Stars data available') ||
      error.message.includes('Rate limited')
    )) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: error.message
      };
    } else {
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: 'Internal server error'
      };
    }
  }
});

/**
 * Calculate Rising Stars positions for multiple fictions
 * POST /api/rising-stars-position
 */
router.post('/', async (ctx) => {
  try {
    const body = await ctx.request.body.json();
    const { royalroadIds } = body;

    if (!Array.isArray(royalroadIds) || royalroadIds.length === 0) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: 'royalroadIds must be a non-empty array'
      };
      return;
    }

    // Validate that all IDs are strings of numbers
    const validIds = royalroadIds.filter(id => typeof id === 'string' && /^\d+$/.test(id));

    if (validIds.length === 0) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: 'No valid fiction IDs provided'
      };
      return;
    }

    const positions = await risingStarsPositionService.getRisingStarsPositions(validIds);

    ctx.response.body = {
      success: true,
      data: positions
    };

  } catch (error) {
    console.error('Error in rising-stars-positions endpoint:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: 'Internal server error'
    };
  }
});

/**
 * Get latest Rising Stars scrape timestamp
 * GET /api/rising-stars-position/latest-scrape
 */
router.get('/latest-scrape', async (ctx) => {
  try {
    const timestamp = await risingStarsPositionService.getLatestScrapeTimestamp();

    ctx.response.body = {
      success: true,
      data: {
        latestScrape: timestamp,
        message: timestamp ? 'Data available' : 'No recent data available'
      }
    };

  } catch (error) {
    console.error('Error in rising-stars-latest-scrape endpoint:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: 'Internal server error'
    };
  }
});

export { router as risingStarsPositionRoutes };
