// Campaign routes for handling Royal Road advertising campaign data
// These routes handle storing and retrieving campaign data from the Chrome extension

import { Router } from 'oak';
import { CampaignService, CampaignData } from '../services/campaign.ts';

const router = new Router();
const campaignService = new CampaignService();

// Store campaign data from Chrome extension
router.post('/campaigns', async (ctx) => {
  try {
    const body = await ctx.request.body.json();

    if (!body.campaigns || !Array.isArray(body.campaigns)) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: 'Campaigns array is required'
      };
      return;
    }

    // Extract user information from the request
    const userId = body.userId || body.user_id;
    const username = body.username;
    const url = body.url;

    // Transform the campaigns data to match our database schema
    const campaigns: CampaignData[] = body.campaigns.map((campaign: any) => ({
      title: campaign.title,
      views: campaign.views || 0,
      clicks: campaign.clicks || 0,
      ctr: campaign.ctr || 0,
      follow: campaign.follow || 0,
      read_later: campaign.readLater || 0,
      raw_data: campaign.rawData || {},
      url: url || null
    }));

    // Store the campaigns
    await campaignService.storeCampaigns(campaigns, userId, username);

    ctx.response.body = {
      success: true,
      message: `Stored ${campaigns.length} campaigns successfully`,
      count: campaigns.length
    };

  } catch (error) {
    console.error('Error storing campaigns:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: (error as Error).message
    };
  }
});

// Get campaigns for a specific user
router.get('/campaigns/user/:userId', async (ctx) => {
  try {
    const userId = parseInt(ctx.params.userId);
    const limit = parseInt(ctx.request.url.searchParams.get('limit') || '100');

    if (isNaN(userId)) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: 'Invalid user ID'
      };
      return;
    }

    const campaigns = await campaignService.getCampaignsByUser(userId, limit);

    ctx.response.body = {
      success: true,
      data: campaigns,
      count: campaigns.length
    };

  } catch (error) {
    console.error('Error getting campaigns by user:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: (error as Error).message
    };
  }
});

// Get all campaigns with pagination
router.get('/campaigns', async (ctx) => {
  try {
    const page = parseInt(ctx.request.url.searchParams.get('page') || '1');
    const limit = parseInt(ctx.request.url.searchParams.get('limit') || '50');

    const result = await campaignService.getAllCampaigns(page, limit);

    ctx.response.body = {
      success: true,
      data: result.campaigns,
      pagination: {
        page: result.page,
        total: result.total,
        totalPages: result.totalPages,
        limit
      }
    };

  } catch (error) {
    console.error('Error getting all campaigns:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: (error as Error).message
    };
  }
});

// Get campaign statistics
router.get('/campaigns/stats', async (ctx) => {
  try {
    const stats = await campaignService.getCampaignStats();

    ctx.response.body = {
      success: true,
      data: stats
    };

  } catch (error) {
    console.error('Error getting campaign stats:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: (error as Error).message
    };
  }
});

// Delete old campaigns (admin only)
router.delete('/campaigns/old', async (ctx) => {
  try {
    const daysOld = parseInt(ctx.request.url.searchParams.get('days') || '30');

    const deletedCount = await campaignService.deleteOldCampaigns(daysOld);

    ctx.response.body = {
      success: true,
      message: `Deleted ${deletedCount} old campaigns`,
      deletedCount
    };

  } catch (error) {
    console.error('Error deleting old campaigns:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: (error as Error).message
    };
  }
});

export default router;
