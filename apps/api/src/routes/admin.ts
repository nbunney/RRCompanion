import { Router } from 'oak';
import {
  getSiteStatistics,
  getAllUsers,
  generateCouponCodes,
  getCouponCodes,
  getCouponStats,
  deactivateCouponCode,
  convertTimestampsToUTC
} from '../controllers/admin.ts';
import { adminMiddleware } from '../middleware/admin.ts';

const router = new Router();

// All admin routes require admin authentication
router.use(adminMiddleware);

router.get('/statistics', getSiteStatistics);
router.get('/users', getAllUsers);
router.post('/coupons/generate', generateCouponCodes);
router.get('/coupons', getCouponCodes);
router.get('/coupons/stats', getCouponStats);
router.put('/coupons/:id/deactivate', deactivateCouponCode);
router.post('/migrate/timestamps-to-utc', convertTimestampsToUTC);

export default router;
