import { Router } from 'oak';
import {
  getProfile,
  login,
  register,
  updateProfile,
} from '../controllers/auth.ts';
import { authMiddleware } from '../middleware/auth.ts';

const router = new Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);

export default router;
