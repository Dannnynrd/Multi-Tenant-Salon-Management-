# Stripe Integration Documentation

## Overview
This project uses Stripe as the single source of truth for subscription management. All subscription data flows from Stripe to the application via:
1. Stripe Foreign Data Wrapper (real-time read)
2. Webhooks (event-driven updates)

## Architecture

### No Local Plan Management
- **NO FREE PLAN** - Only paid tiers with 30-day trial
- Plans: STARTER (€29), PROFESSIONAL (€49), PREMIUM (€199)
- All subscription logic handled by Stripe
- Local database only stores Stripe IDs for reference

### Data Flow
```
User → Pricing Page → Stripe Checkout → Webhook → Database
                          ↓
                   Stripe Dashboard
                          ↓
            Foreign Data Wrapper (real-time read)
```

## Configuration

### Environment Variables
```bash
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# App URL (for redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Database Tables

#### Local Tables
- `subscriptions`: Stores only Stripe reference IDs
  - `tenant_id` (UUID)
  - `stripe_customer_id` (text)
  - `stripe_subscription_id` (text)

#### Stripe Foreign Tables (via Wrapper)
- `stripe.customers`: Customer data from Stripe
- `stripe.subscriptions`: Subscription data from Stripe
- `stripe.products`: Product catalog
- `stripe.prices`: Pricing information

### Views
- `active_subscriptions`: Joins local and Stripe data with Unix timestamp conversion

## API Endpoints

### `/api/stripe/webhook`
Handles Stripe webhook events:
- `checkout.session.completed`: Links subscription to tenant
- `customer.subscription.updated`: Updates subscription status
- `customer.subscription.deleted`: Handles cancellations

### `/api/stripe/create-checkout`
Creates Stripe checkout session with tenant metadata

### `/api/stripe/portal`
Opens Stripe Customer Portal for subscription management

## Testing

### Test Page
Navigate to: http://localhost:3001/test-stripe

This page shows:
- Local subscription data
- Live Stripe data via wrapper
- Test actions (pricing, portal)

### Local Development Setup
1. Install Stripe CLI:
   ```bash
   brew install stripe/stripe-cli/stripe
   ```

2. Login to Stripe:
   ```bash
   stripe login
   ```

3. Forward webhooks to local:
   ```bash
   stripe listen --forward-to localhost:3001/api/stripe/webhook
   ```

4. Copy the webhook secret to `.env.local`

### Test Cards
- Success: `4242 4242 4242 4242`
- Declined: `4000 0000 0000 0002`
- 3D Secure: `4000 0027 6000 3184`

## Integration Points

### Pricing Page (`/pricing`)
- Embeds Stripe Pricing Table
- Passes tenant_id via metadata
- Handles authentication check

### Dashboard
- Checks subscription status via `active_subscriptions` view
- Feature gating based on plan limits
- Shows upgrade prompts when limits reached

### Onboarding
- Creates tenant first
- Redirects to pricing page
- Subscription created via Stripe checkout

## Troubleshooting

### Common Issues

1. **"No tenant selected"**
   - Ensure user is logged in
   - Check current-tenant cookie is set

2. **Webhook signature verification failed**
   - Verify STRIPE_WEBHOOK_SECRET matches CLI output
   - Check request body is raw (not parsed)

3. **Subscription not linking to tenant**
   - Ensure tenant_id is passed in checkout metadata
   - Check webhook handler logs

4. **Foreign table access issues**
   - Verify Stripe API key in wrapper config
   - Check permissions on stripe schema

## Security Notes

- Never expose secret keys in frontend code
- Validate webhook signatures
- Use RLS policies on subscription data
- Sanitize all user inputs
- Keep Stripe libraries updated