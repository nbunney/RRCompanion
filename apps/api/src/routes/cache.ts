import { Router } from 'oak';
import { getCacheStats, clearCache, clearSpecificCache } from '../controllers/cache.ts';
import { adminMiddleware } from '../middleware/admin.ts';

const router = new Router();

// Get cache statistics (admin only)
router.get('/cache/stats', adminMiddleware, getCacheStats);

// Clear all cache (admin only)
router.delete('/cache', adminMiddleware, clearCache);

// Clear specific cache key (admin only)
router.delete('/cache/:key', adminMiddleware, clearSpecificCache);

export default router;
