import { Router } from 'oak';
import { adminMiddleware } from '../middleware/admin.ts';
import {
  getSiteStatistics,
  generateCouponCodes,
  getCouponCodes,
  deactivateCouponCode
} from '../controllers/admin.ts';

const router = new Router();

// All admin routes require admin middleware
router.use(adminMiddleware);

// Site statistics
router.get('/statistics', getSiteStatistics);

// Coupon code management
router.post('/coupons/generate', generateCouponCodes);
router.get('/coupons', getCouponCodes);
router.post('/coupons/deactivate', deactivateCouponCode);

export default router;
