import { createSupabaseServer } from '@/lib/supabase/server'
import { getTenantData } from '@/lib/tenant'

export default async function DebugCalendar() {
  const { tenantId } = await getTenantData()
  const supabase = await createSupabaseServer()

  // Test direct query
  const { data: appointments, error } = await supabase
    .from('calendar_events_v1')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('start_time', { ascending: true })

  // Check for Anna's appointment specifically
  const { data: annaAppointments } = await supabase
    .from('calendar_events_v1')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('staff_first_name', 'Anna')
    .gte('start_time', '2025-09-27T00:00:00')
    .lt('start_time', '2025-09-28T00:00:00')

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Calendar Debug</h1>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Total Appointments: {appointments?.length || 0}</h2>
        {error && <p className="text-red-600">Error: {error.message}</p>}
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Anna's Appointments on 27.09: {annaAppointments?.length || 0}</h2>
        {annaAppointments?.map((apt, idx) => (
          <div key={apt.id} className="p-4 mb-2 border rounded">
            <p><strong>#{idx + 1}</strong></p>
            <p><strong>Time:</strong> {new Date(apt.start_time).toLocaleString('de-DE')}</p>
            <p><strong>Title:</strong> {apt.title}</p>
            <p><strong>Customer:</strong> {apt.customer_name}</p>
            <p><strong>Price:</strong> €{apt.total_price}</p>
            <p><strong>Status:</strong> {apt.status}</p>
            <p><strong>Services Count:</strong> {apt.service_count || 1}</p>
          </div>
        ))}
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">All Appointments (first 10):</h2>
        {appointments?.slice(0, 10).map((apt, idx) => (
          <div key={apt.id} className="p-4 mb-2 border rounded">
            <p>
              <strong>#{idx + 1}</strong> {apt.staff_first_name} - {apt.title} -
              {new Date(apt.start_time).toLocaleString('de-DE')} -
              {apt.customer_name} - €{apt.total_price}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}