import { Router } from 'oak';
import { getRisingStars, getLatestRisingStars, getRisingStarsForFiction } from '../controllers/risingStars.ts';
import { authMiddleware } from '../middleware/auth.ts';

const router = new Router();

// Get rising stars data (with optional genre and date filters)
router.get('/rising-stars', authMiddleware, getRisingStars);

// Get latest rising stars data for all genres
router.get('/rising-stars/latest', authMiddleware, getLatestRisingStars);

// Get rising stars data for a specific fiction
router.get('/rising-stars/fiction/:fictionId', authMiddleware, getRisingStarsForFiction);

export { router as risingStarsRoutes }; 