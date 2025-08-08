import { Router } from 'oak';
import { getFictionHistory, triggerFictionHistoryCollection } from '../controllers/fictionHistory.ts';
import { authMiddleware } from '../middleware/auth.ts';

const router = new Router();

// Public route to get fiction history data
router.get('/fiction-history', getFictionHistory);

// Protected route to trigger fiction history collection manually
router.post('/fiction-history/trigger', authMiddleware, triggerFictionHistoryCollection);

export default router; 