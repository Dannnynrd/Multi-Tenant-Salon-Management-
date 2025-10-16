'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

export default function OnboardingPage() {
  const [salonName, setSalonName] = useState('')
  const [slug, setSlug] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [existingTenant, setExistingTenant] = useState<any>(null)
  const [checkingTenant, setCheckingTenant] = useState(true)
  const router = useRouter()
  const supabase = createSupabaseClient()

  useEffect(() => {
    checkExistingTenant()
  }, [])

  const checkExistingTenant = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Check if user already has a tenant
      const { data: tenants } = await supabase
        .from('tenants')
        .select('*')
        .eq('name', user.email)
        .single()

      if (tenants) {
        setExistingTenant(tenants)

        // If tenant already has proper name and slug, check subscription
        if (tenants.slug && tenants.slug !== tenants.name?.replace(/[@.]/g, '')) {
          // Tenant is already set up, check if they have subscription
          const { data: subscription } = await supabase
            .from('subscriptions')
            .select('stripe_subscription_id')
            .eq('tenant_id', tenants.id)
            .single()

          if (subscription?.stripe_subscription_id) {
            // Already has subscription, go to dashboard
            document.cookie = `current-tenant=${tenants.id}; path=/; max-age=${60 * 60 * 24 * 30}`
            router.push('/dashboard')
          } else {
            // Has tenant but no subscription, go to pricing
            document.cookie = `current-tenant=${tenants.id}; path=/; max-age=${60 * 60 * 24 * 30}`
            router.push('/pricing?onboarding=true')
          }
        } else {
          // Tenant exists but needs proper setup
          setSalonName(tenants.name || '')
          setSlug(tenants.slug || '')
        }
      }
    } catch (err) {
      console.error('Error checking tenant:', err)
    } finally {
      setCheckingTenant(false)
    }
  }

  const handleUpdateOrCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Nicht angemeldet')
        setLoading(false)
        return
      }

      let tenant = existingTenant
      const finalSlug = slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

      if (existingTenant) {
        // Update existing tenant
        const { data: updatedTenant, error: updateError } = await supabase
          .from('tenants')
          .update({
            slug: finalSlug,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingTenant.id)
          .select()
          .single()

        if (updateError) {
          if (updateError.message.includes('duplicate key')) {
            setError('Dieser URL-Slug ist bereits vergeben. Bitte wählen Sie einen anderen.')
          } else {
            setError(updateError.message)
          }
          setLoading(false)
          return
        }
        tenant = updatedTenant
      } else {
        // Create new tenant (shouldn't happen normally)
        const { data: newTenant, error: tenantError } = await supabase
          .from('tenants')
          .insert({
            name: user.email,
            slug: finalSlug,
          })
          .select()
          .single()

        if (tenantError) {
          if (tenantError.message.includes('duplicate key')) {
            setError('Dieser URL-Slug ist bereits vergeben. Bitte wählen Sie einen anderen.')
          } else {
            setError(tenantError.message)
          }
          setLoading(false)
          return
        }
        tenant = newTenant

        // Create membership as OWNER
        await supabase
          .from('tenant_members')
          .insert({
            tenant_id: tenant.id,
            user_id: user.id,
            role: 'OWNER',
          })
      }

      // Set current tenant cookie
      document.cookie = `current-tenant=${tenant.id}; path=/; max-age=${60 * 60 * 24 * 30}`

      // Check if tenant already has subscription
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('stripe_subscription_id')
        .eq('tenant_id', tenant.id)
        .single()

      if (subscription?.stripe_subscription_id) {
        // Already has subscription, go to dashboard
        router.push('/dashboard')
      } else {
        // Redirect to pricing to select a plan
        router.push('/pricing?onboarding=true')
      }
    } catch (err) {
      console.error('Error:', err)
      setError('Ein Fehler ist aufgetreten')
      setLoading(false)
    }
  }

  const handleSlugChange = (value: string) => {
    setSlug(value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
  }

  if (checkingTenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Willkommen! 👋</CardTitle>
          <CardDescription>
            {existingTenant
              ? 'Vervollständigen Sie Ihre Salon-Einrichtung'
              : 'Lassen Sie uns Ihren Salon einrichten'}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleUpdateOrCreateTenant}>
          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                <p>{error}</p>
              </div>
            )}

            {existingTenant && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-blue-800 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  <p className="font-medium">Salon bereits erstellt</p>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  Wählen Sie einen URL-Slug für Ihren Salon.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="salonName">Ihre E-Mail</Label>
              <Input
                id="salonName"
                type="text"
                value={existingTenant?.name || salonName}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-600">
                Dies ist Ihre Anmelde-E-Mail
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">URL-Slug *</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">salonmanager.de/</span>
                <Input
                  id="slug"
                  type="text"
                  placeholder="haar-studio-berlin"
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  required
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-gray-600">
                Dies wird Ihre eindeutige URL sein (nur Kleinbuchstaben, Zahlen und Bindestriche)
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800 font-medium mb-1">
                Zahlungsinformationen erforderlich
              </p>
              <p className="text-sm text-amber-700">
                Nach der Einrichtung wählen Sie einen Plan. Sie erhalten 30 Tage kostenlose Testphase,
                müssen aber Zahlungsdaten hinterlegen, um auf das Dashboard zuzugreifen.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={loading || !slug}
            >
              {loading ? 'Speichern...' : 'Weiter zum Plan wählen'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}