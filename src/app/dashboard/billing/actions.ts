'use server'

import { redirect } from 'next/navigation'
import { createCustomerPortalSession } from '@/lib/stripe/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia'
})

export async function redirectToStripePortal(formData: FormData) {
  const tenantId = formData.get('tenantId') as string

  if (!tenantId) {
    throw new Error('Tenant ID required')
  }

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const session = await createCustomerPortalSession({
      tenantId,
      returnUrl: `${appUrl}/dashboard/billing`,
    })

    redirect(session.url)
  } catch (error) {
    console.error('Portal session error:', error)
    throw error
  }
}

export async function redirectToStripeCheckout(formData: FormData) {
  const tenantId = formData.get('tenantId') as string
  const priceId = formData.get('priceId') as string

  if (!tenantId || !priceId) {
    throw new Error('Tenant ID and Price ID required')
  }

  try {
    const supabase = await createClient()

    // Get tenant info
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id, name, stripe_customer_id')
      .eq('id', tenantId)
      .single()

    if (!tenant) {
      throw new Error('Tenant not found')
    }

    // Check if already has subscription
    const { data: hasAccess } = await supabase
      .rpc('has_access', { p_tenant_id: tenantId })

    if (hasAccess === true && tenant.stripe_customer_id) {
      // Redirect to portal instead
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: tenant.stripe_customer_id,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`
      })
      redirect(portalSession.url)
      return
    }

    // Create or get Stripe customer
    let stripeCustomerId = tenant.stripe_customer_id

    if (!stripeCustomerId) {
      // Get user email for customer creation
      const { data: { user } } = await supabase.auth.getUser()

      if (!user?.email) {
        throw new Error('User email not found')
      }

      const customer = await stripe.customers.create({
        email: user.email,
        name: tenant.name,
        metadata: {
          tenant_id: tenantId
        }
      })
      stripeCustomerId = customer.id

      // Save customer ID
      await supabase
        .from('tenants')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', tenantId)
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1
      }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=true`,
      client_reference_id: tenantId,
      metadata: {
        tenant_id: tenantId
      },
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          tenant_id: tenantId
        }
      },
      allow_promotion_codes: true
    })

    redirect(checkoutSession.url!)
  } catch (error) {
    console.error('Checkout error:', error)
    throw error
  }
}