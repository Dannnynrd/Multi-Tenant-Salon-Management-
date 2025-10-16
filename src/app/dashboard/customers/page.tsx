import { Suspense } from 'react'
import { createSupabaseServer } from '@/lib/supabase/server'
import { getTenantData } from '@/lib/tenant'
import { notFound } from 'next/navigation'
import CustomerList from './customer-list'
import { Card } from '@/components/ui/card'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'

export default async function CustomersPage() {
  const { tenantId, tenantSlug } = await getTenantData()

  if (!tenantId) {
    notFound()
  }

  const supabase = await createSupabaseServer()

  // Fetch customers
  const { data: customers } = await supabase
    .from('customers')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  // Get subscription tier to check features
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*, plans!inner(tier_key)')
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .single()

  const tier = subscription?.plans?.tier_key || 'starter'
  const hasAdvancedCRM = tier === 'professional' || tier === 'premium'

  // Get appointment counts for each customer
  const customerIds = customers?.map(c => c.id) || []
  let appointmentCountMap = new Map<string, number>()

  if (customerIds.length > 0) {
    const { data: appointmentCounts } = await supabase
      .from('appointments')
      .select('customer_id')
      .eq('tenant_id', tenantId)
      .in('customer_id', customerIds)

    // Create appointment count map
    appointmentCounts?.forEach(apt => {
      const count = appointmentCountMap.get(apt.customer_id) || 0
      appointmentCountMap.set(apt.customer_id, count + 1)
    })
  }

  // Enhance customers with appointment counts
  const enhancedCustomers = customers?.map(customer => ({
    ...customer,
    appointment_count: appointmentCountMap.get(customer.id) || 0
  })) || []

  return (
    <div className="min-h-screen bg-white">
      <DashboardHeader
        title="Kunden"
        subtitle="Verwalten Sie Ihre Kundendaten und Kontaktinformationen"
      />

      <div className="max-w-7xl mx-auto px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <div className="p-6">
              <p className="text-sm font-medium text-gray-600">Gesamtkunden</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">
                {customers?.length || 0}
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <p className="text-sm font-medium text-gray-600">Neue Kunden</p>
              <p className="text-xs text-gray-500 mt-0.5">Letzte 30 Tage</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">
                {customers?.filter(c => {
                  const createdAt = new Date(c.created_at)
                  const thirtyDaysAgo = new Date()
                  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
                  return createdAt > thirtyDaysAgo
                }).length || 0}
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <p className="text-sm font-medium text-gray-600">Mit Terminen</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">
                {[...appointmentCountMap.keys()].length}
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <p className="text-sm font-medium text-gray-600">Aktive Kunden</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">
                {customers?.filter(c => c.status === 'active').length || customers?.length || 0}
              </p>
            </div>
          </Card>
        </div>

        {/* Customer List */}
        <Suspense fallback={
          <Card className="p-12">
            <div className="text-center text-gray-500">Lade Kundendaten...</div>
          </Card>
        }>
          <CustomerList
            customers={enhancedCustomers}
            hasAdvancedCRM={hasAdvancedCRM}
            tenantId={tenantId}
          />
        </Suspense>
      </div>
    </div>
  )
}