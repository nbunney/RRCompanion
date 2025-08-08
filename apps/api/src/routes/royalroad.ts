import { Router } from 'oak';
import {
  getFiction,
  getPopularFictions,
  getUserProfile,
  addFictionByUrl,
} from '../controllers/royalroad.ts';
import { authMiddleware } from '../middleware/auth.ts';

const router = new Router();

// Get popular fictions
router.get('/popular', getPopularFictions);

// Get fiction by ID
router.get('/fiction/:id', getFiction);

// Add fiction by URL (requires authentication)
router.post('/add-fiction', authMiddleware, addFictionByUrl);

// Get user profile
router.get('/user/:username', getUserProfile);

export default router;
