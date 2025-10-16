import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCustomerSession } from '@/lib/customer-auth'
import { checkIfAdminOrStaff } from '@/lib/tenant-auth'
import ProfessionalBookingWidget from './professional-booking-widget'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { Shield, LogOut } from 'lucide-react'

async function getTenantData() {
  const headersList = await headers()
  const tenantId = headersList.get('x-tenant-id')
  const tenantSlug = headersList.get('x-tenant-slug')

  if (!tenantId || !tenantSlug) {
    return null
  }

  const supabase = await createClient()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single()

  return { ...tenant, tenantId, tenantSlug }
}

export default async function BookingPage() {
  const tenant = await getTenantData()

  if (!tenant) {
    notFound()
  }

  // Check if admin or staff
  const { isAdmin, isStaff, userId } = await checkIfAdminOrStaff(tenant.tenantId)

  // If admin or staff, show warning
  if (isAdmin || isStaff) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto p-4">
          <Card className="p-8">
            <div className="flex items-center mb-6">
              <Shield className="h-8 w-8 text-orange-500 mr-3" />
              <h2 className="text-2xl font-bold">Admin/Mitarbeiter-Ansicht</h2>
            </div>

            <Alert className="mb-6 bg-orange-50 border-orange-200">
              <AlertDescription className="text-orange-800">
                Sie sind als {isAdmin ? 'Administrator' : 'Mitarbeiter'} eingeloggt.
                Diese Ansicht dient nur zur Vorschau. Es wird kein echter Termin erstellt.
              </AlertDescription>
            </Alert>

            <p className="mb-6 text-gray-600">
              Falls Sie einen Termin für sich selbst buchen möchten,
              müssen Sie sich zuerst ausloggen und als Kunde wieder anmelden.
            </p>

            <div className="mb-8">
              <p className="text-sm text-gray-500">
                Nutzen Sie das Menü oben rechts im Header für Navigation und Logout.
              </p>
            </div>

            <div className="border-t pt-8">
              <h3 className="text-lg font-semibold mb-4">Vorschau-Modus</h3>
              <p className="text-sm text-gray-600 mb-6">
                Sie können die Buchungsseite trotzdem ansehen (ohne echte Buchung):
              </p>
              <ProfessionalBookingWidget
                tenantId={tenant.tenantId}
                tenantSlug={tenant.tenantSlug}
                customerSession={undefined}
                isPreviewMode={true}
              />
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // Normal customer flow
  const customerSession = await getCustomerSession()

  return (
    <ProfessionalBookingWidget
      tenantId={tenant.tenantId}
      tenantSlug={tenant.tenantSlug}
      customerSession={customerSession || undefined}
      isPreviewMode={false}
    />
  )
}