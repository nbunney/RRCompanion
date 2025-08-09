import { Router } from 'oak';
import {
  getOAuthProviders,
  handleOAuthCallback,
  initiateOAuth,
} from '../controllers/oauth.ts';

const router = new Router();

// Get available OAuth providers
router.get('/providers', getOAuthProviders);

// Initiate OAuth flow
router.get('/:provider/initiate', initiateOAuth);

// Handle OAuth callback
router.get('/:provider/callback', handleOAuthCallback);

export default router;
