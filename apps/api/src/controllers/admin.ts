import { Context } from 'oak';
import { adminService } from '../services/admin.ts';
import { client } from '../config/database.ts';
import { FictionHistoryService } from '../services/fictionHistory.ts';
import type { ApiResponse } from '../types/index.ts';

// Get site statistics
export async function getSiteStatistics(ctx: Context): Promise<void> {
  try {
    const stats = await adminService.getSiteStatistics();

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: stats,
    } as ApiResponse;
  } catch (error) {
    console.error('Get site statistics error:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: 'Failed to get site statistics',
    } as ApiResponse;
  }
}

// Get all users with statistics
export async function getAllUsers(ctx: Context): Promise<void> {
  try {
    const users = await adminService.getAllUsers();

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: users,
    } as ApiResponse;
  } catch (error) {
    console.error('Get all users error:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: 'Failed to get users',
    } as ApiResponse;
  }
}

export async function generateCouponCodes(ctx: Context) {
  try {
    const body = await ctx.request.body.json();
    const { count = 1, expiresInDays = 30, maxUses = 1 } = body;

    // Validate inputs
    if (count < 1 || count > 100) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: 'Count must be between 1 and 100'
      };
      return;
    }

    if (expiresInDays < 1 || expiresInDays > 365) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: 'Expiration days must be between 1 and 365'
      };
      return;
    }

    if (maxUses < 1 || maxUses > 1000) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: 'Max uses must be between 1 and 1000'
      };
      return;
    }

    const coupons = await adminService.generateCouponCodes(count, expiresInDays, maxUses);

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: {
        message: `Generated ${count} coupon code(s) with ${maxUses} use(s) each`,
        coupons
      }
    };
  } catch (error) {
    console.error('❌ Error generating coupon codes:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: 'Failed to generate coupon codes'
    };
  }
}

export async function getCouponCodes(ctx: Context) {
  try {
    const coupons = await adminService.getCouponCodes();

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: coupons
    };
  } catch (error) {
    console.error('❌ Error getting coupon codes:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: 'Failed to get coupon codes'
    };
  }
}

// Get coupon statistics
export async function getCouponStats(ctx: Context) {
  try {
    const { couponService } = await import('../services/coupon.ts');
    const stats = await couponService.getCouponStats();

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: stats
    };
  } catch (error) {
    console.error('❌ Error getting coupon stats:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: 'Failed to get coupon statistics'
    };
  }
}

export async function deactivateCouponCode(ctx: Context) {
  try {
    const body = await ctx.request.body.json();
    const { couponId } = body;

    if (!couponId) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        error: 'Coupon ID is required'
      };
      return;
    }

    await adminService.deactivateCouponCode(couponId);

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      message: 'Coupon code deactivated successfully'
    };
  } catch (error) {
    console.error('❌ Error deactivating coupon code:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: 'Failed to deactivate coupon code'
    };
  }
}

// Convert timestamps from local time to UTC
export async function convertTimestampsToUTC(ctx: Context): Promise<void> {
  try {
    console.log('🔄 Converting Rising Stars timestamps from local time to UTC...');

    // First, check current timestamps
    const beforeQuery = `
      SELECT fiction_id, genre, position, captured_at 
      FROM risingStars 
      ORDER BY captured_at DESC 
      LIMIT 3
    `;

    const beforeResults = await client.query(beforeQuery);
    console.log('📊 Current timestamps (before conversion):');
    beforeResults.forEach((row: any) => {
      console.log(`  Fiction ${row.fiction_id} - ${row.genre} pos ${row.position} - ${row.captured_at}`);
    });

    // Convert Rising Stars timestamps (add 7 hours to convert PDT to UTC)
    console.log('🔄 Converting Rising Stars timestamps...');
    const risingStarsUpdate = `
      UPDATE risingStars 
      SET captured_at = DATE_ADD(captured_at, INTERVAL 7 HOUR)
      WHERE captured_at IS NOT NULL
    `;

    const risingStarsResult = await client.execute(risingStarsUpdate);
    console.log(`✅ Updated ${risingStarsResult.affectedRows} Rising Stars records`);

    // Convert Fiction History timestamps
    console.log('🔄 Converting Fiction History timestamps...');
    const fictionHistoryUpdate = `
      UPDATE fictionHistory 
      SET captured_at = DATE_ADD(captured_at, INTERVAL 7 HOUR)
      WHERE captured_at IS NOT NULL
    `;

    const fictionHistoryResult = await client.execute(fictionHistoryUpdate);
    console.log(`✅ Updated ${fictionHistoryResult.affectedRows} Fiction History records`);

    // Verify the conversion
    const afterResults = await client.query(beforeQuery);
    console.log('📊 Converted timestamps (after conversion):');
    afterResults.forEach((row: any) => {
      console.log(`  Fiction ${row.fiction_id} - ${row.genre} pos ${row.position} - ${row.captured_at}`);
    });

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: {
        message: 'Successfully converted timestamps to UTC',
        risingStarsUpdated: risingStarsResult.affectedRows,
        fictionHistoryUpdated: fictionHistoryResult.affectedRows
      }
    } as ApiResponse;

  } catch (error) {
    console.error('❌ Error converting timestamps:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: 'Failed to convert timestamps to UTC'
    } as ApiResponse;
  }
}

// Rising Stars scraping has been moved to serverless functions
// Use the serverless scraping endpoints instead
export async function triggerRisingStarsScrape(ctx: Context): Promise<void> {
  ctx.response.status = 410; // Gone - functionality moved
  ctx.response.body = {
    success: false,
    error: 'Rising Stars scraping has been moved to serverless functions. Please use the serverless scraping endpoints.',
    migration: {
      newEndpoint: 'Use serverless scraping functions',
      documentation: 'See apps/scraping/README.md for details'
    }
  } as ApiResponse;
}

// Fiction scraping has been moved to serverless functions
// Use the serverless scraping endpoints instead
export async function manualScrapeFiction(ctx: Context): Promise<void> {
  ctx.response.status = 410; // Gone - functionality moved
  ctx.response.body = {
    success: false,
    error: 'Fiction scraping has been moved to serverless functions. Please use the serverless scraping endpoints.',
    migration: {
      newEndpoint: 'Use serverless scraping functions',
      documentation: 'See apps/scraping/README.md for details'
    }
  } as ApiResponse;
}
