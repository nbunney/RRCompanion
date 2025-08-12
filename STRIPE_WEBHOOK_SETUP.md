# Stripe Webhook Setup Guide

This guide will help you set up live Stripe webhook events to receive real-time
notifications when payments are completed.

## 1. Stripe Dashboard Configuration

### Step 1: Access Stripe Dashboard

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Sign in to your Stripe account
3. Make sure you're in the correct mode (Test/Live)

### Step 2: Configure Webhook Endpoints

1. Navigate to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Set the endpoint URL to: `https://yourdomain.com/api/stripe/webhook`
4. Select the following events to listen for:

#### Payment Events:

- `payment_intent.succeeded` - When a payment is successfully completed
- `payment_intent.payment_failed` - When a payment fails
- `charge.succeeded` - When a charge is successfully processed
- `charge.failed` - When a charge fails
- `invoice.payment_succeeded` - When an invoice payment succeeds
- `invoice.payment_failed` - When an invoice payment fails

#### Additional Events (Optional):

- `customer.subscription.created` - For subscription management
- `customer.subscription.updated` - For subscription updates
- `customer.subscription.deleted` - For subscription cancellations

### Step 3: Get Webhook Secret

1. After creating the webhook, click on it to view details
2. Click **Reveal** next to the signing secret
3. Copy the webhook secret (starts with `whsec_`)
4. Add this to your `.env` file as `STRIPE_WEBHOOK_SECRET`

## 2. Environment Configuration

Update your `.env` file with the following variables:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_your_live_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# For testing, use test keys:
# STRIPE_SECRET_KEY=sk_test_your_test_secret_key_here
# STRIPE_PUBLISHABLE_KEY=pk_test_your_test_publishable_key_here
# STRIPE_WEBHOOK_SECRET=whsec_your_test_webhook_secret_here
```

## 3. Database Tables

Ensure you have the following tables for logging webhook events:

### Sponsorship Logs Table

```sql
CREATE TABLE IF NOT EXISTS sponsorship_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fiction_id INT NOT NULL,
  user_id INT NOT NULL,
  stripe_payment_intent_id VARCHAR(255) NOT NULL,
  amount INT NOT NULL,
  status ENUM('completed', 'failed', 'pending') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_fiction_id (fiction_id),
  INDEX idx_user_id (user_id),
  INDEX idx_stripe_payment_intent_id (stripe_payment_intent_id)
);
```

### Charge Logs Table (Optional)

```sql
CREATE TABLE IF NOT EXISTS charge_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  stripe_charge_id VARCHAR(255) NOT NULL,
  amount INT NOT NULL,
  currency VARCHAR(3) NOT NULL,
  status ENUM('succeeded', 'failed') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_stripe_charge_id (stripe_charge_id)
);
```

### Invoice Logs Table (Optional)

```sql
CREATE TABLE IF NOT EXISTS invoice_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  stripe_invoice_id VARCHAR(255) NOT NULL,
  amount INT NOT NULL,
  currency VARCHAR(3) NOT NULL,
  status ENUM('succeeded', 'failed') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_stripe_invoice_id (stripe_invoice_id)
);
```

## 4. Testing Webhooks

### Step 1: Use Stripe CLI (Recommended)

1. Install Stripe CLI:
   [stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)
2. Login: `stripe login`
3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:8000/api/stripe/webhook
   ```
4. This will give you a webhook signing secret for testing

### Step 2: Test with Stripe Dashboard

1. Go to your webhook endpoint in Stripe Dashboard
2. Click **Send test webhook**
3. Select an event type (e.g., `payment_intent.succeeded`)
4. Click **Send test webhook**
5. Check your server logs for the webhook event

### Step 3: Monitor Webhook Delivery

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click on your webhook endpoint
3. View the **Recent deliveries** tab
4. Check for any failed deliveries and error messages

## 5. Production Deployment

### Step 1: Update Webhook URL

1. Change the webhook endpoint URL to your production domain
2. Ensure HTTPS is enabled (Stripe requires it for production)

### Step 2: Switch to Live Keys

1. Update your environment variables to use live Stripe keys
2. Test with a small live transaction first

### Step 3: Monitor Logs

1. Set up proper logging for webhook events
2. Monitor for any webhook failures
3. Set up alerts for critical payment events

## 6. Security Best Practices

### Webhook Verification

- Always verify webhook signatures using `STRIPE_WEBHOOK_SECRET`
- Never trust webhook data without verification
- Use HTTPS for all webhook endpoints

### Error Handling

- Return 200 status for successful webhook processing
- Log all webhook events for debugging
- Handle webhook failures gracefully

### Rate Limiting

- Stripe may send multiple webhooks for the same event
- Implement idempotency to handle duplicate events
- Use database transactions for data consistency

## 7. Troubleshooting

### Common Issues:

1. **Webhook not received**: Check endpoint URL and firewall settings
2. **Signature verification failed**: Verify webhook secret is correct
3. **Database errors**: Check table structure and permissions
4. **Timeout errors**: Ensure webhook processing completes within 10 seconds

### Debug Commands:

```bash
# Check webhook endpoint status
curl -X GET "https://yourdomain.com/api/stripe/webhook"

# Test webhook locally
stripe listen --forward-to localhost:8000/api/stripe/webhook

# View webhook logs
tail -f /var/log/your-app/webhook.log
```

## 8. Monitoring and Alerts

### Set up monitoring for:

- Webhook delivery success/failure rates
- Payment processing times
- Database transaction success rates
- Error rates and types

### Recommended alerts:

- Webhook delivery failures > 5%
- Payment processing errors > 1%
- Database connection failures
- High response times (>5 seconds)

## 9. Next Steps

After setting up webhooks:

1. Test with small transactions
2. Monitor webhook delivery in Stripe Dashboard
3. Set up logging and monitoring
4. Implement retry logic for failed webhooks
5. Add webhook event analytics

## Support

If you encounter issues:

1. Check Stripe Dashboard webhook logs
2. Review your server logs
3. Test with Stripe CLI locally
4. Contact Stripe support if needed
5. Check [Stripe webhook documentation](https://stripe.com/docs/webhooks)
