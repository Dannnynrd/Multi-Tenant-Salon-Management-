import { createSupabaseServer } from '@/lib/supabase/server'
import { getTenantData } from '@/lib/tenant'
import { notFound } from 'next/navigation'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import CalendarView from './calendar-view'

export default async function CalendarPage() {
  const { tenantId } = await getTenantData()

  if (!tenantId) {
    notFound()
  }

  const supabase = await createSupabaseServer()

  // Fetch appointments from calendar view - get all appointments to show full calendar
  const { data: appointments } = await supabase
    .from('calendar_events_v1')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('start_time', { ascending: true })

  // Fetch staff members for the appointment modal
  const { data: staff } = await supabase
    .from('staff')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .eq('can_book_appointments', true)
    .order('first_name', { ascending: true })

  // Fetch services for the appointment modal
  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  // Fetch customers for the appointment modal
  const { data: customers } = await supabase
    .from('customers')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('first_name', { ascending: true })

  return (
    <div className="min-h-screen bg-white">
      <DashboardHeader
        title="Kalender"
        subtitle="Termine verwalten und planen"
      />

      <div className="px-8 py-6">
        <CalendarView
          initialAppointments={appointments || []}
          staff={staff || []}
          services={services || []}
          customers={customers || []}
          tenantId={tenantId}
        />
      </div>
    </div>
  )
}