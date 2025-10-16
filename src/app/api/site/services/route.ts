import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const headersList = await headers()
  const tenantId = headersList.get('x-tenant-id')

  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
  }

  const supabase = await createClient()

  // Get services using secure function
  const { data: services, error } = await supabase
    .rpc('get_public_services_by_tenant', { p_tenant_id: tenantId })

  if (error) {
    console.error('Error fetching services:', error)
    return NextResponse.json({ error: 'Failed to load services' }, { status: 500 })
  }

  return NextResponse.json({ services: services || [] })
}