import { Router } from 'oak';
import { getRisingStarsMain } from '../controllers/risingStarsMain.ts';

const router = new Router();

// Get Rising Stars Main list
router.get('/rising-stars-main', getRisingStarsMain);

export default router;
