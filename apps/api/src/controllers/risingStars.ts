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
      startDate = new Date(startDateStr);
    }

    if (endDateStr) {
      endDate = new Date(endDateStr);
    }

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