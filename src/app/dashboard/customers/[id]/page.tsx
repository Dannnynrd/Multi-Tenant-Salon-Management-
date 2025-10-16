import { createSupabaseServer } from '@/lib/supabase/server'
import { getTenantData } from '@/lib/tenant'
import { notFound } from 'next/navigation'
import CustomerDetailView from './customer-detail-view'
import { ArrowLeft, User } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface PageProps {
  params: {
    id: string
  }
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const { tenantId } = await getTenantData()

  if (!tenantId) {
    notFound()
  }

  const supabase = await createSupabaseServer()

  // Fetch customer
  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('id', params.id)
    .eq('tenant_id', tenantId)
    .single()

  if (!customer) {
    notFound()
  }

  // Check features
  const { data: features } = await supabase
    .from('tenant_features')
    .select('feature_key')
    .eq('tenant_id', tenantId)
    .eq('enabled', true)

  const hasAdvancedCRM = features?.some(f => f.feature_key === 'advanced_crm') || false

  // Fetch appointments (for Professional plan)
  let appointments = []
  if (hasAdvancedCRM) {
    const { data: appointmentData } = await supabase
      .from('appointments')
      .select(`
        *,
        service:services(name, duration, price),
        staff:staff(name)
      `)
      .eq('customer_id', customer.id)
      .eq('tenant_id', tenantId)
      .order('start_time', { ascending: false })

    appointments = appointmentData || []
  }

  return (
    <div className="flex-1 space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="hover:bg-gray-100"
          >
            <Link href="/dashboard/customers">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {customer.first_name} {customer.last_name}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">Kundendetails</p>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Details */}
      <CustomerDetailView
        customer={customer}
        appointments={appointments}
        hasAdvancedCRM={hasAdvancedCRM}
        tenantId={tenantId}
      />
    </div>
  )
}