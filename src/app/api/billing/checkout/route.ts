import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia'
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get request body
    const { price_id, success_url, cancel_url } = await request.json()

    if (!price_id) {
      return NextResponse.json(
        { error: 'Price ID required' },
        { status: 400 }
      )
    }

    // Get tenant from user's membership
    const { data: membership } = await supabase
      .from('tenant_members')
      .select('tenant_id, tenants!inner(id, stripe_customer_id, name)')
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'No tenant found' },
        { status: 400 }
      )
    }

    const tenant = membership.tenants as any
    const tenantId = membership.tenant_id

    // GUARD: Check if tenant already has an active subscription
    const { data: existingSub } = await supabase
      .rpc('has_access', { p_tenant_id: tenantId })

    if (existingSub === true) {
      // Tenant already has active subscription - redirect to portal
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: tenant.stripe_customer_id,
        return_url: success_url || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
      })

      return NextResponse.json({
        type: 'portal',
        url: portalSession.url,
        message: 'You already have an active subscription. Redirecting to customer portal...'
      })
    }

    // Create or get Stripe customer
    let stripeCustomerId = tenant.stripe_customer_id

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        name: tenant.name,
        metadata: {
          tenant_id: tenantId,
          user_id: user.id
        }
      })
      stripeCustomerId = customer.id

      // Save Stripe customer ID to tenant
      await supabase
        .from('tenants')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', tenantId)
    }

    // Create checkout session with idempotency key
    const idempotencyKey = `checkout_${tenantId}_${price_id}_${Date.now()}`

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price: price_id,
        quantity: 1
      }],
      success_url: success_url || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancel_url: cancel_url || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?canceled=true`,
      client_reference_id: tenantId,
      metadata: {
        tenant_id: tenantId,
        user_id: user.id
      },
      subscription_data: {
        trial_period_days: 30,
        metadata: {
          tenant_id: tenantId
        }
      },
      allow_promotion_codes: true
    }, {
      idempotencyKey
    })

    return NextResponse.json({
      type: 'checkout',
      url: checkoutSession.url,
      session_id: checkoutSession.id
    })

  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}