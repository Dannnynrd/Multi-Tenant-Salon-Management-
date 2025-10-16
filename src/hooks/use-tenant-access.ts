'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface TenantAccessStatus {
  hasAccess: boolean
  isLocked: boolean
  lockedReason?: string
  inGracePeriod: boolean
  graceUntil?: string
  subscriptionStatus?: string
  loading: boolean
}

export function useTenantAccess(tenantId: string | null) {
  const [status, setStatus] = useState<TenantAccessStatus>({
    hasAccess: false,
    isLocked: false,
    inGracePeriod: false,
    loading: true
  })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!tenantId) {
      setStatus(prev => ({ ...prev, loading: false }))
      return
    }

    checkAccess()

    // Set up real-time subscription
    const channel = supabase
      .channel(`tenant-${tenantId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tenants',
          filter: `id=eq.${tenantId}`
        },
        () => {
          checkAccess()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'subscriptions',
          filter: `tenant_id=eq.${tenantId}`
        },
        () => {
          checkAccess()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }

    async function checkAccess() {
      try {
        // Check tenant access
        const { data: hasAccess } = await supabase
          .rpc('tenant_has_access', { p_tenant_id: tenantId })

        // Get detailed tenant status
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

        setStatus({
          hasAccess: hasAccess || false,
          isLocked: !!tenant?.locked_at,
          lockedReason: tenant?.locked_reason,
          inGracePeriod: !!tenant?.grace_until && new Date(tenant.grace_until) > new Date(),
          graceUntil: tenant?.grace_until,
          subscriptionStatus: subscription?.subscription_status,
          loading: false
        })
      } catch (error) {
        console.error('Error checking tenant access:', error)
        setStatus(prev => ({ ...prev, loading: false }))
      }
    }
  }, [tenantId, supabase, router])

  return status
}

// Component to wrap protected content
export function TenantAccessGuard({
  children,
  tenantId,
  redirectTo = '/dashboard/billing',
  showBlockedMessage = true
}: {
  children: React.ReactNode
  tenantId: string | null
  redirectTo?: string
  showBlockedMessage?: boolean
}) {
  const { hasAccess, isLocked, lockedReason, inGracePeriod, graceUntil, loading } = useTenantAccess(tenantId)
  const router = useRouter()

  useEffect(() => {
    if (!loading && !hasAccess && redirectTo) {
      router.push(redirectTo)
    }
  }, [loading, hasAccess, redirectTo, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!hasAccess && showBlockedMessage) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Zugriff verweigert
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  {isLocked
                    ? `Ihr Konto wurde gesperrt. ${lockedReason || 'Bitte aktualisieren Sie Ihr Abonnement.'}`
                    : 'Sie haben keinen Zugriff auf diese Funktion.'}
                </p>
                {inGracePeriod && graceUntil && (
                  <p className="mt-2">
                    Sie befinden sich in der Kulanzfrist bis{' '}
                    {new Date(graceUntil).toLocaleDateString('de-DE')}.
                    Bitte aktualisieren Sie Ihre Zahlung, um den vollen Zugriff zu behalten.
                  </p>
                )}
              </div>
              <div className="mt-4">
                <button
                  onClick={() => router.push('/dashboard/billing')}
                  className="text-sm font-medium text-red-800 hover:text-red-700"
                >
                  Zum Billing →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!hasAccess) {
    return null
  }

  return <>{children}</>
}