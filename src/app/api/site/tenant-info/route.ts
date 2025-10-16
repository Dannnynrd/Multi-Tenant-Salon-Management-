import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const headersList = await headers()
  const tenantId = headersList.get('x-tenant-id')
  const tenantSlug = headersList.get('x-tenant-slug')

  if (!tenantId || !tenantSlug) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
  }

  const supabase = await createClient()

  // Get tenant details
  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single()

  if (error || !tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
  }

  return NextResponse.json({
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    name: tenant.name,
    email: tenant.email,
    phone: tenant.phone,
    address: tenant.address,
    openingHours: tenant.opening_hours,
    timezone: tenant.timezone || 'Europe/Berlin'
  })
}