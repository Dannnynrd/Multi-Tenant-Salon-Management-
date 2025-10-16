import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  try {
    const supabase = await createClient()

    // Get tenant from slug
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', params.tenantSlug)
      .single()

    if (tenantError || !tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Get active staff who can book appointments
    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .select('id, first_name, last_name, email, phone, role, color')
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)
      .eq('can_book_appointments', true)

    if (staffError) {
      console.error('Error loading staff:', staffError)
      return NextResponse.json(
        { error: 'Failed to load staff' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      staff: staff || [],
      count: staff?.length || 0
    })
  } catch (error) {
    console.error('Error in staff API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}