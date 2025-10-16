import Stripe from 'stripe'
import { createSupabaseAdmin } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia'
})

/**
 * Idempotent webhook handler with advisory locks
 * Processes Stripe events exactly once
 */
export async function handleStripeWebhook(
  body: string,
  signature: string
): Promise<{ received: boolean; processed?: boolean }> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!
  let event: Stripe.Event

  // Verify webhook signature
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`)
    throw new Error(`Webhook Error: ${err.message}`)
  }

  const supabase = await createSupabaseAdmin()

  // Process webhook with idempotency
  const { data, error } = await supabase.rpc('process_stripe_webhook', {
    p_event_id: event.id,
    p_event_type: event.type,
    p_data: event.data.object as any,
    p_tenant_id: extractTenantId(event)
  })

  if (error) {
    console.error('Error processing webhook:', error)
    return { received: true, processed: false }
  }

  return { received: true, processed: data?.success || false }
}

/**
 * Extract tenant_id from various event types
 */
function extractTenantId(event: Stripe.Event): string | null {
  const obj = event.data.object as any

  switch (event.type) {
    case 'checkout.session.completed':
      return obj.client_reference_id || obj.metadata?.tenant_id || null

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      return obj.metadata?.tenant_id || null

    case 'invoice.payment_succeeded':
    case 'invoice.payment_failed':
      return obj.subscription_details?.metadata?.tenant_id || null

    default:
      return null
  }
}

/**
 * Create checkout session with guards against double subscriptions
 */
export async function createCheckoutSession({
  tenantId,
  userId,
  userEmail,
  priceId,
  successUrl,
  cancelUrl,
}: {
  tenantId: string
  userId: string
  userEmail: string
  priceId: string
  successUrl: string
  cancelUrl: string
}) {
  const supabase = await createSupabaseAdmin()

  // Check if tenant already has active subscription
  const { data: hasAccess } = await supabase
    .rpc('has_access', { p_tenant_id: tenantId })

  if (hasAccess === true) {
    // Return portal session instead
    const { data: tenant } = await supabase
      .from('tenants')
      .select('stripe_customer_id')
      .eq('id', tenantId)
      .single()

    if (tenant?.stripe_customer_id) {
      const portal = await stripe.billingPortal.sessions.create({
        customer: tenant.stripe_customer_id,
        return_url: successUrl
      })
      return { type: 'portal', url: portal.url }
    }
  }

  // Get or create Stripe customer
  const { data: tenant } = await supabase
    .from('tenants')
    .select('stripe_customer_id, name')
    .eq('id', tenantId)
    .single()

  let customerId = tenant?.stripe_customer_id

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: userEmail,
      name: tenant?.name,
      metadata: {
        tenant_id: tenantId,
        user_id: userId
      }
    })
    customerId = customer.id

    // Save customer ID
    await supabase
      .from('tenants')
      .update({ stripe_customer_id: customerId })
      .eq('id', tenantId)
  }

  // Create checkout session with idempotency key
  const idempotencyKey = `checkout_${tenantId}_${priceId}_${Date.now()}`

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{
      price: priceId,
      quantity: 1
    }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: tenantId,
    metadata: {
      tenant_id: tenantId,
      user_id: userId
    },
    subscription_data: {
      trial_period_days: 30,
      metadata: {
        tenant_id: tenantId
      }
    },
    allow_promotion_codes: true,
    billing_address_collection: 'required',
    locale: 'de'
  }, {
    idempotencyKey
  })

  return { type: 'checkout', url: session.url, sessionId: session.id }
}

/**
 * Create customer portal session
 */
export async function createPortalSession({
  tenantId,
  returnUrl
}: {
  tenantId: string
  returnUrl: string
}) {
  const supabase = await createSupabaseAdmin()

  // Try multiple methods to get the customer ID
  let customerId: string | null = null

  // Method 1: Direct query with service role (should bypass RLS)
  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('tenant_id', tenantId)
    .single()

  if (subscription?.stripe_customer_id) {
    customerId = subscription.stripe_customer_id
  }

  // Method 2: Use RPC function if direct query fails
  if (!customerId) {
    const { data: rpcResult } = await supabase
      .rpc('get_subscription_customer_id', { p_tenant_id: tenantId })

    if (rpcResult) {
      customerId = rpcResult
    }
  }

  // Method 3: Try to get from tenants table
  if (!customerId) {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('stripe_customer_id')
      .eq('id', tenantId)
      .single()

    if (tenant?.stripe_customer_id) {
      customerId = tenant.stripe_customer_id
    }
  }

  // Method 4: Get from active_subscriptions view
  if (!customerId) {
    const { data: activeSub } = await supabase
      .from('active_subscriptions')
      .select('stripe_customer_id')
      .eq('tenant_id', tenantId)
      .single()

    if (activeSub?.stripe_customer_id) {
      customerId = activeSub.stripe_customer_id
    }
  }

  // Method 5: If we have a subscription ID, get customer from Stripe API
  if (!customerId && subscription?.stripe_subscription_id) {
    try {
      const stripeSubscription = await stripe.subscriptions.retrieve(
        subscription.stripe_subscription_id
      )
      customerId = stripeSubscription.customer as string

      // Save it for next time
      await supabase
        .from('subscriptions')
        .update({ stripe_customer_id: customerId })
        .eq('tenant_id', tenantId)
    } catch (error) {
      console.error('Error fetching from Stripe:', error)
    }
  }

  if (!customerId) {
    // Log detailed error for debugging
    console.error('Portal session failed - no customer found:', {
      tenantId,
      subscription,
      subError,
      serviceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    })
    throw new Error(`No Stripe customer found for tenant ${tenantId}`)
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
    locale: 'de'
  })

  return session
}

/**
 * Sync subscription data from Stripe (safety net)
 */
export async function syncSubscriptionFromStripe(tenantId: string) {
  const supabase = await createSupabaseAdmin()

  // Get subscription from local DB
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('stripe_subscription_id')
    .eq('tenant_id', tenantId)
    .single()

  if (!sub?.stripe_subscription_id) {
    return { synced: false, reason: 'No subscription found' }
  }

  try {
    // Fetch from Stripe
    const stripeSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id)

    // Update local DB
    await supabase
      .from('subscriptions')
      .update({
        status: stripeSub.status,
        stripe_price_id: stripeSub.items.data[0]?.price.id,
        current_period_start: new Date(stripeSub.current_period_start * 1000).toISOString(),
        current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
        trial_end: stripeSub.trial_end
          ? new Date(stripeSub.trial_end * 1000).toISOString()
          : null,
        cancel_at_period_end: stripeSub.cancel_at_period_end,
        quantity: stripeSub.items.data[0]?.quantity || 1,
        updated_at: new Date().toISOString()
      })
      .eq('tenant_id', tenantId)

    return { synced: true, status: stripeSub.status }
  } catch (error) {
    console.error('Error syncing subscription:', error)
    return { synced: false, error }
  }
}

export { stripe }