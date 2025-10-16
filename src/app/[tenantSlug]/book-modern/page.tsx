import { createSupabaseServer } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ModernBookingWidget from '@/app/site/book/modern-booking-widget'

async function getTenantBySlug(slug: string) {
  const supabase = await createSupabaseServer()

  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .single()

  if (error || !tenant) {
    return null
  }

  return tenant
}

export default async function ModernBookingPage({
  params
}: {
  params: { tenantSlug: string }
}) {
  // Get tenant data
  const tenant = await getTenantBySlug(params.tenantSlug)

  if (!tenant) {
    notFound()
  }

  // Check if tenant allows online booking
  if (!tenant.booking_settings?.online_booking_enabled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-2">Online-Buchung nicht verfügbar</h1>
          <p className="text-muted-foreground">
            {tenant.name} bietet derzeit keine Online-Terminbuchung an.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      {/* Salon Header */}
      <div className="max-w-6xl mx-auto px-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-4">
            {tenant.logo_url && (
              <img
                src={tenant.logo_url}
                alt={tenant.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold">{tenant.name}</h1>
              <p className="text-muted-foreground">{tenant.tagline || 'Ihr Salon für Schönheit und Wohlbefinden'}</p>
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