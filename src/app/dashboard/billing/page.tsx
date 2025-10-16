import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  CheckCircle2, AlertCircle, CreditCard, Sparkles,
  Calendar, Users, Package, ArrowUpRight, ExternalLink,
  FileText, Shield, Clock, ArrowRight, TrendingUp, Download
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { redirectToStripePortal, redirectToStripeCheckout } from './actions'
import { ExpandableFeatures } from './billing-client'
import { PlanCards } from './plan-cards'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'

export default async function BillingPage() {
  const supabase = await createClient()
  const cookieStore = await cookies()
  const tenantId = cookieStore.get('current-tenant')?.value

  if (!tenantId) {
    redirect('/dashboard')
  }

  // Get subscription details
  const { data: subscriptionData } = await supabase
    .rpc('get_tenant_subscription_details', { p_tenant_id: tenantId })

  const subscription = subscriptionData?.[0] || null

  // Get payment method info from Stripe if customer exists
  let paymentMethodLast4 = null
  if (subscription?.stripe_customer_id) {
    try {
      // Check if we have payment method info in stripe.customers table
      const { data: customerData } = await supabase
        .from('stripe.customers')
        .select('attrs')
        .eq('id', subscription.stripe_customer_id)
        .single()

      if (customerData?.attrs) {
        const attrs = typeof customerData.attrs === 'string' ? JSON.parse(customerData.attrs) : customerData.attrs
        // Try to get default payment method last4
        if (attrs?.invoice_settings?.default_payment_method) {
          // This would need additional API call to get payment method details
          // For now, we'll use a placeholder
        }
      }
    } catch (error) {
      console.error('Error fetching payment method:', error)
    }
  }

  // Get tenant access status
  const { data: accessStatus } = await supabase
    .rpc('get_tenant_access_status', { p_tenant_id: tenantId })
    .single()

  // Get feature list for current plan
  let planFeatures = null
  if (subscription?.tier_key) {
    const { data } = await supabase
      .from('tier_features')
      .select('feature_name, feature_key, category')
      .eq('tier_key', subscription.tier_key)
      .eq('enabled', true)
      .order('category, feature_name')
    planFeatures = data
  }

  // Calculate trial days left
  let trialDaysLeft = 0
  if (subscription?.trial_end) {
    const trialEnd = new Date(subscription.trial_end)
    const now = new Date()
    trialDaysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'bg-green-100 text-green-700 border-0'
      case 'trialing': return 'bg-blue-100 text-blue-700 border-0'
      case 'past_due': return 'bg-amber-100 text-amber-700 border-0'
      case 'canceled': return 'bg-red-100 text-red-700 border-0'
      default: return 'bg-gray-100 text-gray-700 border-0'
    }
  }

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'active': return 'Aktiv'
      case 'trialing': return `Testphase (${trialDaysLeft} Tage)`
      case 'past_due': return 'Zahlung überfällig'
      case 'canceled': return 'Gekündigt'
      default: return 'Kein Abonnement'
    }
  }

  // Available plans for display
  const plans = [
    {
      key: 'starter',
      name: 'Starter',
      price: 29,
      yearlyPrice: 290,
      description: 'Perfekt für kleine Salons',
      features: ['2 Mitarbeiter', 'Unbegrenzte Kunden', 'Online-Buchungen', 'Kalender', 'E-Mail Support'],
      limit: 2
    },
    {
      key: 'professional',
      name: 'Professional',
      price: 49,
      yearlyPrice: 399,
      description: 'Für wachsende Teams',
      features: ['10 Mitarbeiter', 'Alles aus Starter', 'Analytics', 'Marketing-Tools', 'Priority Support'],
      limit: 10,
      popular: true
    },
    {
      key: 'premium',
      name: 'Premium',
      price: 199,
      yearlyPrice: 1500,
      description: 'Für große Salons',
      features: ['Unbegrenzte Mitarbeiter', 'Alles aus Professional', 'Mehrere Standorte', 'API-Zugang', 'Dedizierter Support'],
      limit: '∞'
    }
  ]

  const currentPlan = plans.find(p => p.key === subscription?.tier_key)


  return (
    <div className="min-h-screen bg-white">
      <DashboardHeader
        title="Billing & Abonnement"
        subtitle="Verwalten Sie Ihren Plan über Stripe"
        action={
          subscription?.stripe_customer_id && (
            <form action={redirectToStripePortal}>
              <input type="hidden" name="tenantId" value={tenantId} />
              <Button type="submit" variant="default" size="sm" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                <span className="hidden sm:inline">Stripe Portal</span>
              </Button>
            </form>
          )
        }
      />

      <div className="max-w-7xl mx-auto px-8 py-6">
        {/* Warnings */}
        {accessStatus?.in_grace_period && (
          <Card className="mb-6 border-amber-100 bg-gradient-to-br from-amber-50/50 to-white">
            <CardContent className="p-6">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-amber-900">Zahlung ausstehend</p>
                  <p className="text-sm text-amber-700 mt-1">
                    Bitte aktualisieren Sie Ihre Zahlungsmethode bis zum{' '}
                    <span className="font-semibold">
                      {new Date(accessStatus.grace_until).toLocaleDateString('de-DE')}
                    </span>
                  </p>
                </div>
                {subscription?.stripe_customer_id && (
                  <form action={redirectToStripePortal}>
                    <input type="hidden" name="tenantId" value={tenantId} />
                    <Button type="submit" variant="outline" size="sm" className="gap-2 border-amber-200 hover:bg-amber-50">
                      <CreditCard className="h-4 w-4" />
                      Zahlung aktualisieren
                    </Button>
                  </form>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {accessStatus?.is_locked && (
          <Card className="mb-6 border-red-100 bg-gradient-to-br from-red-50/50 to-white">
            <CardContent className="p-6">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-red-900">Konto gesperrt</p>
                  <p className="text-sm text-red-700 mt-1">
                    Ihr Konto wurde gesperrt. Bitte wählen Sie einen Plan oder aktualisieren Sie Ihre Zahlung.
                  </p>
                </div>
                {subscription?.stripe_customer_id ? (
                  <form action={redirectToStripePortal}>
                    <input type="hidden" name="tenantId" value={tenantId} />
                    <Button type="submit" variant="outline" size="sm" className="gap-2 border-red-200 hover:bg-red-50">
                      <TrendingUp className="h-4 w-4" />
                      Plan ändern
                    </Button>
                  </form>
                ) : (
                  <form action={redirectToStripeCheckout}>
                    <input type="hidden" name="tenantId" value={tenantId} />
                    <input type="hidden" name="priceId" value="price_1S6YVVPMAqsl9FoQupEdKMqt" />
                    <Button type="submit" variant="outline" size="sm" className="gap-2 border-red-200 hover:bg-red-50">
                      <Sparkles className="h-4 w-4" />
                      Plan wählen
                    </Button>
                  </form>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Plan - Full Width */}
        <Card className="border-gray-100 mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-white p-6 border-b border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Aktueller Plan</h2>
                <p className="text-sm text-gray-500 mt-0.5">Ihre Subscription-Details und Features</p>
              </div>
              {subscription && (
                <Badge variant="secondary" className={getStatusColor(subscription.subscription_status)}>
                  {getStatusLabel(subscription.subscription_status)}
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
            {/* Plan, Price & Billing Details */}
            <div className="p-6">
              <div className="space-y-6">
                {/* Plan & Price */}
                <div>
                  <div className="flex items-baseline gap-3">
                    <h3 className="text-2xl font-bold text-gray-900">
                      {subscription?.plan_name || 'Testphase'}
                    </h3>
                    {subscription?.tier_key && (
                      <Badge variant="outline" className="text-xs">
                        {subscription.tier_key === 'starter' && '2 Mitarbeiter'}
                        {subscription.tier_key === 'professional' && '10 Mitarbeiter'}
                        {subscription.tier_key === 'premium' && 'Unbegrenzt'}
                      </Badge>
                    )}
                  </div>
                  {subscription?.price_eur ? (
                    <div className="mt-3">
                      <span className="text-3xl font-bold text-gray-900">€{subscription.price_eur}</span>
                      <span className="text-gray-500 ml-1">/{subscription.billing_interval === 'year' ? 'Jahr' : 'Monat'}</span>
                    </div>
                  ) : (
                    <div className="mt-3">
                      <p className="text-sm text-gray-500">14 Tage kostenlos testen</p>
                      {subscription?.trial_end && (
                        <p className="text-xs text-gray-400 mt-1">
                          Erste Zahlung am {new Date(subscription.trial_end).toLocaleDateString('de-DE')}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Trial Progress */}
                {subscription?.subscription_status === 'trialing' && trialDaysLeft > 0 && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-900">Testphase läuft</span>
                      <span className="text-sm font-semibold text-blue-700">
                        {trialDaysLeft} {trialDaysLeft === 1 ? 'Tag' : 'Tage'} verbleibend
                      </span>
                    </div>
                    <Progress value={((14 - trialDaysLeft) / 14) * 100} className="h-1.5" />
                    <p className="text-xs text-blue-600 mt-2">
                      Nächster Abrechnungszeitraum beginnt am {new Date(subscription.trial_end).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                )}

                {/* Next Billing */}
                {subscription?.current_period_end && subscription?.subscription_status === 'active' && (
                  <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Nächste Zahlung</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(subscription.current_period_end).toLocaleDateString('de-DE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                )}

                {/* Payment Method */}
                {subscription?.stripe_customer_id && (
                  <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Zahlungsmethode</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      •••• •••• •••• {paymentMethodLast4 || subscription.stripe_customer_id.slice(-4)}
                    </span>
                  </div>
                )}

                {/* Member since */}
                {subscription?.created && (
                  <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Kunde seit</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(subscription.created).toLocaleDateString('de-DE', {
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                )}

                {/* Cancellation Notice */}
                {subscription?.cancel_at_period_end && (
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-amber-900">Abo wird gekündigt</p>
                        <p className="text-amber-700 text-xs mt-0.5">
                          Endet am {new Date(subscription.current_period_end).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* No subscription */}
                {!subscription && (
                  <div className="text-center py-4">
                    <Package className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Kein aktives Abonnement</p>
                  </div>
                )}

                {/* Manage Button */}
                {subscription?.stripe_customer_id && (
                  <form action={redirectToStripePortal}>
                    <input type="hidden" name="tenantId" value={tenantId} />
                    <Button type="submit" variant="outline" size="sm" className="w-full gap-2">
                      <CreditCard className="h-4 w-4" />
                      Abonnement verwalten
                    </Button>
                  </form>
                )}
              </div>
            </div>

            {/* Features */}
            <div className="p-6 bg-gray-50/30">
              {planFeatures && planFeatures.length > 0 ? (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-900">Features</h4>
                    <span className="text-xs text-gray-500">{planFeatures.length} enthalten</span>
                  </div>
                  <ExpandableFeatures
                    features={planFeatures}
                    initialCount={9}
                    className="max-h-[350px] overflow-y-auto pr-2"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <Sparkles className="h-8 w-8 text-gray-300 mb-2" />
                  <p className="text-xs text-gray-500 text-center">Wählen Sie einen Plan<br/>für Features</p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Actions and Invoices - 2 Cards Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Quick Actions */}
          <Card className="border-gray-100">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">Aktionen</CardTitle>
                  <CardDescription>Verwalten Sie Ihr Abonnement</CardDescription>
                </div>
                <Shield className="h-5 w-5 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {subscription?.stripe_customer_id ? (
                  <>
                    <form action={redirectToStripePortal} className="w-full">
                      <input type="hidden" name="tenantId" value={tenantId} />
                      <Button type="submit" variant="outline" className="w-full justify-start gap-2 hover:bg-gray-50">
                        <CreditCard className="h-4 w-4" />
                        Zahlungsmethode verwalten
                      </Button>
                    </form>
                    <form action={redirectToStripePortal} className="w-full">
                      <input type="hidden" name="tenantId" value={tenantId} />
                      <Button type="submit" variant="outline" className="w-full justify-start gap-2 hover:bg-gray-50">
                        <TrendingUp className="h-4 w-4" />
                        Plan ändern oder kündigen
                      </Button>
                    </form>
                    <form action={redirectToStripePortal} className="w-full">
                      <input type="hidden" name="tenantId" value={tenantId} />
                      <Button type="submit" variant="outline" className="w-full justify-start gap-2 hover:bg-gray-50">
                        <FileText className="h-4 w-4" />
                        Alle Rechnungen anzeigen
                      </Button>
                    </form>
                  </>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 mb-4">
                      Wählen Sie einen Plan, um Ihr Abonnement zu starten
                    </p>
                    {plans.map((plan) => (
                      <form key={plan.key} action={redirectToStripeCheckout} className="w-full">
                        <input type="hidden" name="tenantId" value={tenantId} />
                        <input
                          type="hidden"
                          name="priceId"
                          value={
                            plan.key === 'starter' ? 'price_1S6YVfPMAqsl9FoQuxeA6x0F' :
                            plan.key === 'professional' ? 'price_1S6YVVPMAqsl9FoQupEdKMqt' :
                            'price_1S6YVEPMAqsl9FoQB7Pfjf5y'
                          }
                        />
                        <Button
                          type="submit"
                          variant={plan.popular ? "default" : "outline"}
                          className="w-full gap-2"
                        >
                          <Sparkles className="h-4 w-4" />
                          {plan.name} - €{plan.price}/Monat
                        </Button>
                      </form>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Invoices */}
          <Card className="border-gray-100">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">Letzte Rechnungen</CardTitle>
                  <CardDescription>Ihre letzten Zahlungen</CardDescription>
                </div>
                <FileText className="h-5 w-5 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              {subscription?.stripe_customer_id ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 mb-4">
                    Ihre Rechnungen werden automatisch von Stripe erstellt und per E-Mail versendet.
                  </p>

                  <form action={redirectToStripePortal} className="w-full">
                    <input type="hidden" name="tenantId" value={tenantId} />
                    <Button type="submit" variant="outline" className="w-full gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Rechnungen im Stripe Portal anzeigen
                    </Button>
                  </form>

                  <div className="pt-4 border-t">
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div className="text-xs text-gray-500">
                        <p>Rechnungen werden automatisch per E-Mail an die hinterlegte Adresse gesendet.</p>
                        <p className="mt-1">Im Stripe Portal können Sie alle vergangenen Rechnungen einsehen und herunterladen.</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">
                    Noch keine Rechnungen vorhanden
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Rechnungen werden angezeigt, sobald Sie einen Plan wählen
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Available Plans */}
        <Card className="border-gray-100">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Verfügbare Pläne</CardTitle>
                <CardDescription>Vergleichen Sie alle Optionen</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <PlanCards
              plans={plans}
              currentPlanKey={subscription?.tier_key}
              tenantId={tenantId}
              hasStripeCustomer={!!subscription?.stripe_customer_id}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}