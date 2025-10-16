import { createSupabaseServer } from '@/lib/supabase/server'

export async function checkIfAdminOrStaff(tenantId: string): Promise<{
  isAdmin: boolean
  isStaff: boolean
  userId: string | null
}> {
  const supabase = await createSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { isAdmin: false, isStaff: false, userId: null }
  }

  // Check if user is admin or owner
  const { data: membership } = await supabase
    .from('tenant_members')
    .select('role')
    .eq('tenant_id', tenantId)
    .eq('user_id', user.id)
    .single()

  if (membership?.role === 'admin' || membership?.role === 'owner') {
    return { isAdmin: true, isStaff: false, userId: user.id }
  }

  // Check if user has staff role
  return {
    isAdmin: false,
    isStaff: membership?.role === 'staff',
    userId: user.id
  }
}