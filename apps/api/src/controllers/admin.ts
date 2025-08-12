import { Context } from 'oak';
import { adminService } from '../services/admin.ts';

export async function getSiteStatistics(ctx: Context) {
  try {
    const stats = await adminService.getSiteStatistics();

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: stats
    };
  } catch (error) {
    console.error('❌ Error getting site statistics:', error);
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      error: 'Failed to get site statistics'
    };
  }
}

export async function generateCouponCodes(ctx: Context) {
  try {
    const body = await ctx.request.body.json();
    const { count = 1, expiresInDays = 30 } = body;

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

    const coupons = await adminService.generateCouponCodes(count, expiresInDays);

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: {
        message: `Generated ${count} coupon code(s)`,
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
