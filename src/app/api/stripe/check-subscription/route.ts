import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

export async function GET() {
  try {
    const cookieStore = await cookies()
    const tenantId = cookieStore.get('current-tenant')?.value

    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant selected' }, { status: 400 })
    }

    // Get subscription ID from database
    const { createSupabaseAdmin } = await import('@/lib/supabase/server')
    const supabase = await createSupabaseAdmin()

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('tenant_id', tenantId)
      .single()

    if (!subscription?.stripe_subscription_id) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 })
    }

    // Fetch directly from Stripe API
    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripe_subscription_id
    )

    const stripeCustomer = await stripe.customers.retrieve(
      subscription.stripe_customer_id
    )

    // Get price details
    const priceId = stripeSubscription.items.data[0]?.price.id
    const price = await stripe.prices.retrieve(priceId)
    const product = await stripe.products.retrieve(price.product as string)

    return NextResponse.json({
      subscription: {
        id: stripeSubscription.id,
        status: stripeSubscription.status,
        current_period_start: new Date(stripeSubscription.current_period_start * 1000),
        current_period_end: new Date(stripeSubscription.current_period_end * 1000),
        trial_end: stripeSubscription.trial_end
          ? new Date(stripeSubscription.trial_end * 1000)
          : null,
        cancel_at_period_end: stripeSubscription.cancel_at_period_end,
      },
      customer: {
        id: stripeCustomer.id,
        email: (stripeCustomer as any).email,
        name: (stripeCustomer as any).name,
      },
      product: {
        name: product.name,
        price: (price.unit_amount || 0) / 100,
        currency: price.currency,
        interval: price.recurring?.interval,
      },
    })
  } catch (error: any) {
    console.error('Subscription check error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}