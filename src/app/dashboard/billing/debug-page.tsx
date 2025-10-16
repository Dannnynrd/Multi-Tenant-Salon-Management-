import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export default async function DebugPage() {
  const supabase = await createClient()
  const cookieStore = await cookies()
  const tenantId = cookieStore.get('current-tenant')?.value

  // Debug: Get all data
  const { data: subscription, error: subError } = await supabase
    .from('active_subscriptions')
    .select('*')
    .eq('tenant_id', tenantId)
    .single()

  const { data: accessStatus, error: accessError } = await supabase
    .rpc('get_tenant_access_status', { p_tenant_id: tenantId })
    .single()

  const { data: directSub, error: directError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('tenant_id', tenantId)
    .single()

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Debug Subscription Data</h1>

      <div className="space-y-4">
        <div>
          <h2 className="font-semibold">Tenant ID from Cookie:</h2>
          <pre className="bg-gray-100 p-2 rounded text-xs">
            {tenantId || 'NO TENANT ID IN COOKIE'}
          </pre>
        </div>

        <div>
          <h2 className="font-semibold">Active Subscriptions View:</h2>
          {subError && <div className="text-red-500">Error: {subError.message}</div>}
          <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
            {JSON.stringify(subscription, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="font-semibold">Access Status:</h2>
          {accessError && <div className="text-red-500">Error: {accessError.message}</div>}
          <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
            {JSON.stringify(accessStatus, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="font-semibold">Direct Subscription:</h2>
          {directError && <div className="text-red-500">Error: {directError.message}</div>}
          <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
            {JSON.stringify(directSub, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}