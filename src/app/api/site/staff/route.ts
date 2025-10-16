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

  // Get active staff using secure function
  const { data: staff, error } = await supabase
    .rpc('get_public_staff_by_tenant', { p_tenant_id: tenantId })

  if (error) {
    console.error('Error fetching staff:', error)
    return NextResponse.json({ error: 'Failed to load staff' }, { status: 500 })
  }

  return NextResponse.json({ staff: staff || [] })
}