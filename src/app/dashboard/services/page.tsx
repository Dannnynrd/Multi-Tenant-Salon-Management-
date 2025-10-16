import { createSupabaseServer } from '@/lib/supabase/server'
import { getTenantData } from '@/lib/tenant'
import { notFound } from 'next/navigation'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import ServicesManager from './services-manager'

export default async function ServicesPage() {
  const { tenantId } = await getTenantData()

  if (!tenantId) {
    notFound()
  }

  const supabase = await createSupabaseServer()

  // Fetch services with categories
  const { data: services } = await supabase
    .from('services')
    .select('*, service_categories(id, name)')
    .eq('tenant_id', tenantId)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })

  // Fetch categories separately with their order
  const { data: categoriesData } = await supabase
    .from('service_categories')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('display_order', { ascending: true })

  return (
    <div className="min-h-screen bg-white">
      <DashboardHeader
        title="Services"
        subtitle="Verwalten Sie Ihre Salon-Services und Kategorien"
      />

      <div className="max-w-7xl mx-auto px-8 py-6">
        <ServicesManager
          initialServices={services || []}
          initialCategories={categoriesData || []}
          tenantId={tenantId}
        />
      </div>
    </div>
  )
}