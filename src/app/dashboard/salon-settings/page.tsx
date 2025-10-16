import { Metadata } from 'next'
import { getTenantData } from '@/lib/tenant'
import { createSupabaseServer } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { checkIfAdminOrStaff } from '@/lib/tenant-auth'
import SalonSettingsForm from './salon-settings-form'

export const metadata: Metadata = {
  title: 'Salon-Einstellungen',
  description: 'Verwalten Sie Ihre Salon-Einstellungen'
}

export default async function SettingsPage() {
  const { tenantId } = await getTenantData()
  if (!tenantId) redirect('/auth/login')

  // Check if user is admin
  const { isAdmin } = await checkIfAdminOrStaff(tenantId)
  if (!isAdmin) {
    redirect('/dashboard')
  }

  const supabase = await createSupabaseServer()

  // Get tenant settings
  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single()

  if (error || !tenant) {
    console.error('Error fetching tenant:', error)
    redirect('/dashboard')
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Salon-Einstellungen</h2>
      </div>

      <div className="grid gap-6">
        <SalonSettingsForm initialData={tenant} tenantId={tenantId} />
      </div>
    </div>
  )
}