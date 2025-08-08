import { Router } from 'oak';
import {
  getUserFictions,
  getUserFictionsByStatus,
  getUserFavorites,
  createUserFiction,
  updateUserFiction,
  deleteUserFiction,
  toggleFavorite,
  updateReadingProgress,
  getUserReadingStats,
} from '../controllers/userFiction.ts';
import { authMiddleware } from '../middleware/auth.ts';

const router = new Router();

// UserFiction routes - all require authentication
router.get('/userFictions', authMiddleware, getUserFictions);
router.get('/userFictions/status/:status', authMiddleware, getUserFictionsByStatus);
router.get('/userFictions/favorites', authMiddleware, getUserFavorites);
router.get('/userFictions/stats', authMiddleware, getUserReadingStats);
router.post('/userFictions', authMiddleware, createUserFiction);
router.put('/userFictions/:fictionId', authMiddleware, updateUserFiction);
router.delete('/userFictions/:fictionId', authMiddleware, deleteUserFiction);
router.post('/userFictions/:fictionId/favorite', authMiddleware, toggleFavorite);
router.put('/userFictions/:fictionId/progress', authMiddleware, updateReadingProgress);

export default router; 