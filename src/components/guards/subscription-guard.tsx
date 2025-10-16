'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Lock, AlertCircle, CreditCard } from 'lucide-react'

interface SubscriptionGuardProps {
  children: React.ReactNode
  tenantId: string
  requiredFeature?: string
  fallback?: React.ReactNode
}

export function SubscriptionGuard({
  children,
  tenantId,
  requiredFeature,
  fallback
}: SubscriptionGuardProps) {
  const [loading, setLoading] = useState(true)
  const [accessStatus, setAccessStatus] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAccess()
  }, [tenantId, requiredFeature])

  async function checkAccess() {
    try {
      // Get tenant access status
      const { data, error } = await supabase
        .rpc('get_tenant_access_status', { p_tenant_id: tenantId })
        .single()

      if (error) throw error

      setAccessStatus(data)

      // Check feature if required
      if (requiredFeature && data?.features) {
        const hasFeature = data.features.includes(requiredFeature)
        if (!hasFeature) {
          setAccessStatus(prev => ({
            ...prev,
            has_access: false,
            missing_feature: requiredFeature
          }))
        }
      }
    } catch (error) {
      console.error('Error checking access:', error)
      setAccessStatus({ has_access: false, error: true })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // No access - show appropriate message
  if (!accessStatus?.has_access) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="flex items-center justify-center min-h-[400px] p-4">
        <Card className="max-w-md w-full p-6 space-y-4">
          {/* Locked Account */}
          {accessStatus?.is_locked && (
            <>
              <div className="flex items-center space-x-2 text-destructive">
                <Lock className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Konto gesperrt</h3>
              </div>
              <p className="text-muted-foreground">
                Ihr Konto wurde aufgrund einer ausstehenden Zahlung oder eines abgelaufenen Abonnements gesperrt.
              </p>
              <Button
                onClick={() => router.push('/dashboard/billing')}
                className="w-full"
              >
                Zur Abrechnung
              </Button>
            </>
          )}

          {/* Grace Period */}
          {accessStatus?.in_grace_period && !accessStatus?.is_locked && (
            <>
              <div className="flex items-center space-x-2 text-warning">
                <AlertCircle className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Zahlung ausstehend</h3>
              </div>
              <p className="text-muted-foreground">
                Ihre letzte Zahlung ist fehlgeschlagen. Bitte aktualisieren Sie Ihre Zahlungsmethode bis{' '}
                {new Date(accessStatus.grace_until).toLocaleDateString('de-DE')}.
              </p>
              <Button
                onClick={() => router.push('/dashboard/billing')}
                className="w-full"
                variant="warning"
              >
                Zahlungsmethode aktualisieren
              </Button>
            </>
          )}

          {/* No Subscription */}
          {accessStatus?.subscription_status === 'none' && (
            <>
              <div className="flex items-center space-x-2 text-primary">
                <CreditCard className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Abonnement erforderlich</h3>
              </div>
              <p className="text-muted-foreground">
                Wählen Sie einen Plan, um diese Funktion zu nutzen.
              </p>
              <Button
                onClick={() => router.push('/dashboard/billing')}
                className="w-full"
              >
                Plan auswählen
              </Button>
            </>
          )}

          {/* Missing Feature */}
          {accessStatus?.missing_feature && (
            <>
              <div className="flex items-center space-x-2 text-primary">
                <AlertCircle className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Upgrade erforderlich</h3>
              </div>
              <p className="text-muted-foreground">
                Die Funktion "{accessStatus.missing_feature}" ist in Ihrem aktuellen Plan ({accessStatus.plan_name}) nicht enthalten.
              </p>
              <Button
                onClick={() => router.push('/dashboard/billing')}
                className="w-full"
              >
                Plan upgraden
              </Button>
            </>
          )}

          {/* Generic Error */}
          {accessStatus?.error && (
            <Alert variant="destructive">
              <AlertDescription>
                Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.
              </AlertDescription>
            </Alert>
          )}
        </Card>
      </div>
    )
  }

  // Has access - show children
  return <>{children}</>
}

// Hook for programmatic access checks
export function useSubscriptionStatus(tenantId: string) {
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (tenantId) {
      checkStatus()
    }
  }, [tenantId])

  async function checkStatus() {
    try {
      const { data, error } = await supabase
        .rpc('get_tenant_access_status', { p_tenant_id: tenantId })
        .single()

      if (error) throw error
      setStatus(data)
    } catch (error) {
      console.error('Error checking subscription status:', error)
      setStatus(null)
    } finally {
      setLoading(false)
    }
  }

  return {
    ...status,
    loading,
    hasFeature: (featureKey: string) => status?.features?.includes(featureKey) || false,
    requiresUpgrade: (featureKey: string) => !status?.features?.includes(featureKey)
  }
}