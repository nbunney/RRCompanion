import { Context } from 'oak';
import { stripeService } from '../services/stripe.ts';
import { getUserFromContext } from '../utils/auth.ts';

export async function createSponsorshipPayment(ctx: Context) {
  try {
    const user = await getUserFromContext(ctx);
    if (!user) {
      ctx.response.status = 401;
      ctx.response.body = { success: false, error: 'Unauthorized' };
      return;
    }

    const body = await ctx.request.body.json();
    const { fictionId } = body;

    if (!fictionId) {
      ctx.response.status = 400;
      ctx.response.body = { success: false, error: 'Fiction ID is required' };
      return;
    }

    // Create payment intent
    const paymentIntent = await stripeService.createSponsorshipPaymentIntent(
      parseInt(fictionId),
      user.id
    );

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      },
    };
  } catch (error) {
    console.error('❌ Error creating sponsorship payment:', error);
    ctx.response.status = 500;
    ctx.response.body = { success: false, error: 'Failed to create payment' };
  }
}

export async function handleStripeWebhook(ctx: Context) {
  try {
    console.log('🔔 Stripe webhook endpoint hit');

    const signature = ctx.request.headers.get('stripe-signature');
    if (!signature) {
      console.log('❌ Missing stripe signature header');
      ctx.response.status = 400;
      ctx.response.body = { success: false, error: 'Missing stripe signature' };
      return;
    }

    console.log('🔔 Stripe signature found, processing webhook...');
    const body = await ctx.request.body.text();
    console.log('🔔 Webhook body length:', body.length);

    const event = await stripeService.verifyWebhookSignature(body, signature);
    console.log('🔔 Stripe webhook verified successfully, event type:', event.type);
    console.log('🔔 Event data:', JSON.stringify(event.data, null, 2));

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        console.log('🎉 Payment succeeded, processing sponsorship...');
        const paymentIntent = event.data.object as any;
        console.log('🔔 Payment intent ID:', paymentIntent.id);
        console.log('🔔 Payment intent metadata:', paymentIntent.metadata);

        await stripeService.handleSuccessfulPayment(paymentIntent);
        console.log('✅ Sponsorship processed successfully');
        break;

      case 'payment_intent.payment_failed':
        console.log('❌ Payment failed:', event.data.object.id);
        break;

      default:
        console.log('ℹ️ Unhandled event type:', event.type);
    }

    ctx.response.status = 200;
    ctx.response.body = { success: true };
    console.log('🔔 Webhook response sent successfully');
  } catch (error) {
    console.error('❌ Error handling webhook:', error);
    if (error instanceof Error) {
      console.error('❌ Error details:', error.message);
      console.error('❌ Error stack:', error.stack);
    }
    ctx.response.status = 400;
    ctx.response.body = { success: false, error: 'Webhook error' };
  }
}

export async function getPaymentStatus(ctx: Context) {
  try {
    const url = new URL(ctx.request.url);
    const paymentIntentId = url.searchParams.get('paymentIntentId');

    if (!paymentIntentId) {
      ctx.response.status = 400;
      ctx.response.body = { success: false, error: 'Payment intent ID is required' };
      return;
    }

    const paymentIntent = await stripeService.getPaymentIntent(paymentIntentId);

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: {
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        metadata: paymentIntent.metadata,
      },
    };
  } catch (error) {
    console.error('❌ Error getting payment status:', error);
    ctx.response.status = 500;
    ctx.response.body = { success: false, error: 'Failed to get payment status' };
  }
} 