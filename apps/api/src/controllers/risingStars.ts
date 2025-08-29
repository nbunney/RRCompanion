import { Context } from 'oak';
import { RisingStarsService } from '../services/risingStars.ts';

const risingStarsService = new RisingStarsService();

// Get Rising Stars data for a specific date range
export async function getRisingStars(ctx: Context) {
  try {
    const url = new URL(ctx.request.url);
    const genre = url.searchParams.get('genre');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    if (!genre || !startDate || !endDate) {
      ctx.response.status = 400;
      ctx.response.body = { success: false, error: 'Genre, startDate, and endDate are required' };
      return;
    }

    // Convert dates to UTC and set endDate to end of day
    let startDateUTC: Date;
    let endDateUTC: Date;

    try {
      // Handle both date-only strings (YYYY-MM-DD) and full ISO strings
      if (startDate.includes('T')) {
        // Already a full ISO string
        startDateUTC = new Date(startDate);
      } else {
        // Date-only string, add time
        startDateUTC = new Date(startDate + 'T00:00:00.000Z');
      }

      if (endDate.includes('T')) {
        // Already a full ISO string
        endDateUTC = new Date(endDate);
      } else {
        // Date-only string, add time - use end of day by going to next day and subtracting 1ms
        const nextDay = new Date(endDate);
        nextDay.setDate(nextDay.getDate() + 1);
        nextDay.setHours(0, 0, 0, 0);
        endDateUTC = new Date(nextDay.getTime() - 1); // 1 millisecond before next day
      }

      // Validate dates
      if (isNaN(startDateUTC.getTime()) || isNaN(endDateUTC.getTime())) {
        throw new Error('Invalid date format');
      }

      console.log('🔍 Controller - Date parsing:', {
        originalStartDate: startDate,
        originalEndDate: endDate,
        parsedStartDate: startDateUTC.toISOString(),
        parsedEndDate: endDateUTC.toISOString(),
        startDateLocal: startDateUTC.toString(),
        endDateLocal: endDateUTC.toString()
      });
    } catch (dateError) {
      console.error('Date parsing error:', dateError);
      ctx.response.status = 400;
      ctx.response.body = { success: false, error: 'Invalid date format. Use YYYY-MM-DD or ISO format.' };
      return;
    }

    const data = await risingStarsService.getRisingStarsData(genre, startDateUTC, endDateUTC);
    ctx.response.body = { success: true, data };
  } catch (error) {
    console.error('Error getting Rising Stars data:', error);
    ctx.response.status = 500;
    ctx.response.body = { success: false, error: 'Failed to get Rising Stars data' };
  }
}

// Get date range when a specific fiction appears in rankings
export async function getFictionDateRange(ctx: Context) {
  try {
    const url = new URL(ctx.request.url);
    const fictionId = url.searchParams.get('fictionId');
    const genre = url.searchParams.get('genre');

    if (!fictionId || !genre) {
      ctx.response.status = 400;
      ctx.response.body = { success: false, error: 'fictionId and genre are required' };
      return;
    }

    const dateRange = await risingStarsService.getFictionDateRange(Number(fictionId), genre);
    ctx.response.body = { success: true, data: dateRange };
  } catch (error) {
    console.error('Error getting fiction date range:', error);
    ctx.response.status = 500;
    ctx.response.body = { success: false, error: 'Failed to get fiction date range' };
  }
}

// Get latest rising stars data for all genres
export async function getLatestRisingStars(ctx: Context) {
  try {
    const data = await risingStarsService.getLatestRisingStarsData();

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error('❌ Error getting latest rising stars:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: 'Failed to get latest rising stars data',
    };
  }
}

// Get top 5 Rising Stars across all genres
export async function getTopRisingStars(ctx: Context) {
  try {
    const url = new URL(ctx.request.url);
    const limit = parseInt(url.searchParams.get('limit') || '5');

    const data = await risingStarsService.getTopRisingStars(limit);

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error('❌ Error getting top rising stars:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: 'Failed to get top rising stars data',
    };
  }
}

// Get rising stars data for a specific fiction
export async function getRisingStarsForFiction(ctx: Context) {
  try {
    const fictionId = parseInt((ctx as any).params?.fictionId);
    if (!fictionId) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: 'Fiction ID is required',
      };
      return;
    }

    const data = await risingStarsService.getRisingStarsDataForFiction(fictionId);

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error('❌ Error getting rising stars for fiction:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: 'Failed to get rising stars data for fiction',
    };
  }
} 