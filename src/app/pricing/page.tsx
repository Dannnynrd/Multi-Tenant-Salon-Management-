'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'stripe-pricing-table': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          'pricing-table-id': string
          'publishable-key': string
          'customer-email'?: string
          'client-reference-id'?: string
          'customer-session-client-secret'?: string
        },
        HTMLElement
      >
    }
  }
}

export default function PricingPage() {
  const [clientSecret, setClientSecret] = useState<string>()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userEmail, setUserEmail] = useState<string>('')
  const [tenantId, setTenantId] = useState<string>('')
  const router = useRouter()

  useEffect(() => {
    // Load Stripe Pricing Table script
    const script = document.createElement('script')
    script.src = 'https://js.stripe.com/v3/pricing-table.js'
    script.async = true
    document.body.appendChild(script)

    // Check authentication and get tenant info
    checkAuthAndSetupStripe()

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  const checkAuthAndSetupStripe = async () => {
    const supabase = createSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      setIsAuthenticated(true)
      setUserEmail(user.email || '')

      // Get current tenant from cookie
      const currentTenantId = document.cookie
        .split('; ')
        .find(row => row.startsWith('current-tenant='))
        ?.split('=')[1]

      if (currentTenantId) {
        setTenantId(currentTenantId)

        // Check if tenant has access (has active subscription)
        const { data: hasAccess } = await supabase
          .rpc('tenant_has_access', { p_tenant_id: currentTenantId })

        // If no access, this is where they need to be (to select a plan)
        // Don't redirect them away
      }
    }
  }

  const handleSignUp = () => {
    router.push('/auth/sign-up')
  }

  // Determine back link - never go to dashboard if no subscription
  const getBackLink = () => {
    if (!isAuthenticated) return "/"
    // During onboarding, stay in pricing flow
    if (typeof window !== 'undefined' && window.location.search.includes('onboarding=true')) {
      return "/onboarding"
    }
    // Otherwise go to billing page (safe for locked tenants)
    return "/dashboard/billing"
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <Link href={getBackLink()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-4 w-4" />
                Zurück
              </Link>
              <span className="text-xl font-semibold">SalonManager</span>
            </div>
            <div className="flex items-center gap-4">
              {!isAuthenticated ? (
                <>
                  <Link href="/auth/sign-in">
                    <Button variant="outline">Anmelden</Button>
                  </Link>
                  <Link href="/auth/sign-up">
                    <Button>Kostenlos starten</Button>
                  </Link>
                </>
              ) : (
                <Link href="/dashboard/billing">
                  <Button variant="outline">Zur Abrechnung</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Wählen Sie Ihren Plan</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Starten Sie kostenlos und upgraden Sie, wenn Ihr Salon wächst.
              Alle Pläne beinhalten eine 30-tägige kostenlose Testphase.
            </p>
          </div>

          {/* Stripe Pricing Table */}
          <div className="max-w-6xl mx-auto">
            <stripe-pricing-table
              pricing-table-id="prctbl_1S6ZJePMAqsl9FoQ4sFTDwJ0"
              publishable-key="pk_test_51S3BUtPMAqsl9FoQzvAmJPGhRoYGNu65q0fjlQwp9Q9mal4jiUNRvpPiaC96z9XaQ75aORzzxqoN6484LuFxkm8100PJ53X2Ri"
              customer-email={userEmail || ""}
              client-reference-id={tenantId || ""}
            />
          </div>

          {!isAuthenticated && (
            <div className="mt-8 text-center">
              <p className="text-gray-600 mb-4">
                Sie müssen sich zuerst registrieren, um einen Plan auszuwählen.
              </p>
              <Button onClick={handleSignUp} size="lg">
                Jetzt registrieren
              </Button>
            </div>
          )}

          {/* Features */}
          <div className="mt-20 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">
              Alle Pläne beinhalten:
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Grundfunktionen</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>✓ Online-Terminbuchung</li>
                  <li>✓ Kundenverwaltung</li>
                  <li>✓ Service-Katalog</li>
                  <li>✓ Mobile App</li>
                  <li>✓ Mitarbeiterverwaltung</li>
                  <li>✓ Kalenderansicht</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Support & Sicherheit</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>✓ SSL-Verschlüsselung</li>
                  <li>✓ DSGVO-konform</li>
                  <li>✓ Tägliche Backups</li>
                  <li>✓ E-Mail Support</li>
                  <li>✓ 99.9% Uptime Garantie</li>
                  <li>✓ Sichere Zahlungsabwicklung</li>
                </ul>
              </div>
            </div>

            <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-2">
                30 Tage kostenlos testen
              </h3>
              <p className="text-blue-800">
                Testen Sie alle Features unverbindlich. Keine Kreditkarte erforderlich für die Testphase.
                Sie können jederzeit kündigen oder Ihren Plan wechseln.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}