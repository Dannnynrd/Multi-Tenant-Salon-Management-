import { NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { tenantId } = await request.json()

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID required' },
        { status: 400 }
      )
    }

    const supabase = await createSupabaseAdmin()

    // Get tenant email for Stripe lookup
    const { data: tenant } = await supabase
      .from('tenants')
      .select('name')
      .eq('id', tenantId)
      .single()

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Try to find and sync subscription from Stripe FDW
    // Look for the latest subscription for this customer email
    const { data: stripeCustomers } = await supabase
      .from('stripe.customers')
      .select('id')
      .eq('attrs->>email', tenant.name)
      .single()

    if (stripeCustomers) {
      // Find subscription for this customer
      const { data: stripeSubscription } = await supabase
        .from('stripe.subscriptions')
        .select('id, attrs')
        .eq('attrs->>customer', stripeCustomers.id)
        .in('attrs->>status', ['active', 'trialing', 'past_due'])
        .order('attrs->>created', { ascending: false })
        .limit(1)
        .single()

      if (stripeSubscription) {
        // Parse subscription data
        const attrs = stripeSubscription.attrs as any
        const subscriptionId = stripeSubscription.id
        const priceId = attrs.items?.data?.[0]?.price?.id
        const status = attrs.status
        const trialEnd = attrs.trial_end
        const periodStart = attrs.current_period_start
        const periodEnd = attrs.current_period_end

        // Insert or update subscription in local table
        const { error: upsertError } = await supabase
          .from('subscriptions')
          .upsert({
            tenant_id: tenantId,
            stripe_customer_id: stripeCustomers.id,
            stripe_subscription_id: subscriptionId,
            stripe_price_id: priceId,
            status: status,
            trial_end: trialEnd ? new Date(trialEnd * 1000).toISOString() : null,
            current_period_start: new Date(periodStart * 1000).toISOString(),
            current_period_end: new Date(periodEnd * 1000).toISOString(),
            metadata: { tenant_id: tenantId, synced_from: 'api' },
            quantity: 1,
            cancel_at_period_end: attrs.cancel_at_period_end || false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'stripe_subscription_id'
          })

        if (upsertError) {
          console.error('Error upserting subscription:', upsertError)
        } else {
          console.log('Successfully synced subscription:', subscriptionId)
        }

        // If we have the sync function, use it as backup
        const { error: syncError } = await supabase
          .rpc('sync_stripe_subscription_to_local', {
            p_stripe_subscription_id: subscriptionId,
            p_tenant_id: tenantId
          })

        if (syncError && syncError.code !== '42883') { // 42883 = function doesn't exist
          console.error('Sync function error:', syncError)
        }
      }
    }

    // Update tenant access state
    const { error: updateError } = await supabase
      .rpc('update_tenant_access_state', { p_tenant_id: tenantId })

    if (updateError) {
      console.error('Error updating tenant access state:', updateError)
      // Continue anyway - the subscription might still work
    }

    // Verify the subscription exists now
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id, status, stripe_price_id')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // If still no subscription, return partial success
    if (!subscription) {
      console.log('No subscription found after sync attempt for tenant:', tenantId)
      return NextResponse.json({
        success: false,
        message: 'Subscription is being processed. Please refresh in a few seconds.',
        tenant: tenant.name
      })
    }

    return NextResponse.json({
      success: true,
      subscription: subscription
    })
  } catch (error: any) {
    console.error('Update access error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}