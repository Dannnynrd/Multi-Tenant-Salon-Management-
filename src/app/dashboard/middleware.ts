import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'

export async function checkSubscriptionAccess(request: NextRequest) {
  const supabase = await createSupabaseServer()

  // Get current tenant from cookie
  const tenantId = request.cookies.get('current-tenant')?.value

  if (!tenantId) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  // Check subscription status
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('tenant_id', tenantId)
    .single()

  if (!subscription) {
    // No subscription = redirect to pricing
    return NextResponse.redirect(new URL('/pricing', request.url))
  }

  // Check if trial is expired
  if (subscription.trial_end) {
    const trialExpired = new Date(subscription.trial_end) < new Date()
    if (trialExpired && subscription.status !== 'active') {
      // Trial expired and no active subscription = redirect to pricing
      return NextResponse.redirect(new URL('/pricing?trial_expired=true', request.url))
    }
  }

  // Check if subscription is canceled/past_due
  if (subscription.status && !['active', 'trialing'].includes(subscription.status)) {
    return NextResponse.redirect(new URL('/pricing?subscription_issue=true', request.url))
  }

  return NextResponse.next()
}