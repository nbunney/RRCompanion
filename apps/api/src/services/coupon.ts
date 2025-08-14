import { client } from '../config/database.ts';
import type { CouponCode } from '../types/index.ts';

export class CouponService {
  // Validate and use a coupon code
  async useCoupon(code: string, userId: number, fictionId: number): Promise<{ success: boolean; error?: string; coupon?: CouponCode }> {
    try {
      console.log('🔐 CouponService.useCoupon - Starting with:', { code, userId, fictionId });

      // Check if coupon exists and is valid
      const couponResult = await client.query(
        'SELECT * FROM coupon_codes WHERE code = ? AND is_active = 1',
        [code]
      );
      console.log('🔐 CouponService.useCoupon - Coupon query result:', couponResult);

      if (couponResult.length === 0) {
        console.log('❌ CouponService.useCoupon - No coupon found with code:', code);
        return { success: false, error: 'Invalid coupon code' };
      }

      const coupon = couponResult[0];
      console.log('🔐 CouponService.useCoupon - Found coupon:', {
        id: coupon.id,
        max_uses: coupon.max_uses,
        current_uses: coupon.current_uses,
        expires_at: coupon.expires_at
      });

      // Check if coupon has reached its usage limit
      if (coupon.current_uses >= coupon.max_uses) {
        console.log('❌ CouponService.useCoupon - Coupon usage limit reached');
        return { success: false, error: 'Coupon code usage limit has been reached' };
      }

      // Check if coupon has expired
      if (new Date(coupon.expires_at) < new Date()) {
        console.log('❌ CouponService.useCoupon - Coupon expired:', coupon.expires_at);
        return { success: false, error: 'Coupon code has expired' };
      }

      // Check if fiction is already sponsored
      const fictionResult = await client.query(
        'SELECT sponsored FROM fiction WHERE id = ?',
        [fictionId]
      );
      console.log('🔐 CouponService.useCoupon - Fiction query result:', fictionResult);

      if (fictionResult.length === 0) {
        console.log('❌ CouponService.useCoupon - Fiction not found with ID:', fictionId);
        return { success: false, error: 'Fiction not found' };
      }

      if (fictionResult[0].sponsored === 1) {
        console.log('❌ CouponService.useCoupon - Fiction already sponsored');
        return { success: false, error: 'Fiction is already sponsored' };
      }

      console.log('🔐 CouponService.useCoupon - All checks passed, proceeding with coupon usage...');

      // Increment the usage count and mark as used if it's the last use
      const newCurrentUses = coupon.current_uses + 1;
      const isFullyUsed = newCurrentUses >= coupon.max_uses;

      await client.execute(
        `UPDATE coupon_codes 
         SET current_uses = ?, 
             used = ?, 
             used_by_user_id = ?, 
             used_for_fiction_id = ?, 
             used_at = NOW() 
         WHERE id = ?`,
        [newCurrentUses, isFullyUsed ? 1 : 0, userId, fictionId, coupon.id]
      );

      // Mark fiction as sponsored
      await client.execute(
        'UPDATE fiction SET sponsored = 1 WHERE id = ?',
        [fictionId]
      );

      // Log the sponsorship (similar to Stripe payment)
      await client.execute(
        'INSERT INTO sponsorship_logs (fiction_id, user_id, coupon_code_id, amount, status, stripe_payment_intent_id, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
        [
          fictionId,
          userId,
          coupon.id,
          0, // $0 since it's free
          'completed',
          null // No Stripe payment intent for coupon usage
        ]
      );

      console.log('✅ CouponService.useCoupon - Coupon used successfully');
      return { success: true, coupon: { ...coupon, current_uses: newCurrentUses, used: isFullyUsed } };
    } catch (error) {
      console.error('❌ Error using coupon:', error);
      return { success: false, error: 'Failed to use coupon' };
    }
  }

  // Get coupon details by code
  async getCouponByCode(code: string): Promise<CouponCode | null> {
    try {
      const result = await client.query(
        'SELECT * FROM coupon_codes WHERE code = ?',
        [code]
      );
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('❌ Error getting coupon:', error);
      return null;
    }
  }

  // Get all coupons for a user
  async getUserCoupons(userId: number): Promise<CouponCode[]> {
    try {
      const result = await client.query(
        'SELECT * FROM coupon_codes WHERE used_by_user_id = ? ORDER BY used_at DESC',
        [userId]
      );
      return result;
    } catch (error) {
      console.error('❌ Error getting user coupons:', error);
      return [];
    }
  }

  // Get all active coupons
  async getActiveCoupons(): Promise<CouponCode[]> {
    try {
      const result = await client.query(
        `SELECT * FROM coupon_codes 
         WHERE is_active = 1 
         AND current_uses < max_uses 
         AND expires_at > NOW()
         ORDER BY created_at DESC`
      );
      return result;
    } catch (error) {
      console.error('❌ Error getting active coupons:', error);
      return [];
    }
  }

  // Get coupon usage statistics
  async getCouponStats(): Promise<{ total: number; active: number; expired: number; fully_used: number }> {
    try {
      const result = await client.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN is_active = 1 AND current_uses < max_uses AND expires_at > NOW() THEN 1 END) as active,
          COUNT(CASE WHEN expires_at <= NOW() THEN 1 END) as expired,
          COUNT(CASE WHEN current_uses >= max_uses THEN 1 END) as fully_used
        FROM coupon_codes
      `);

      return result[0];
    } catch (error) {
      console.error('❌ Error getting coupon stats:', error);
      return { total: 0, active: 0, expired: 0, fully_used: 0 };
    }
  }
}

export const couponService = new CouponService();
