import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import ModernBookingWidget from '../book/modern-booking-widget'

async function getTenantFromHeaders() {
  const headersList = await headers()
  const tenantId = headersList.get('x-tenant-id')
  const tenantSlug = headersList.get('x-tenant-slug')
  const tenantName = headersList.get('x-tenant-name')

  if (!tenantId || !tenantSlug) {
    return null
  }

  return {
    id: tenantId,
    slug: tenantSlug,
    name: tenantName || tenantSlug,
    status: 'active',
    booking_settings: {
      online_booking_enabled: true
    }
  }
}

export default async function BuchenPage() {
  // Get tenant from middleware headers
  const tenant = await getTenantFromHeaders()

  if (!tenant) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      {/* Salon Header */}
      <div className="max-w-6xl mx-auto px-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold">{tenant.name}</h1>
              <p className="text-muted-foreground">Ihr Salon für Schönheit und Wohlbefinden</p>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Widget */}
      <ModernBookingWidget
        tenantId={tenant.id}
        tenantSlug={tenant.slug}
        customerSession={null}
        isPreviewMode={false}
      />
    </div>
  )
}