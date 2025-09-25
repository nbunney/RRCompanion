import { Router } from 'oak';
import { getRisingStars, getLatestRisingStars, getTopRisingStars, getRisingStarsForFiction, getFictionDateRange } from '../controllers/risingStars.ts';
import { authMiddleware } from '../middleware/auth.ts';

const router = new Router();

// Get rising stars data (with optional genre and date filters)
router.get('/rising-stars', authMiddleware, getRisingStars);

// Get date range when a specific fiction appears in rankings
router.get('/rising-stars/fiction-date-range', authMiddleware, getFictionDateRange);

// Get latest rising stars data for all genres
router.get('/rising-stars/latest', authMiddleware, getLatestRisingStars);

// Get top 5 Rising Stars across all genres
router.get('/rising-stars/top', getTopRisingStars);

// Get rising stars data for a specific fiction
router.get('/rising-stars/fiction/:fictionId', getRisingStarsForFiction);

export { router as risingStarsRoutes }; 