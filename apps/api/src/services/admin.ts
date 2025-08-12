import { client } from '../config/database.ts';

export class AdminService {
  // Get site statistics
  async getSiteStatistics() {
    try {
      // Get user count
      const userCountResult = await client.query('SELECT COUNT(*) as count FROM users');
      const userCount = userCountResult[0]?.count || 0;

      // Get fiction count
      const fictionCountResult = await client.query('SELECT COUNT(*) as count FROM fiction');
      const fictionCount = fictionCountResult[0]?.count || 0;

      // Get sponsored fiction count
      const sponsoredCountResult = await client.query('SELECT COUNT(*) as count FROM fiction WHERE sponsored = 1');
      const sponsoredCount = sponsoredCountResult[0]?.count || 0;

      // Get total sponsorship payments
      const sponsorshipResult = await client.query('SELECT COUNT(*) as count, SUM(amount) as total FROM sponsorship_logs WHERE status = "completed"');
      const sponsorshipCount = sponsorshipResult[0]?.count || 0;
      const sponsorshipTotal = sponsorshipResult[0]?.total || 0;

      // Get recent activity (last 7 days)
      const recentActivityResult = await client.query(`
        SELECT 
          COUNT(DISTINCT f.id) as new_fictions,
          COUNT(DISTINCT uf.user_id) as active_users
        FROM fiction f
        LEFT JOIN userFictionOrder uf ON f.id = uf.fiction_id
        WHERE f.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        OR uf.updated_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      `);
      const newFictions = recentActivityResult[0]?.new_fictions || 0;
      const activeUsers = recentActivityResult[0]?.active_users || 0;

      return {
        users: {
          total: userCount,
          active: activeUsers
        },
        fiction: {
          total: fictionCount,
          sponsored: sponsoredCount,
          unsponsored: fictionCount - sponsoredCount
        },
        sponsorships: {
          count: sponsorshipCount,
          total_revenue: sponsorshipTotal / 100, // Convert from cents to dollars
          average_per_day: sponsorshipCount / 30 // Rough average over 30 days
        },
        recent_activity: {
          new_fictions: newFictions,
          active_users: activeUsers
        }
      };
    } catch (error) {
      console.error('❌ Error getting site statistics:', error);
      throw error;
    }
  }

  // Generate coupon codes
  async generateCouponCodes(count: number = 1, expiresInDays: number = 30) {
    try {
      const coupons = [];
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + expiresInDays);

      for (let i = 0; i < count; i++) {
        const code = this.generateRandomCode();
        const expiresAt = expirationDate.toISOString();

        // Insert coupon into database - always 100% discount for free sponsorship
        await client.execute(
          'INSERT INTO coupon_codes (code, discount_percent, expires_at, created_at) VALUES (?, ?, ?, NOW())',
          [code, 100, expirationDate.toISOString().slice(0, 19).replace('T', ' ')]
        );

        coupons.push({
          code,
          discount_percent: 100,
          expires_at: expiresAt
        });
      }

      return coupons;
    } catch (error) {
      console.error('❌ Error generating coupon codes:', error);
      throw error;
    }
  }

  // Generate random coupon code
  private generateRandomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Get existing coupon codes
  async getCouponCodes() {
    try {
      const result = await client.query(`
        SELECT 
          id, 
          code, 
          discount_percent, 
          expires_at, 
          created_at,
          used,
          used_by_user_id,
          used_for_fiction_id,
          used_at,
          is_active
        FROM coupon_codes 
        ORDER BY created_at DESC
      `);
      return result;
    } catch (error) {
      console.error('❌ Error getting coupon codes:', error);
      throw error;
    }
  }

  // Deactivate coupon code
  async deactivateCouponCode(couponId: number) {
    try {
      await client.execute(
        'UPDATE coupon_codes SET is_active = 0 WHERE id = ?',
        [couponId]
      );
      return true;
    } catch (error) {
      console.error('❌ Error deactivating coupon code:', error);
      throw error;
    }
  }
}

export const adminService = new AdminService();
