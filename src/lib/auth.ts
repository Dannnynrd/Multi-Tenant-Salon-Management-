import { createSupabaseServer } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function getUser() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function requireAuth() {
  const user = await getUser()
  if (!user) {
    redirect('/auth/sign-in')
  }
  return user
}

export async function getUserProfile() {
  const supabase = await createSupabaseServer()
  const user = await requireAuth()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}

export async function getUserTenants() {
  const supabase = await createSupabaseServer()
  const user = await requireAuth()

  const { data: memberships } = await supabase
    .from('tenant_members')
    .select(`
      role,
      tenant:tenants (
        id,
        name,
        slug,
        logo_url
      )
    `)
    .eq('user_id', user.id)

  return memberships || []
}