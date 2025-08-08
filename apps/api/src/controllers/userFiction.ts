import { Context } from 'oak';
import { UserFictionService } from '../services/userFiction.ts';
import type { ApiResponse, CreateUserFictionRequest, UpdateUserFictionRequest, UserFictionStatus } from '../types/index.ts';

// Get all userFictions for the authenticated user
export async function getUserFictions(ctx: Context): Promise<void> {
  try {
    const user = ctx.state.user;
    if (!user) {
      ctx.response.status = 401;
      ctx.response.body = {
        success: false,
        error: 'Authentication required',
      } as ApiResponse;
      return;
    }

    const url = new URL(ctx.request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    const { userFictions, total, totalPages } = await UserFictionService.getUserFictionsByUser(user.id, page, limit);

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: {
        userFictions,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
    } as ApiResponse;
  } catch (error) {
    console.error('Get userFictions error:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: 'Internal server error',
    } as ApiResponse;
  }
}

// Get userFictions by status for the authenticated user
export async function getUserFictionsByStatus(ctx: Context): Promise<void> {
  try {
    const user = ctx.state.user;
    if (!user) {
      ctx.response.status = 401;
      ctx.response.body = {
        success: false,
        error: 'Authentication required',
      } as ApiResponse;
      return;
    }

    const status = (ctx as any).params?.status as UserFictionStatus;
    if (!status || !['reading', 'completed', 'on_hold', 'dropped', 'plan_to_read'].includes(status)) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: 'Valid status is required (reading, completed, on_hold, dropped, plan_to_read)',
      } as ApiResponse;
      return;
    }

    const url = new URL(ctx.request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    const { userFictions, total, totalPages } = await UserFictionService.getUserFictionsByStatus(user.id, status, page, limit);

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: {
        userFictions,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
    } as ApiResponse;
  } catch (error) {
    console.error('Get userFictions by status error:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: 'Internal server error',
    } as ApiResponse;
  }
}

// Get user's favorite fictions
export async function getUserFavorites(ctx: Context): Promise<void> {
  try {
    const user = ctx.state.user;
    if (!user) {
      ctx.response.status = 401;
      ctx.response.body = {
        success: false,
        error: 'Authentication required',
      } as ApiResponse;
      return;
    }

    const url = new URL(ctx.request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    const { userFictions, total, totalPages } = await UserFictionService.getUserFavorites(user.id, page, limit);

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: {
        userFictions,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
    } as ApiResponse;
  } catch (error) {
    console.error('Get user favorites error:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: 'Internal server error',
    } as ApiResponse;
  }
}

// Create new userFiction relationship
export async function createUserFiction(ctx: Context): Promise<void> {
  try {
    const user = ctx.state.user;
    if (!user) {
      ctx.response.status = 401;
      ctx.response.body = {
        success: false,
        error: 'Authentication required',
      } as ApiResponse;
      return;
    }

    const body = await ctx.request.body.json();
    const fictionData: CreateUserFictionRequest = body;

    // Validate required fields
    if (!fictionData.fiction_id) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: 'Fiction ID is required',
      } as ApiResponse;
      return;
    }

    // Check if userFiction already exists
    const existingUserFiction = await UserFictionService.getUserFictionByUserAndFiction(user.id, fictionData.fiction_id);
    if (existingUserFiction) {
      ctx.response.status = 409;
      ctx.response.body = {
        success: false,
        error: 'UserFiction relationship already exists',
      } as ApiResponse;
      return;
    }

    const userFiction = await UserFictionService.createUserFiction(user.id, fictionData);

    ctx.response.status = 201;
    ctx.response.body = {
      success: true,
      data: userFiction,
      message: 'UserFiction relationship created successfully',
    } as ApiResponse;
  } catch (error) {
    console.error('Create userFiction error:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: 'Internal server error',
    } as ApiResponse;
  }
}

