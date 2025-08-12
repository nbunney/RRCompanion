import { client } from '../config/database.ts';

export class CouponService {
  // Validate and use a coupon code
  async useCoupon(code: string, userId: number, fictionId: number): Promise<{ success: boolean; error?: string; coupon?: any }> {
    try {
      // Check if coupon exists and is valid
      const couponResult = await client.query(
        'SELECT * FROM coupon_codes WHERE code = ? AND is_active = 1',
        [code]
      );

      if (couponResult.length === 0) {
        return { success: false, error: 'Invalid coupon code' };
      }

      const coupon = couponResult[0];

      // Check if coupon is already used
      if (coupon.used) {
        return { success: false, error: 'Coupon code has already been used' };
      }

      // Check if coupon has expired
      if (new Date(coupon.expires_at) < new Date()) {
        return { success: false, error: 'Coupon code has expired' };
      }

      // Check if fiction is already sponsored
      const fictionResult = await client.query(
        'SELECT sponsored FROM fiction WHERE id = ?',
        [fictionId]
      );

      if (fictionResult.length === 0) {
        return { success: false, error: 'Fiction not found' };
      }

      if (fictionResult[0].sponsored === 1) {
        return { success: false, error: 'Fiction is already sponsored' };
      }

      // Use the coupon and sponsor the fiction
      await client.execute(
        'UPDATE coupon_codes SET used = 1, used_by_user_id = ?, used_for_fiction_id = ?, used_at = NOW() WHERE id = ?',
        [userId, fictionId, coupon.id]
      );

      // Mark fiction as sponsored
      await client.execute(
        'UPDATE fiction SET sponsored = 1 WHERE id = ?',
        [fictionId]
      );

      // Log the sponsorship (similar to Stripe payment)
      await client.execute(
        'INSERT INTO sponsorship_logs (fiction_id, user_id, coupon_code_id, amount, status, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
        [
          fictionId,
          userId,
          coupon.id,
          0, // $0 since it's free
          'completed'
        ]
      );

      return { success: true, coupon };
    } catch (error) {
      console.error('❌ Error using coupon:', error);
      return { success: false, error: 'Failed to use coupon' };
    }
  }

  // Get coupon details by code
  async getCouponByCode(code: string): Promise<any> {
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
  async getUserCoupons(userId: number): Promise<any[]> {
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
}

export const couponService = new CouponService();
