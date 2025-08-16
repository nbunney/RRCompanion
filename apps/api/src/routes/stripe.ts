import { Router } from 'oak';
import { createSponsorshipPayment, createCoffeePayment, handleStripeWebhook, getPaymentStatus } from '../controllers/stripe.ts';
import { authMiddleware } from '../middleware/auth.ts';

const router = new Router();

// Create payment intent (requires auth)
router.post('/create-payment', authMiddleware, createSponsorshipPayment);

// Create coffee payment (no auth required)
router.post('/create-coffee-payment', createCoffeePayment);

// Webhook endpoint (no auth required - Stripe verifies with signature)
router.post('/webhook', handleStripeWebhook);

// Get payment status (requires auth)
router.get('/payment-status', authMiddleware, getPaymentStatus);

export default router; 