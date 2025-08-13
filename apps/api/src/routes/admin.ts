import { Router } from 'oak';
import { adminMiddleware } from '../middleware/admin.ts';
import {
  getSiteStatistics,
  generateCouponCodes,
  getCouponCodes,
  deactivateCouponCode,
  getAllUsers,
} from '../controllers/admin.ts';

const router = new Router();

// All admin routes require admin authentication
router.use(adminMiddleware);

// Site statistics
router.get('/statistics', getSiteStatistics);

// Coupon management
router.post('/coupons/generate', generateCouponCodes);
router.get('/coupons', getCouponCodes);
router.post('/coupons/deactivate', deactivateCouponCode);

// User management
router.get('/users', getAllUsers);

export default router;
