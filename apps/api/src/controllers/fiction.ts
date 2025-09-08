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

// Check if fiction exists by RoyalRoad ID (public endpoint)
export async function checkFictionExists(ctx: Context): Promise<void> {
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

    const exists = await FictionService.checkFictionExists(royalroadId);

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: {
        exists,
        royalroadId,
      },
    } as ApiResponse;
  } catch (error) {
    console.error('Check fiction exists error:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: 'Internal server error',
    } as ApiResponse;
  }
}

// Get fiction by RoyalRoad ID
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

    // Get fiction history
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

// Download CSV data for fiction
export async function downloadFictionHistoryCSV(ctx: Context): Promise<void> {
  try {
    const fictionId = parseInt((ctx as any).params?.id);
    const userId = ctx.state.user?.id;

    if (!fictionId || isNaN(fictionId)) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: 'Valid fiction ID is required',
      } as ApiResponse;
      return;
    }

    if (!userId) {
      ctx.response.status = 401;
      ctx.response.body = {
        success: false,
        error: 'Unauthorized',
      } as ApiResponse;
      return;
    }

    // Anyone can download data for any fiction
    const fiction = await FictionService.getFictionById(fictionId);
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
    const historyData = await fictionHistoryService.getFictionHistoryByFictionId(fictionId);

    // Get rising stars data for this fiction
    const risingStarsData = await getRisingStarsData(fictionId);

    // Generate both CSV contents
    const historyCSV = generateFictionHistoryCSV(historyData, fiction.title);
    const risingStarsCSV = generateRisingStarsCSV(risingStarsData, fiction.title);

    // Create ZIP file containing both CSVs
    const zipContent = await createZipFile(historyCSV, risingStarsCSV, fiction.title);

    // Set response headers for ZIP download
    const now = new Date();
    const dateTime = now.toISOString().replace(/[:.]/g, '-').slice(0, 19); // Format: YYYY-MM-DDTHH-MM-SS
    const filename = `${fiction.title.replace(/[^a-zA-Z0-9]/g, '_')}_data_${dateTime}.zip`;

    ctx.response.headers.set('Content-Type', 'application/zip');
    ctx.response.headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    ctx.response.headers.set('Cache-Control', 'no-cache');

    ctx.response.status = 200;
    ctx.response.body = zipContent;
  } catch (error) {
    console.error('Download fiction history CSV error:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: 'Failed to generate CSV',
    } as ApiResponse;
  }
}

// Helper function to get rising stars data for a fiction
async function getRisingStarsData(fictionId: number): Promise<any[]> {
  try {
    const { client } = await import('../config/database.ts');
    const result = await client.query(`
      SELECT captured_at, genre, position 
      FROM risingStars 
      WHERE fiction_id = ? 
      ORDER BY captured_at DESC
    `, [fictionId]);

    return result;
  } catch (error) {
    console.error('Error getting rising stars data:', error);
    return [];
  }
}

// Helper function to generate rising stars CSV content
function generateRisingStarsCSV(risingStarsData: any[], fictionTitle: string): string {
  if (!risingStarsData || risingStarsData.length === 0) {
    return 'No rising stars data available';
  }

  // Define CSV headers
  const headers = ['captured_at', 'genre', 'position'];

  // Create CSV header row
  let csv = headers.join(',') + '\n';

  // Add data rows
  risingStarsData.forEach(entry => {
    const row = headers.map(header => {
      let value = entry[header];

      // Handle different data types
      if (value === null || value === undefined) {
        value = '';
      } else if (typeof value === 'string' && value.includes(',')) {
        // Escape strings containing commas
        value = `"${value.replace(/"/g, '""')}"`;
      }

      return value;
    });

    csv += row.join(',') + '\n';
  });

  return csv;
}

// Helper function to create ZIP file containing both CSVs
async function createZipFile(historyCSV: string, risingStarsCSV: string, fictionTitle: string): Promise<Uint8Array> {
  try {
    // Import JSZip for creating ZIP files
    const JSZip = await import('https://esm.sh/jszip@3.10.1');
    const zip = new JSZip.default();

    // Generate timestamp for filenames
    const now = new Date();
    const dateTime = now.toISOString().replace(/[:.]/g, '-').slice(0, 19); // Format: YYYY-MM-DDTHH-MM-SS

    // Sanitize fiction title for filenames
    const sanitizedTitle = fictionTitle.replace(/[^a-zA-Z0-9]/g, '_');

    // Add both CSV files to the ZIP with timestamps
    zip.file(`${sanitizedTitle}_fiction_history_${dateTime}.csv`, historyCSV);
    zip.file(`${sanitizedTitle}_rising_stars_${dateTime}.csv`, risingStarsCSV);

    // Generate ZIP file
    const zipContent = await zip.generateAsync({ type: 'uint8array' });
    return zipContent;
  } catch (error) {
    console.error('Error creating ZIP file:', error);
    throw new Error('Failed to create ZIP file');
  }
}

// Helper function to generate CSV content
function generateFictionHistoryCSV(historyData: any[], fictionTitle: string): string {
  if (!historyData || historyData.length === 0) {
    return 'No data available';
  }

  // Define CSV headers - exclude unwanted columns and put captured_at first
  const excludedColumns = ['id', 'fiction_id', 'genre', 'views'];
  const allHeaders = Object.keys(historyData[0]);

  // Put captured_at first, then other columns (excluding unwanted ones)
  const headers = ['captured_at', ...allHeaders.filter(key =>
    !excludedColumns.includes(key) && key !== 'captured_at'
  )];

  // Create CSV header row
  let csv = headers.join(',') + '\n';

  // Add data rows
  historyData.forEach(entry => {
    const row = headers.map(header => {
      let value = entry[header];

      // Handle different data types
      if (value === null || value === undefined) {
        value = '';
      } else if (typeof value === 'object') {
        // Handle JSON fields like tags, warnings
        value = JSON.stringify(value);
      } else if (typeof value === 'string' && value.includes(',')) {
        // Escape strings containing commas
        value = `"${value.replace(/"/g, '""')}"`;
      }

      return value;
    });

    csv += row.join(',') + '\n';
  });

  return csv;
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
    };
  } catch (error) {
    console.error('Get popular fictions error:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: 'Failed to get popular fictions',
    };
  }
}

// Get popular fictions by site users (most entries in userFiction table)
export async function getPopularFictionsBySiteUsers(ctx: Context): Promise<void> {
  try {
    const url = new URL(ctx.request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');

    const fictions = await FictionService.getPopularFictionsBySiteUsers(limit);

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: fictions,
    };
  } catch (error) {
    console.error('Get popular fictions by site users error:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: 'Failed to get popular fictions by site users',
    };
  }
}

// Get cache stats for debugging
export async function getCacheStats(ctx: Context): Promise<void> {
  try {
    const { cacheService } = await import('../services/cache.ts');
    const stats = cacheService.getStats();

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: stats,
    };
  } catch (error) {
    console.error('Get cache stats error:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: 'Failed to get cache stats',
    };
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