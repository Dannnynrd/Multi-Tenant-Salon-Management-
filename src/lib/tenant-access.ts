import { createSupabaseAdmin } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Server-side tenant access check
 */
export async function checkTenantAccess(tenantId: string): Promise<{
  hasAccess: boolean
  isLocked: boolean
  lockedReason?: string
  inGracePeriod: boolean
  subscriptionStatus?: string
}> {
  const supabase = await createSupabaseAdmin()

  // Check if tenant has access using the DB function
  const { data: hasAccess } = await supabase
    .rpc('tenant_has_access', { p_tenant_id: tenantId })

  // Get detailed tenant info
  const { data: tenant } = await supabase
    .from('tenants')
    .select('locked_at, locked_reason, grace_until')
    .eq('id', tenantId)
    .single()

  // Get subscription status
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('subscription_status')
    .eq('tenant_id', tenantId)
    .single()

  return {
    hasAccess: hasAccess || false,
    isLocked: !!tenant?.locked_at,
    lockedReason: tenant?.locked_reason,
    inGracePeriod: !!tenant?.grace_until && new Date(tenant.grace_until) > new Date(),
    subscriptionStatus: subscription?.subscription_status
  }
}

/**
 * API Route middleware to block locked tenants
 */
export async function requireTenantAccess(tenantId: string | null | undefined) {
  if (!tenantId) {
    return NextResponse.json(
      { error: 'Tenant ID required' },
      { status: 400 }
    )
  }

  const { hasAccess, isLocked, lockedReason } = await checkTenantAccess(tenantId)

  if (!hasAccess) {
    return NextResponse.json(
      {
        error: 'Access denied',
        details: isLocked ? `Account locked: ${lockedReason}` : 'No active subscription',
        code: 'TENANT_LOCKED'
      },
      { status: 403 }
    )
  }

  return null // Access granted
}

/**
 * Server Action helper to check tenant access
 */
export async function serverCheckTenantAccess(tenantId: string): Promise<void> {
  const { hasAccess, isLocked, lockedReason } = await checkTenantAccess(tenantId)

  if (!hasAccess) {
    throw new Error(
      isLocked
        ? `Account locked: ${lockedReason || 'Subscription expired'}`
        : 'No active subscription. Please upgrade your plan.'
    )
  }
}