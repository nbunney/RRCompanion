import { Context } from 'oak';
import { FictionService } from '../services/fiction.ts';
import { RoyalRoadService } from '../services/royalroad.ts';
import { FictionHistoryService } from '../services/fictionHistory.ts';
import type { ApiResponse, CreateFictionRequest, UpdateFictionRequest, Fiction } from '../types/index.ts';

// Get all fictions with pagination
export async function getFictions(ctx: Context): Promise<void> {
  try {
    const url = new URL(ctx.request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    const { fictions, total, totalPages } = await FictionService.getFictions(page, limit);

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: {
        fictions,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
    } as ApiResponse;
  } catch (error) {
    console.error('Get fictions error:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: 'Internal server error',
    } as ApiResponse;
  }
}

// Get fiction by Royal Road ID
export async function getFictionByRoyalRoadId(ctx: Context): Promise<void> {
  try {
    const royalroadId = (ctx as any).params?.id;
    if (!royalroadId) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: 'Royal Road ID is required',
      } as ApiResponse;
      return;
    }

    const fiction = await FictionService.getFictionByRoyalRoadId(royalroadId);
    if (!fiction) {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        error: 'Fiction not found',
      } as ApiResponse;
      return;
    }

    // Get fiction history data
    const fictionHistoryService = new FictionHistoryService();
    const historyEntries = await fictionHistoryService.getFictionHistoryByFictionId(fiction.id);

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: {
        ...fiction,
        history: historyEntries,
      },
    } as ApiResponse;
  } catch (error) {
    console.error('Get fiction error:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: 'Internal server error',
    } as ApiResponse;
  }
}

// Create new fiction
export async function createFiction(ctx: Context): Promise<void> {
  try {
    const body = await ctx.request.body.json();
    const fictionData: CreateFictionRequest = body;

    // Validate required fields
    if (!fictionData.royalroad_id || !fictionData.title || !fictionData.author_name) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: 'Royal Road ID, title, and author name are required',
      } as ApiResponse;
      return;
    }

    // Check if fiction already exists
    const existingFiction = await FictionService.getFictionByRoyalRoadId(fictionData.royalroad_id);
    if (existingFiction) {
      ctx.response.status = 409;
      ctx.response.body = {
        success: false,
        error: 'Fiction already exists',
      } as ApiResponse;
      return;
    }

    const fiction = await FictionService.createFiction(fictionData);

    ctx.response.status = 201;
    ctx.response.body = {
      success: true,
      data: fiction,
      message: 'Fiction created successfully',
    } as ApiResponse;
  } catch (error) {
    console.error('Create fiction error:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: 'Internal server error',
    } as ApiResponse;
  }
}

// Update fiction
export async function updateFiction(ctx: Context): Promise<void> {
  try {
    const royalroadId = (ctx as any).params?.id;
    if (!royalroadId) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: 'Royal Road ID is required',
      } as ApiResponse;
      return;
    }

    const body = await ctx.request.body.json();
    const fictionData: UpdateFictionRequest = body;

    const fiction = await FictionService.updateFiction(royalroadId, fictionData);
    if (!fiction) {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        error: 'Fiction not found',
      } as ApiResponse;
      return;
    }

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: fiction,
      message: 'Fiction updated successfully',
    } as ApiResponse;
  } catch (error) {
    console.error('Update fiction error:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: 'Internal server error',
    } as ApiResponse;
  }
}

// Delete fiction
export async function deleteFiction(ctx: Context): Promise<void> {
  try {
    const royalroadId = (ctx as any).params?.id;
    if (!royalroadId) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: 'Royal Road ID is required',
      } as ApiResponse;
      return;
    }

    const success = await FictionService.deleteFiction(royalroadId);
    if (!success) {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        error: 'Fiction not found',
      } as ApiResponse;
      return;
    }

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: 'Fiction deleted successfully',
    } as ApiResponse;
  } catch (error) {
    console.error('Delete fiction error:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: 'Internal server error',
    } as ApiResponse;
  }
}

// Search fictions
export async function searchFictions(ctx: Context): Promise<void> {
  try {
    const url = new URL(ctx.request.url);
    const query = url.searchParams.get('q');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    if (!query) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: 'Search query is required',
      } as ApiResponse;
      return;
    }

    const { fictions, total, totalPages } = await FictionService.searchFictions(query, page, limit);

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: {
        fictions,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
    } as ApiResponse;
  } catch (error) {
    console.error('Search fictions error:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: 'Internal server error',
    } as ApiResponse;
  }
}

// Get top fictions
export async function getTopFictions(ctx: Context): Promise<void> {
  try {
    const url = new URL(ctx.request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');

    const fictions = await FictionService.getTopFictions(limit);

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: fictions,
    } as ApiResponse;
  } catch (error) {
    console.error('Get top fictions error:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: 'Internal server error',
    } as ApiResponse;
  }
}

