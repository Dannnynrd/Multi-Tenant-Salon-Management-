import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { handleStripeWebhook } from '@/lib/stripe/server'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = (await headers()).get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature' },
      { status: 400 }
    )
  }

  try {
    const result = await handleStripeWebhook(body, signature)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}