import { Router } from 'oak';
import {
  getFictions,
  getFictionByRoyalRoadId,
  createFiction,
  updateFiction,
  deleteFiction,
  searchFictions,
  getTopFictions,
  getPopularFictions,
  getFictionsByAuthor,
  refreshFiction,
} from '../controllers/fiction.ts';
import { authMiddleware } from '../middleware/auth.ts';

const router = new Router();

// Public routes


// Protected routes (require authentication)
router.get('/fictions/:id', authMiddleware, getFictionByRoyalRoadId);
router.post('/fictions', authMiddleware, createFiction);
router.put('/fictions/:id', authMiddleware, updateFiction);
router.delete('/fictions/:id', authMiddleware, deleteFiction);
router.post('/fictions/:id/refresh', authMiddleware, refreshFiction);

export default router; 