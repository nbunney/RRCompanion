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

// All userFiction routes require authentication
router.use(authMiddleware);

// UserFiction routes
router.get('/userFictions', getUserFictions);
router.get('/userFictions/status/:status', getUserFictionsByStatus);
router.get('/userFictions/favorites', getUserFavorites);
router.get('/userFictions/stats', getUserReadingStats);
router.post('/userFictions', createUserFiction);
router.put('/userFictions/:fictionId', updateUserFiction);
router.delete('/userFictions/:fictionId', deleteUserFiction);
router.post('/userFictions/:fictionId/favorite', toggleFavorite);
router.put('/userFictions/:fictionId/progress', updateReadingProgress);

export default router; 