import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard/DashboardShell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createSupabaseServer()

  // Get user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  console.log('Dashboard Layout - User ID:', user.id)

  // Get user's tenants from memberships
  const { data: memberships, error: membershipError } = await supabase
    .from('tenant_members')
    .select(`
      role,
      tenant:tenants (
        id,
        name,
        slug,
        locked_at
      )
    `)
    .eq('user_id', user.id)

  console.log('Memberships query:', { memberships, error: membershipError })

  // Also check staff table
  const { data: staffRecords, error: staffError } = await supabase
    .from('staff')
    .select(`
      role,
      tenant:tenants (
        id,
        name,
        slug,
        locked_at
      )
    `)
    .eq('user_id', user.id)
    .eq('is_active', true)

  console.log('Staff query:', { staffRecords, error: staffError })

  // Combine all tenant sources
  let allTenants: any[] = []

  if (memberships && memberships.length > 0) {
    allTenants = memberships
  }

  if (staffRecords && staffRecords.length > 0) {
    allTenants = [...allTenants, ...staffRecords]
  }

  // If still no tenants, try direct query (for debugging)
  if (allTenants.length === 0) {
    const { data: directCheck } = await supabase
      .from('tenant_members')
      .select('*')
      .eq('user_id', user.id)

    console.log('Direct membership check:', directCheck)

    const { data: tenantCheck } = await supabase
      .from('tenants')
      .select('*')

    console.log('All tenants:', tenantCheck)
  }

  if (!allTenants || allTenants.length === 0) {
    console.log('No tenants found for user:', user.id)

    // For debugging: Don't redirect, show error
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Tenant Access Issue</h1>
        <p className="mb-2">User ID: {user.id}</p>
        <p className="mb-2">Email: {user.email}</p>
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <p className="font-semibold">Debug Info:</p>
          <p>Memberships: {JSON.stringify(memberships)}</p>
          <p>Staff: {JSON.stringify(staffRecords)}</p>
          <p>Membership Error: {membershipError?.message}</p>
          <p>Staff Error: {staffError?.message}</p>
        </div>
        <div className="mt-4">
          <a href="/auth/logout" className="text-blue-500 underline">Logout</a>
        </div>
      </div>
    )
  }

  // Get current tenant from cookie or use first tenant
  const cookieStore = await cookies()
  let currentTenantId = cookieStore.get('current-tenant')?.value

  // Verify user has access to this tenant, or use first tenant
  const hasAccess = currentTenantId && allTenants.some(m => m.tenant?.id === currentTenantId)
  if (!hasAccess) {
    currentTenantId = allTenants[0].tenant?.id || ''
  }

  // Get current tenant details
  const currentMembership = allTenants.find(m => m.tenant?.id === currentTenantId)
  const currentTenant = currentMembership?.tenant

  if (!currentTenant) {
    redirect('/onboarding')
  }

  // Get subscription details for current tenant
  const { data: subDetails } = await supabase
    .rpc('get_tenant_subscription_details', { p_tenant_id: currentTenantId })

  const subscription = subDetails?.[0] ? {
    status: subDetails[0].subscription_status,
    plan: subDetails[0].tier_key || 'starter',
    trialEnd: subDetails[0].trial_end,
  } : undefined

  return (
    <DashboardShell
      tenantId={currentTenant.id}
      tenantName={currentTenant.name}
      userEmail={user.email || ''}
      subscription={subscription}
    >
      {children}
    </DashboardShell>
  )
}