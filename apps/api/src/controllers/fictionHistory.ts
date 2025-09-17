import { Context } from 'oak';
import { FictionHistoryService } from '../services/fictionHistory.ts';

const fictionHistoryService = new FictionHistoryService();

// Get fiction history data
export async function getFictionHistory(ctx: Context) {
  try {
    const url = new URL(ctx.request.url);
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

    const data = await fictionHistoryService.getFictionHistoryData(
      startDate?.toISOString() || new Date().toISOString(),
      endDate?.toISOString() || new Date().toISOString()
    );

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error('❌ Error getting fiction history:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: 'Failed to get fiction history data',
    };
  }
}

// Trigger fiction history collection manually
export async function triggerFictionHistoryCollection(ctx: Context) {
  try {
    console.log('🔧 Manual fiction history collection triggered');

    const success = await fictionHistoryService.runNightlyCollection();

    if (success) {
      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        message: 'Fiction history collection completed successfully',
      };
    } else {
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        message: 'Fiction history collection failed',
      };
    }
  } catch (error) {
    console.error('❌ Error triggering fiction history collection:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: 'Failed to trigger fiction history collection',
    };
  }
} 