import Stripe from 'stripe';
import { client } from '../config/database.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2024-12-18.acacia',
});

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
      const paymentIntent = await stripe.paymentIntents.create({
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
      const { fiction_id, user_id } = paymentIntent.metadata;

      if (!fiction_id || !user_id) {
        throw new Error('Missing metadata in payment intent');
      }

      // Update fiction to sponsored
      await client.execute(
        'UPDATE fiction SET sponsored = 1 WHERE id = ?',
        [parseInt(fiction_id)]
      );

      // Log the sponsorship
      await client.execute(
        'INSERT INTO sponsorship_logs (fiction_id, user_id, stripe_payment_intent_id, amount, status, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
        [
          parseInt(fiction_id),
          parseInt(user_id),
          paymentIntent.id,
          paymentIntent.amount,
          'completed'
        ]
      );

      console.log(`✅ Fiction ${fiction_id} sponsored by user ${user_id}`);
    } catch (error) {
      console.error('❌ Error handling successful payment:', error);
      throw error;
    }
  }

  // Verify webhook signature
  verifyWebhookSignature(payload: string, signature: string): Stripe.Event {
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new Error('Webhook secret not configured');
    }

    try {
      return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error) {
      console.error('❌ Webhook signature verification failed:', error);
      throw error;
    }
  }

  // Get payment intent by ID
  async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  }
}

export const stripeService = new StripeService(); 