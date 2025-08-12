import { Context } from 'oak';
import { couponService } from '../services/coupon.ts';
import { getUserFromContext } from '../utils/auth.ts';

export async function useCoupon(ctx: Context) {
  try {
    console.log('🔐 useCoupon - Starting coupon usage...');
    const user = await getUserFromContext(ctx);
    console.log('🔐 useCoupon - User loaded:', user ? { id: user.id, email: user.email } : 'null');

    if (!user) {
      console.log('❌ useCoupon - No user found, returning 401');
      ctx.response.status = 401;
      ctx.response.body = { success: false, error: 'Unauthorized' };
      return;
    }

    const body = await ctx.request.body.json();
    console.log('🔐 useCoupon - Request body:', body);
    const { code, fictionId } = body;

    if (!code || !fictionId) {
      console.log('❌ useCoupon - Missing required fields:', { code: !!code, fictionId: !!fictionId });
      ctx.response.status = 400;
      ctx.response.body = { success: false, error: 'Coupon code and fiction ID are required' };
      return;
    }

    console.log('🔐 useCoupon - Calling coupon service with:', { code, userId: user.id, fictionId });
    const result = await couponService.useCoupon(code, user.id, fictionId);
    console.log('🔐 useCoupon - Service result:', result);

    if (result.success) {
      console.log('🔐 useCoupon - Setting success response...');
      try {
        // Validate coupon object before sending in response
        const responseData = {
          success: true,
          message: 'Coupon used successfully! Fiction is now sponsored.',
          data: { 
            coupon: result.coupon ? {
              id: result.coupon.id,
              code: result.coupon.code,
              discount_percent: result.coupon.discount_percent,
              expires_at: result.coupon.expires_at,
              used: result.coupon.used,
              is_active: result.coupon.is_active
            } : null
          }
        };
        
        console.log('🔐 useCoupon - Response data prepared:', responseData);
        
        ctx.response.status = 200;
        ctx.response.body = responseData;
        console.log('🔐 useCoupon - Success response set successfully');
      } catch (responseError) {
        console.error('❌ useCoupon - Error setting success response:', responseError);
        ctx.response.status = 500;
        ctx.response.body = { success: false, error: 'Failed to set response' };
      }
    } else {
      console.log('🔐 useCoupon - Setting error response...');
      try {
        ctx.response.status = 400;
        ctx.response.body = { success: false, error: result.error };
        console.log('🔐 useCoupon - Error response set successfully');
      } catch (responseError) {
        console.error('❌ useCoupon - Error setting error response:', responseError);
        ctx.response.status = 500;
        ctx.response.body = { success: false, error: 'Failed to set error response' };
      }
    }
  } catch (error) {
    console.error('❌ Error using coupon:', error);
    ctx.response.status = 500;
    ctx.response.body = { success: false, error: 'Failed to use coupon' };
  }
}

export async function getCouponDetails(ctx: Context) {
  try {
    const url = new URL(ctx.request.url);
    const code = url.searchParams.get('code');

    if (!code) {
      ctx.response.status = 400;
      ctx.response.body = { success: false, error: 'Coupon code is required' };
      return;
    }

    const coupon = await couponService.getCouponByCode(code);

    if (!coupon) {
      ctx.response.status = 404;
      ctx.response.body = { success: false, error: 'Coupon not found' };
      return;
    }

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: {
        code: coupon.code,
        discount_percent: coupon.discount_percent,
        expires_at: coupon.expires_at,
        used: coupon.used,
        is_active: coupon.is_active
      }
    };
  } catch (error) {
    console.error('❌ Error getting coupon details:', error);
    ctx.response.status = 500;
    ctx.response.body = { success: false, error: 'Failed to get coupon details' };
  }
}

export async function getUserCoupons(ctx: Context) {
  try {
    const user = await getUserFromContext(ctx);
    if (!user) {
      ctx.response.status = 401;
      ctx.response.body = { success: false, error: 'Unauthorized' };
      return;
    }

    const coupons = await couponService.getUserCoupons(user.id);

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: coupons
    };
  } catch (error) {
    console.error('❌ Error getting user coupons:', error);
    ctx.response.status = 500;
    ctx.response.body = { success: false, error: 'Failed to get user coupons' };
  }
}
