import { Context } from 'oak';
import { RoyalRoadService } from '../services/royalroad.ts';
import type { ApiResponse } from '../types/index.ts';

const royalroadService = new RoyalRoadService();

// Get popular fictions
export async function getPopularFictions(ctx: Context): Promise<void> {
  try {
    const response = await royalroadService.getPopularFictions();

    ctx.response.status = response.success ? 200 : 500;
    ctx.response.body = {
      success: response.success,
      data: response.data,
      message: response.message,
    } as ApiResponse;
  } catch (error) {
    console.error('Get popular fictions error:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: 'Failed to fetch popular fictions',
    } as ApiResponse;
  }
}

// Get fiction by ID
export async function getFiction(ctx: Context): Promise<void> {
  try {
    const id = (ctx as any).params?.id;
    if (!id) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: 'Fiction ID is required',
      } as ApiResponse;
      return;
    }

    const response = await royalroadService.getFiction(id);

    ctx.response.status = response.success ? 200 : 404;
    ctx.response.body = {
      success: response.success,
      data: response.data,
      message: response.message,
    } as ApiResponse;
  } catch (error) {
    console.error('Get fiction error:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: 'Failed to fetch fiction',
    } as ApiResponse;
  }
}

// Add fiction by URL
export async function addFictionByUrl(ctx: Context): Promise<void> {
  try {
    console.log('🚀 AddFictionByUrl controller - Starting request processing');

    // Read URL from request body
    const body = await ctx.request.body.json();
    const url = body?.url;
    console.log('🚀 AddFictionByUrl controller - URL from request body:', url);

    if (!url) {
      console.log('🚀 AddFictionByUrl controller - No URL provided, returning 400');
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: 'Royal Road URL is required in request body',
      } as ApiResponse;
      return;
    }

    // Get user from auth middleware
    const user = ctx.state.user;
    console.log('🔐 AddFictionByUrl controller - User from ctx.state:', user ? `ID: ${user.id}, Email: ${user.email}` : 'NOT FOUND');

    if (!user) {
      console.log('🔐 AddFictionByUrl controller - No user found, returning 401');
      ctx.response.status = 401;
      ctx.response.body = {
        success: false,
        error: 'Authentication required',
      } as ApiResponse;
      return;
    }

    console.log('🚀 AddFictionByUrl controller - Calling royalroadService.addFictionByUrl');
    const response = await royalroadService.addFictionByUrl(url);
    console.log('🚀 AddFictionByUrl controller - RoyalRoad service response:', response.success ? 'SUCCESS' : 'FAILED');

    if (response.success && response.data) {
      console.log('🚀 AddFictionByUrl controller - RoyalRoad data received, processing database operations');

      // Import the fiction and userFiction services
      const { FictionService } = await import('../services/fiction.ts');
      const { UserFictionService } = await import('../services/userFiction.ts');
      const { FictionHistoryService } = await import('../services/fictionHistory.ts');
      console.log('🚀 AddFictionByUrl controller - Services imported successfully');

      try {
        // Check if fiction already exists in our database
        console.log('🚀 AddFictionByUrl controller - Checking if fiction exists in database:', response.data.id);
        let fiction = await FictionService.getFictionByRoyalRoadId(response.data.id);

        if (!fiction) {
          console.log('📚 Creating new fiction in database:', response.data.title);

          // Clean string data before database insertion
          const cleanString = (str: any): string | undefined => {
            if (!str || typeof str !== 'string') return undefined;
            const cleaned = str
              .replace(/\0/g, '') // Remove null bytes
              .replace(/\x1a/g, '') // Remove SUB character
              .replace(/\x1b/g, '') // Remove ESC character
              .replace(/\x1c/g, '') // Remove FS character
              .replace(/\x1d/g, '') // Remove GS character
              .replace(/\x1e/g, '') // Remove RS character
              .replace(/\x1f/g, '') // Remove US character
              .replace(/\x7f/g, '') // Remove DEL character
              .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove all control characters
              .trim();
            return cleaned || undefined;
          };

          // Create the fiction in our database
          const fictionData = {
            royalroad_id: response.data.id,
            title: cleanString(response.data.title) || '',
            author_name: cleanString(response.data.author.name) || '',
            author_id: response.data.author.id,
            author_avatar: cleanString(response.data.author.avatar),
            description: response.data.description ? cleanString(response.data.description) : undefined,
            image_url: cleanString(response.data.image),
            status: cleanString(response.data.status),
            type: cleanString(response.data.type),
            tags: response.data.tags || undefined,
            warnings: response.data.warnings || undefined,
            pages: response.data.stats.pages || 0,
            ratings: response.data.stats.ratings || 0,
            followers: response.data.stats.followers || 0,
            favorites: response.data.stats.favorites || 0,
            views: response.data.stats.views || 0,
            score: response.data.stats.score || 0,
            overall_score: response.data.stats.overall_score || response.data.stats.score || 0,
            style_score: response.data.stats.style_score || 0,
            story_score: response.data.stats.story_score || 0,
            grammar_score: response.data.stats.grammar_score || 0,
            character_score: response.data.stats.character_score || 0,
            total_views: response.data.stats.total_views || response.data.stats.views || 0,
            average_views: response.data.stats.average_views || response.data.stats.views || 0,
          };

          console.log('📚 Fiction data prepared, calling FictionService.createFiction');
          console.log('📚 Fiction data details:', {
            title: fictionData.title,
            author_name: fictionData.author_name,
            description_length: fictionData.description?.length || 0,
            tags: fictionData.tags,
            warnings: fictionData.warnings
          });
          fiction = await FictionService.createFiction(fictionData);
          console.log('📚 Fiction created successfully:', fiction.id);
        } else {
          console.log('📚 Fiction already exists in database:', fiction.id);
        }

        // Add fiction to history table (if not already added today)
        try {
          console.log('📊 Adding fiction to history table:', fiction.id);
          const fictionHistoryService = new FictionHistoryService();
          await fictionHistoryService.saveFictionToHistory(
            fiction.id,
            response.data.id,
            {
              description: response.data.description,
              status: response.data.status,
              type: response.data.type,
              tags: response.data.tags,
              warnings: response.data.warnings,
              pages: response.data.stats.pages || 0,
              ratings: response.data.stats.ratings || 0,
              followers: response.data.stats.followers || 0,
              favorites: response.data.stats.favorites || 0,
              views: response.data.stats.views || 0,
              score: response.data.stats.score || 0,
              overall_score: response.data.stats.overall_score || 0,
              style_score: response.data.stats.style_score || 0,
              story_score: response.data.stats.story_score || 0,
              grammar_score: response.data.stats.grammar_score || 0,
              character_score: response.data.stats.character_score || 0,
              total_views: response.data.stats.total_views || 0,
              average_views: response.data.stats.average_views || 0,
            }
          );
          console.log('📊 Fiction history entry created/updated successfully');
        } catch (historyError) {
          console.error('⚠️ Warning: Failed to save fiction to history table:', historyError);
          // Don't fail the entire request if history saving fails
        }

        // Check if user already has this fiction
        console.log('📚 Checking if user already has this fiction:', user.id, fiction.id);
        const existingUserFiction = await UserFictionService.getUserFictionByUserAndFiction(user.id, fiction.id);

        if (!existingUserFiction) {
          console.log('📚 Adding fiction to user collection:', user.id, fiction.id);
          // Add fiction to user's collection
          console.log('📚 Calling UserFictionService.createUserFiction');
          await UserFictionService.createUserFiction(user.id, {
            fiction_id: fiction.id,
            status: 'plan_to_read',
            is_favorite: true, // Automatically mark as favorite when added
          });
          console.log('📚 Fiction added to user collection successfully');
        } else {
          console.log('📚 User already has this fiction in collection');
        }

        ctx.response.status = 200;
        ctx.response.body = {
          success: true,
          data: response.data,
          message: `Successfully added "${response.data.title}" to your collection!`,
        } as ApiResponse;
      } catch (dbError) {
        console.error('📚 Database error details:', dbError);
        console.error('📚 Database error stack:', dbError instanceof Error ? dbError.stack : 'No stack trace');
        ctx.response.status = 500;
        ctx.response.body = {
          success: false,
          error: 'Failed to save fiction to database',
        } as ApiResponse;
      }
    } else {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        data: response.data,
        message: response.message,
      } as ApiResponse;
    }
  } catch (error) {
    console.error('🚀 AddFictionByUrl controller - Top level error:', error);
    console.error('🚀 AddFictionByUrl controller - Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: 'Failed to add fiction',
    } as ApiResponse;
  }
}

// Get user profile
export async function getUserProfile(ctx: Context): Promise<void> {
  try {
    const username = (ctx as any).params?.username;
    if (!username) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: 'Username is required',
      } as ApiResponse;
      return;
    }

    const response = await royalroadService.getUserProfile(username);

    ctx.response.status = response.success ? 200 : 404;
    ctx.response.body = {
      success: response.success,
      data: response.data,
      message: response.message,
    } as ApiResponse;
  } catch (error) {
    console.error('Get user profile error:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: 'Failed to fetch user profile',
    } as ApiResponse;
  }
}
