import { Router } from 'oak';
import { addFictionByUrl } from '../controllers/royalroad.ts';
import { authMiddleware } from '../middleware/auth.ts';

const router = new Router();

// Add fiction by URL - requires authentication
router.post('/add-fiction', authMiddleware, addFictionByUrl);

export default router;

