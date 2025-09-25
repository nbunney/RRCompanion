import { Router } from 'oak';
import {
  getFictions,
  getFictionByRoyalRoadId,
  checkFictionExists,
  searchFictions,
  getFictionsByAuthor,
  getTopFictions,
  getPopularFictions,
  getPopularFictionsBySiteUsers,
  createFiction,
  updateFiction,
  deleteFiction,
  downloadFictionHistoryCSV,
  refreshFiction,
  getCacheStats
} from '../controllers/fiction.ts';
import { authMiddleware } from '../middleware/auth.ts';

const router = new Router();

// Public routes
router.get('/fictions/popular', getPopularFictions);
router.get('/fictions/popular-by-users', getPopularFictionsBySiteUsers);
router.get('/fictions/top', getTopFictions);
router.get('/fictions/:id/exists', checkFictionExists);
router.get('/fictions/:id', getFictionByRoyalRoadId);
router.get('/cache/stats', getCacheStats);

// Protected routes (require authentication)
router.get('/fictions/:id/csv', authMiddleware, downloadFictionHistoryCSV);
router.post('/fictions', authMiddleware, createFiction);
router.put('/fictions/:id', authMiddleware, updateFiction);
router.delete('/fictions/:id', authMiddleware, deleteFiction);
router.post('/fictions/:id/refresh', authMiddleware, refreshFiction);

export default router; 