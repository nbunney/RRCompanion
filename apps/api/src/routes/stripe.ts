import { Router } from 'oak';
import { createSponsorshipPayment, handleStripeWebhook, getPaymentStatus } from '../controllers/stripe.ts';
import { authMiddleware } from '../middleware/auth.ts';

const router = new Router();

// Create payment intent (requires auth)
router.post('/create-payment', authMiddleware, createSponsorshipPayment);

// Webhook endpoint (no auth required - Stripe verifies with signature)
router.post('/webhook', handleStripeWebhook);

// Get payment status (requires auth)
router.get('/payment-status', authMiddleware, getPaymentStatus);

export default router; 