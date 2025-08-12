import { Router } from 'oak';
import { authMiddleware } from '../middleware/auth.ts';
import {
  useCoupon,
  getCouponDetails,
  getUserCoupons
} from '../controllers/coupon.ts';

const router = new Router();

// Public route - get coupon details (no auth required)
router.get('/details', getCouponDetails);

// Protected routes - require authentication
router.use(authMiddleware);

// Use a coupon to sponsor fiction
router.post('/use', useCoupon);

// Get user's used coupons
router.get('/user', getUserCoupons);

export default router;
