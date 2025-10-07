import { Router } from 'oak';
import {
  getSiteStatistics,
  getAllUsers,
  generateCouponCodes,
  getCouponCodes,
  getCouponStats,

  deactivateCouponCode,
  convertTimestampsToUTC,
  triggerRisingStarsScrape,
  manualScrapeFiction,
  updateRisingStarsBestPositions,
  cleanupRisingStarsData
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
router.post('/trigger/rising-stars-scrape', triggerRisingStarsScrape);
router.post('/manual-scrape/:fictionId', manualScrapeFiction);

// Rising Stars best positions management
router.post('/rising-stars/update-best-positions', updateRisingStarsBestPositions);
router.post('/rising-stars/cleanup', cleanupRisingStarsData); // Add ?dryRun=false to actually delete

export default router;
