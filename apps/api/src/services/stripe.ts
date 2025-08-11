import Stripe from 'stripe';
import { client } from '../config/database.ts';

// Lazy initialize Stripe client to ensure environment variables are loaded
let stripe: Stripe | null = null;

function getStripeClient(): Stripe {
  if (!stripe) {
    const apiKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!apiKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }
    stripe = new Stripe(apiKey, {
      apiVersion: '2024-12-18.acacia',
    });
  }
  return stripe;
}

export class StripeService {
  // Create a payment intent for sponsoring a fiction
  async createSponsorshipPaymentIntent(fictionId: number, userId: number): Promise<Stripe.PaymentIntent> {
    try {
      // Get fiction details
      const fictionResult = await client.query(
        'SELECT title, author_name FROM fiction WHERE id = ?',
        [fictionId]
      );

      if (fictionResult.length === 0) {
        throw new Error('Fiction not found');
      }

      const fiction = fictionResult[0];

      // Create payment intent
      const paymentIntent = await getStripeClient().paymentIntents.create({
        amount: 500, // $5.00 in cents
        currency: 'usd',
        metadata: {
          fiction_id: fictionId.toString(),
          user_id: userId.toString(),
          fiction_title: fiction.title,
          author_name: fiction.author_name,
        },
        description: `Sponsorship for "${fiction.title}" by ${fiction.author_name}`,
      });

      return paymentIntent;
    } catch (error) {
      console.error('❌ Error creating payment intent:', error);
      throw error;
    }
  }

  // Handle successful payment
  async handleSuccessfulPayment(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      console.log('🔔 Starting to handle successful payment...');
      console.log('🔔 Payment intent metadata:', paymentIntent.metadata);

      const { fiction_id, user_id } = paymentIntent.metadata;

      if (!fiction_id || !user_id) {
        throw new Error('Missing metadata in payment intent');
      }

      console.log(`🔔 Updating fiction ${fiction_id} to sponsored for user ${user_id}`);

      // Update fiction to sponsored
      const updateResult = await client.execute(
        'UPDATE fiction SET sponsored = 1 WHERE id = ?',
        [parseInt(fiction_id)]
      );
      console.log('🔔 Fiction update result:', updateResult);

      // Log the sponsorship
      const logResult = await client.execute(
        'INSERT INTO sponsorship_logs (fiction_id, user_id, stripe_payment_intent_id, amount, status, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
        [
          parseInt(fiction_id),
          parseInt(user_id),
          paymentIntent.id,
          paymentIntent.amount,
          'completed'
        ]
      );
      console.log('🔔 Sponsorship log result:', logResult);

      console.log(`✅ Fiction ${fiction_id} sponsored by user ${user_id}`);
    } catch (error) {
      console.error('❌ Error handling successful payment:', error);
      if (error instanceof Error) {
        console.error('❌ Error details:', error.message);
        console.error('❌ Error stack:', error.stack);
      }
      throw error;
    }
  }

  // Verify webhook signature
  async verifyWebhookSignature(payload: string, signature: string): Promise<Stripe.Event> {
    console.log('🔔 Verifying webhook signature...');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.error('❌ STRIPE_WEBHOOK_SECRET not configured');
      throw new Error('Webhook secret not configured');
    }

    console.log('🔔 Webhook secret found, length:', webhookSecret.length);
    try {
      const event = await getStripeClient().webhooks.constructEventAsync(payload, signature, webhookSecret);
      console.log('🔔 Webhook signature verified successfully');
      return event;
    } catch (error) {
      console.error('❌ Webhook signature verification failed:', error);
      if (error instanceof Error) {
        console.error('❌ Verification error details:', error.message);
      }
      throw error;
    }
  }

  // Get payment intent by ID
  async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    return await getStripeClient().paymentIntents.retrieve(paymentIntentId);
  }
}

export const stripeService = new StripeService(); 