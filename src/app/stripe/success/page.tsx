'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createSupabaseClient } from '@/lib/supabase/client'

function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('session_id')
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string>()

  useEffect(() => {
    if (sessionId) {
      checkSubscription()
    } else {
      setError('Keine Session ID gefunden')
      setLoading(false)
    }
  }, [sessionId])

  const checkSubscription = async () => {
    try {
      const supabase = createSupabaseClient()

      // Get current tenant
      const tenantId = document.cookie
        .split('; ')
        .find(row => row.startsWith('current-tenant='))
        ?.split('=')[1]

      if (!tenantId) {
        setError('Kein Salon ausgewählt')
        return
      }

      // Try to sync subscription from Stripe first
      const syncResponse = await fetch('/api/tenant/update-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId })
      })

      const syncResult = await syncResponse.json()
      console.log('Sync result:', syncResult)

      // Multiple retry attempts with increasing delays
      const delays = [2000, 3000, 4000, 5000] // Total: 14 seconds of retries
      let subscriptionFound = false

      for (const delay of delays) {
        await new Promise(resolve => setTimeout(resolve, delay))

        // Check subscription again
        const { data: subscriptionDetails } = await supabase
          .rpc('get_tenant_subscription_details', { p_tenant_id: tenantId })

        const { data: hasAccess } = await supabase
          .rpc('tenant_has_access', { p_tenant_id: tenantId })

        if (subscriptionDetails?.[0]?.stripe_subscription_id || hasAccess) {
          subscriptionFound = true
          break
        }

        // Try to sync again
        const retrySync = await fetch('/api/tenant/update-access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tenantId })
        })

        const retrySyncResult = await retrySync.json()
        console.log(`Retry ${delays.indexOf(delay) + 1} sync result:`, retrySyncResult)

        if (retrySyncResult.success && retrySyncResult.subscription) {
          subscriptionFound = true
          break
        }
      }

      if (subscriptionFound) {
        setSuccess(true)

        // One final sync to ensure everything is up to date
        await fetch('/api/tenant/update-access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tenantId })
        })
      } else {
        // Show detailed error with manual refresh option
        setError('Die Subscription-Verarbeitung dauert länger als erwartet. Bitte aktualisieren Sie die Seite oder versuchen Sie es in einigen Sekunden erneut.')
      }
    } catch (err: any) {
      console.error('Subscription check error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleContinue = () => {
    router.push('/dashboard')
  }

  const handleRetry = () => {
    setLoading(true)
    setError(undefined)
    checkSubscription()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
              <h2 className="text-xl font-semibold">Zahlung wird verarbeitet...</h2>
              <p className="text-gray-600 text-center">
                Bitte warten Sie einen Moment, während wir Ihre Subscription einrichten.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <XCircle className="h-12 w-12 text-red-600" />
              <h2 className="text-xl font-semibold">Fehler aufgetreten</h2>
              <p className="text-gray-600 text-center">{error}</p>
              <div className="flex gap-2 mt-4">
                <Button onClick={handleRetry} variant="outline">
                  Erneut versuchen
                </Button>
                <Button onClick={handleContinue}>
                  Zum Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-600" />
            </div>
            <CardTitle className="text-center text-2xl">
              Zahlung erfolgreich!
            </CardTitle>
            <CardDescription className="text-center">
              Ihre Subscription wurde erfolgreich eingerichtet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">
                  Was passiert jetzt?
                </h3>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>✓ 30-tägige kostenlose Testphase wurde aktiviert</li>
                  <li>✓ Alle Premium-Features sind freigeschaltet</li>
                  <li>✓ Sie können jederzeit kündigen oder upgraden</li>
                  <li>✓ Erste Zahlung erfolgt nach der Testphase</li>
                </ul>
              </div>

              <Button onClick={handleContinue} className="w-full" size="lg">
                Zum Dashboard
              </Button>

              <p className="text-xs text-center text-gray-500">
                Sie können Ihre Subscription jederzeit im Dashboard unter Einstellungen verwalten.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}

export default function StripeSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}