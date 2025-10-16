import { createSupabaseServer } from '@/lib/supabase/server'
import { getTenantData } from '@/lib/tenant'
import { notFound } from 'next/navigation'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import StaffManager from './staff-manager'
import OwnerPrompt from './owner-prompt'

export default async function StaffPage() {
  const { tenantId } = await getTenantData()

  if (!tenantId) {
    notFound()
  }

  const supabase = await createSupabaseServer()

  // Get current user info
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch staff members with user_id
  const { data: staff } = await supabase
    .from('staff')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  // Check if current user is already a staff member
  const isUserStaff = staff?.some(s => s.email === user?.email)

  return (
    <div className="min-h-screen bg-white">
      <DashboardHeader
        title="Mitarbeiter"
        subtitle="Verwalten Sie Ihr Team und deren Verfügbarkeiten"
      />

      <div className="max-w-7xl mx-auto px-8 py-6">
        {/* Show owner prompt if no staff exists and current user is not staff */}
        {staff?.length === 0 && !isUserStaff && user && (
          <OwnerPrompt
            tenantId={tenantId}
            userEmail={user.email || ''}
            userName={user.user_metadata?.full_name || user.user_metadata?.name || null}
          />
        )}

        <StaffManager
          initialStaff={staff || []}
          tenantId={tenantId}
        />
      </div>
    </div>
  )
}