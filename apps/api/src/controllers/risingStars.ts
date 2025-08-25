import { Context } from 'oak';
import { RisingStarsService } from '../services/risingStars.ts';

const risingStarsService = new RisingStarsService();

// Get rising stars data
export async function getRisingStars(ctx: Context) {
  try {
    const url = new URL(ctx.request.url);
    const genre = url.searchParams.get('genre') || undefined;
    const startDateStr = url.searchParams.get('startDate');
    const endDateStr = url.searchParams.get('endDate');

    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (startDateStr) {
      // Create UTC date for start of day
      startDate = new Date(startDateStr + 'T00:00:00.000Z');
    }

    if (endDateStr) {
      // Create UTC date for end of day to include all data for that date
      endDate = new Date(endDateStr + 'T23:59:59.999Z');
    }

    console.log('🔍 Rising Stars API - Date conversion:', {
      startDateStr,
      endDateStr,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
      startDateLocal: startDate?.toString(),
      endDateLocal: endDate?.toString()
    });

    const data = await risingStarsService.getRisingStarsData(genre, startDate, endDate);

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error('❌ Error getting rising stars:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: 'Failed to get rising stars data',
    };
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