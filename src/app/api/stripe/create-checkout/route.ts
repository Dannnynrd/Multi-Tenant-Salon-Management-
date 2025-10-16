import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

export async function POST(request: Request) {
  try {
    const { priceId } = await request.json()
    const cookieStore = await cookies()
    const tenantId = cookieStore.get('current-tenant')?.value

    if (!tenantId) {
      return NextResponse.json(
        { error: 'No tenant selected' },
        { status: 400 }
      )
    }

    // Create checkout session with tenant metadata
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card', 'sepa_debit'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      client_reference_id: tenantId, // Important: This is what we read in the webhook
      metadata: {
        tenant_id: tenantId,
      },
      subscription_data: {
        trial_period_days: 30,
        metadata: {
          tenant_id: tenantId,
        },
      },
      locale: 'de',
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}