// Update userFiction
export async function updateUserFiction(ctx: Context): Promise<void> {
  try {
    const user = ctx.state.user;
    if (!user) {
      ctx.response.status = 401;
      ctx.response.body = {
        success: false,
        error: 'Authentication required',
      } as ApiResponse;
      return;
    }

    const fictionId = parseInt((ctx as any).params?.fictionId);
    if (!fictionId) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: 'Fiction ID is required',
      } as ApiResponse;
      return;
    }

    const body = await ctx.request.body.json();
    const userFictionData: UpdateUserFictionRequest = body;

    const userFiction = await UserFictionService.updateUserFiction(user.id, fictionId, userFictionData);
    if (!userFiction) {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        error: 'UserFiction relationship not found',
      } as ApiResponse;
      return;
    }

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: userFiction,
      message: 'UserFiction relationship updated successfully',
    } as ApiResponse;
  } catch (error) {
    console.error('Update userFiction error:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: 'Internal server error',
    } as ApiResponse;
  }
}

// Delete userFiction
export async function deleteUserFiction(ctx: Context): Promise<void> {
  try {
    const user = ctx.state.user;
    if (!user) {
      ctx.response.status = 401;
      ctx.response.body = {
        success: false,
        error: 'Authentication required',
      } as ApiResponse;
      return;
    }

    const fictionId = parseInt((ctx as any).params?.fictionId);
    if (!fictionId) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: 'Fiction ID is required',
      } as ApiResponse;
      return;
    }

    const deleted = await UserFictionService.deleteUserFiction(user.id, fictionId);
    if (!deleted) {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        error: 'UserFiction relationship not found',
      } as ApiResponse;
      return;
    }

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: 'UserFiction relationship deleted successfully',
    } as ApiResponse;
  } catch (error) {
    console.error('Delete userFiction error:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: 'Internal server error',
    } as ApiResponse;
  }
}

// Toggle favorite status
export async function toggleFavorite(ctx: Context): Promise<void> {
  try {
    const user = ctx.state.user;
    if (!user) {
      ctx.response.status = 401;
      ctx.response.body = {
        success: false,
        error: 'Authentication required',
      } as ApiResponse;
      return;
    }

    const fictionId = parseInt((ctx as any).params?.fictionId);
    if (!fictionId) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: 'Fiction ID is required',
      } as ApiResponse;
      return;
    }

    const userFiction = await UserFictionService.toggleFavorite(user.id, fictionId);
    if (!userFiction) {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        error: 'UserFiction relationship not found',
      } as ApiResponse;
      return;
    }

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: userFiction,
      message: 'Favorite status toggled successfully',
    } as ApiResponse;
  } catch (error) {
    console.error('Toggle favorite error:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: 'Internal server error',
    } as ApiResponse;
  }
}

// Update reading progress
export async function updateReadingProgress(ctx: Context): Promise<void> {
  try {
    const user = ctx.state.user;
    if (!user) {
      ctx.response.status = 401;
      ctx.response.body = {
        success: false,
        error: 'Authentication required',
      } as ApiResponse;
      return;
    }

    const fictionId = parseInt((ctx as any).params?.fictionId);
    if (!fictionId) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: 'Fiction ID is required',
      } as ApiResponse;
      return;
    }

    const body = await ctx.request.body.json();
    const { currentChapter, totalChapters } = body;

    if (currentChapter === undefined) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: 'Current chapter is required',
      } as ApiResponse;
      return;
    }

    const userFiction = await UserFictionService.updateReadingProgress(user.id, fictionId, currentChapter, totalChapters);
    if (!userFiction) {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        error: 'UserFiction relationship not found',
      } as ApiResponse;
      return;
    }

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: userFiction,
      message: 'Reading progress updated successfully',
    } as ApiResponse;
  } catch (error) {
    console.error('Update reading progress error:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: 'Internal server error',
    } as ApiResponse;
  }
}

// Get user reading statistics
export async function getUserReadingStats(ctx: Context): Promise<void> {
  try {
    const user = ctx.state.user;
    if (!user) {
      ctx.response.status = 401;
      ctx.response.body = {
        success: false,
        error: 'Authentication required',
      } as ApiResponse;
      return;
    }

    const stats = await UserFictionService.getUserReadingStats(user.id);

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: stats,
    } as ApiResponse;
  } catch (error) {
    console.error('Get user reading stats error:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: 'Internal server error',
    } as ApiResponse;
  }
} 