// Get popular fictions
export async function getPopularFictions(ctx: Context): Promise<void> {
  try {
    const url = new URL(ctx.request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');

    const fictions = await FictionService.getPopularFictions(limit);

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: fictions,
    } as ApiResponse;
  } catch (error) {
    console.error('Get popular fictions error:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: 'Internal server error',
    } as ApiResponse;
  }
}

// Get fictions by author
export async function getFictionsByAuthor(ctx: Context): Promise<void> {
  try {
    const authorId = (ctx as any).params?.authorId;
    if (!authorId) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: 'Author ID is required',
      } as ApiResponse;
      return;
    }

    const fictions = await FictionService.getFictionsByAuthor(authorId);

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: fictions,
    } as ApiResponse;
  } catch (error) {
    console.error('Get fictions by author error:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: 'Internal server error',
    } as ApiResponse;
  }
}

// Refresh fiction data from Royal Road
export async function refreshFiction(ctx: Context): Promise<void> {
  try {
    const royalroadId = (ctx as any).params?.id;
    if (!royalroadId) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: 'Royal Road ID is required',
      } as ApiResponse;
      return;
    }

    // Get the existing fiction from our database
    const existingFiction = await FictionService.getFictionByRoyalRoadId(royalroadId);
    if (!existingFiction) {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        error: 'Fiction not found in database',
      } as ApiResponse;
      return;
    }

    // Check if we can refresh based on the last fictionHistory entry
    const fictionHistoryService = new FictionHistoryService();
    const lastHistoryEntry = await fictionHistoryService.getLastFictionHistoryEntry(existingFiction.id);
    if (lastHistoryEntry) {
      const now = new Date();
      const lastRefresh = new Date(lastHistoryEntry.captured_at!);
      const timeDiff = now.getTime() - lastRefresh.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);

      if (hoursDiff < 24) {
        const remainingHours = Math.floor(24 - hoursDiff);
        ctx.response.status = 429; // Too Many Requests
        ctx.response.body = {
          success: false,
          error: `Can only refresh once every 24 hours. Try again in ${remainingHours} hours.`,
          lastRefresh: lastHistoryEntry.captured_at,
          nextRefreshAvailable: new Date(lastRefresh.getTime() + (24 * 60 * 60 * 1000)),
        } as ApiResponse;
        return;
      }
    }

    // Fetch fresh data from Royal Road
    const royalroadService = new RoyalRoadService();
    const response = await royalroadService.getFiction(royalroadId);

    if (!response.success || !response.data) {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        error: 'Failed to fetch fiction from Royal Road',
      } as ApiResponse;
      return;
    }

    // Debug: Log the data being passed to updateFiction
    console.log('🔄 Refresh fiction data:', JSON.stringify(response.data, null, 2));

    // Update the fiction with fresh data
    const updatedFiction = await FictionService.updateFiction(royalroadId, {
      title: response.data.title,
      author_name: response.data.author.name,
      author_id: response.data.author.id,
      author_avatar: response.data.author.avatar,
      description: response.data.description,
      image_url: response.data.image,
      status: response.data.status,
      type: response.data.type,
      tags: response.data.tags,
      warnings: response.data.warnings,
      pages: response.data.stats.pages,
      ratings: response.data.stats.ratings,
      followers: response.data.stats.followers,
      favorites: response.data.stats.favorites,
      views: response.data.stats.views,
      score: response.data.stats.score,
    });

    if (!updatedFiction) {
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        error: 'Failed to update fiction',
      } as ApiResponse;
      return;
    }

    // Create a new fictionHistory entry
    await fictionHistoryService.saveFictionToHistory(
      existingFiction.id,
      royalroadId,
      {
        description: response.data.description,
        status: response.data.status,
        type: response.data.type,
        tags: response.data.tags,
        warnings: response.data.warnings,
        pages: response.data.stats.pages,
        ratings: response.data.stats.ratings,
        followers: response.data.stats.followers,
        favorites: response.data.stats.favorites,
        views: response.data.stats.views,
        score: response.data.stats.score,
        overall_score: response.data.stats.overall_score || response.data.stats.score || 0,
        style_score: response.data.stats.style_score || 0,
        story_score: response.data.stats.story_score || 0,
        grammar_score: response.data.stats.grammar_score || 0,
        character_score: response.data.stats.character_score || 0,
        total_views: response.data.stats.views || 0,
        average_views: response.data.stats.views || 0,
      }
    );

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: updatedFiction,
      message: 'Fiction refreshed successfully',
    } as ApiResponse;
  } catch (error) {
    console.error('Refresh fiction error:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: 'Internal server error',
    } as ApiResponse;
  }
} 