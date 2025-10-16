'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Check, Loader2 } from 'lucide-react'

const PLANS = [
  {
    name: 'Starter',
    price: '€29',
    priceId: 'price_1S6YyYPMAqsl9FoQGskw5Bph', // Replace with your actual price ID
    features: [
      'Bis zu 3 Mitarbeiter',
      'Online-Buchungssystem',
      'Kundenverwaltung',
      'E-Mail Support',
    ],
  },
  {
    name: 'Professional',
    price: '€49',
    priceId: 'price_1S6YzTPMAqsl9FoQgB29CHwt', // Replace with your actual price ID
    popular: true,
    features: [
      'Bis zu 10 Mitarbeiter',
      'Alles aus Starter',
      'SMS-Erinnerungen',
      'Marketingtools',
      'Prioritäts-Support',
    ],
  },
  {
    name: 'Premium',
    price: '€199',
    priceId: 'price_1S6Z0NPMAqsl9FoQzUXQb5qU', // Replace with your actual price ID
    features: [
      'Unbegrenzte Mitarbeiter',
      'Alles aus Professional',
      'API-Zugang',
      'White-Label Option',
      'Dedizierter Account Manager',
    ],
  },
]

export default function PricingTestPage() {
  const [loading, setLoading] = useState<string | null>(null)

  const handleCheckout = async (priceId: string) => {
    try {
      setLoading(priceId)

      // Get current tenant
      const tenantId = document.cookie
        .split('; ')
        .find(row => row.startsWith('current-tenant='))
        ?.split('=')[1]

      if (!tenantId) {
        alert('Bitte erst einloggen und Salon erstellen')
        return
      }

      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Checkout creation failed')
      }
    } catch (error: any) {
      alert('Fehler: ' + error.message)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Test: Programmatischer Checkout</h1>
          <p className="text-xl text-gray-600">
            Diese Seite verwendet direkten Checkout statt Pricing Table
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Events werden korrekt an Stripe CLI weitergeleitet
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {PLANS.map((plan) => (
            <Card
              key={plan.name}
              className={plan.popular ? 'border-blue-500 shadow-lg' : ''}
            >
              {plan.popular && (
                <div className="bg-blue-500 text-white text-center py-1 text-sm font-medium">
                  Beliebteste Wahl
                </div>
              )}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-gray-600">/Monat</span>
                </div>
                <CardDescription>30 Tage kostenlose Testphase</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.popular ? 'default' : 'outline'}
                  onClick={() => handleCheckout(plan.priceId)}
                  disabled={loading !== null}
                >
                  {loading === plan.priceId ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Weiterleitung...
                    </>
                  ) : (
                    'Plan wählen'
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-12 max-w-2xl mx-auto">
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-yellow-900 mb-2">
                Warum diese Test-Seite?
              </h3>
              <p className="text-yellow-800 text-sm">
                Die Stripe Pricing Table sendet Events nicht an lokale Webhooks (Stripe CLI).
                Diese Seite verwendet programmatischen Checkout, wodurch Events korrekt
                an localhost weitergeleitet werden. Perfekt für lokale Entwicklung!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}