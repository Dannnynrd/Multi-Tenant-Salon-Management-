import { createSupabaseServer } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileSettings from './profile-settings'
import { getTenantData } from '@/lib/tenant'

export default async function SettingsPage() {
  const supabase = await createSupabaseServer()
  const { tenantId } = await getTenantData()

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/auth/login')
  }

  // Get profile data
  const [profileData, staffData, membershipData] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('staff').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('tenant_members').select('*').eq('user_id', user.id).maybeSingle()
  ])

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Profil-Einstellungen</h1>
        <p className="text-gray-600 mt-2">Verwalten Sie Ihre persönlichen Einstellungen und Profildaten</p>
      </div>

      <ProfileSettings
        user={user}
        profile={profileData.data}
        staff={staffData.data}
        membership={membershipData.data}
        tenantId={tenantId}
      />
    </div>
  )
}