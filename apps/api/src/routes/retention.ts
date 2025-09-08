import { Router } from 'oak';
import { RetentionService } from '../services/retention.ts';

const router = new Router();
const retentionService = new RetentionService();

// POST /api/retention - Store retention data from extension
router.post('/retention', async (ctx) => {
  try {
    const body = await ctx.request.body.json();
    const { retention, userId, username, url } = body;

    if (!retention || !retention.chapters || retention.chapters.length === 0) {
      ctx.response.status = 400;
      ctx.response.body = { error: 'Retention data with chapters is required' };
      return;
    }

    const recordId = await retentionService.storeRetention(retention, userId, username, url);

    ctx.response.status = 201;
    ctx.response.body = {
      success: true,
      message: 'Retention data stored successfully',
      recordId,
      chaptersCount: retention.chapters.length,
      fictionId: retention.fictionId
    };

  } catch (error) {
    console.error('Error storing retention data:', error);
    ctx.response.status = 500;
    ctx.response.body = { error: `Failed to store retention data: ${(error as Error).message}` };
  }
});

// GET /api/retention/user/:userId - Get retention data for a specific user
router.get('/retention/user/:userId', async (ctx) => {
  try {
    const userId = parseInt(ctx.params.userId);
    const limit = parseInt(ctx.request.url.searchParams.get('limit') || '50');
    const offset = parseInt(ctx.request.url.searchParams.get('offset') || '0');

    if (isNaN(userId)) {
      ctx.response.status = 400;
      ctx.response.body = { error: 'Invalid user ID' };
      return;
    }

    const retentionData = await retentionService.getRetentionByUser(userId, limit, offset);

    ctx.response.body = {
      success: true,
      data: retentionData,
      count: retentionData.length,
      userId
    };

  } catch (error) {
    console.error('Error getting retention data by user:', error);
    ctx.response.status = 500;
    ctx.response.body = { error: `Failed to get retention data: ${(error as Error).message}` };
  }
});

// GET /api/retention/fiction/:fictionId - Get retention data for a specific fiction
router.get('/retention/fiction/:fictionId', async (ctx) => {
  try {
    const fictionId = parseInt(ctx.params.fictionId);
    const limit = parseInt(ctx.request.url.searchParams.get('limit') || '50');
    const offset = parseInt(ctx.request.url.searchParams.get('offset') || '0');

    if (isNaN(fictionId)) {
      ctx.response.status = 400;
      ctx.response.body = { error: 'Invalid fiction ID' };
      return;
    }

    const retentionData = await retentionService.getRetentionByFiction(fictionId, limit, offset);

    ctx.response.body = {
      success: true,
      data: retentionData,
      count: retentionData.length,
      fictionId
    };

  } catch (error) {
    console.error('Error getting retention data by fiction:', error);
    ctx.response.status = 500;
    ctx.response.body = { error: `Failed to get retention data: ${(error as Error).message}` };
  }
});

// GET /api/retention - Get all retention data with pagination
router.get('/retention', async (ctx) => {
  try {
    const limit = parseInt(ctx.request.url.searchParams.get('limit') || '50');
    const offset = parseInt(ctx.request.url.searchParams.get('offset') || '0');

    const retentionData = await retentionService.getAllRetention(limit, offset);

    ctx.response.body = {
      success: true,
      data: retentionData,
      count: retentionData.length,
      limit,
      offset
    };

  } catch (error) {
    console.error('Error getting all retention data:', error);
    ctx.response.status = 500;
    ctx.response.body = { error: `Failed to get retention data: ${(error as Error).message}` };
  }
});

// GET /api/retention/stats - Get retention analytics statistics
router.get('/retention/stats', async (ctx) => {
  try {
    const stats = await retentionService.getRetentionStats();

    ctx.response.body = {
      success: true,
      stats
    };

  } catch (error) {
    console.error('Error getting retention stats:', error);
    ctx.response.status = 500;
    ctx.response.body = { error: `Failed to get retention stats: ${(error as Error).message}` };
  }
});

// DELETE /api/retention/old - Delete old retention data
router.delete('/retention/old', async (ctx) => {
  try {
    const daysOld = parseInt(ctx.request.url.searchParams.get('days') || '30');

    if (isNaN(daysOld) || daysOld < 1) {
      ctx.response.status = 400;
      ctx.response.body = { error: 'Valid days parameter is required (minimum 1)' };
      return;
    }

    const deletedCount = await retentionService.deleteOldRetention(daysOld);

    ctx.response.body = {
      success: true,
      message: `Deleted ${deletedCount} old retention records`,
      deletedCount,
      daysOld
    };

  } catch (error) {
    console.error('Error deleting old retention data:', error);
    ctx.response.status = 500;
    ctx.response.body = { error: `Failed to delete old retention data: ${(error as Error).message}` };
  }
});

export default router;
