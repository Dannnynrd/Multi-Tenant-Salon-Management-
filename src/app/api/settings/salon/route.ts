import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { getTenantData } from '@/lib/tenant'
import { checkIfAdminOrStaff } from '@/lib/tenant-auth'

export async function GET(req: NextRequest) {
  try {
    const { tenantId } = await getTenantData()
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createSupabaseServer()

    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error fetching tenant settings:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { tenantId } = await getTenantData()
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { isAdmin } = await checkIfAdminOrStaff(tenantId)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { settings } = await req.json()
    const supabase = await createSupabaseServer()

    // Get current tenant data to preserve existing settings
    const { data: currentTenant } = await supabase
      .from('tenants')
      .select('settings')
      .eq('id', tenantId)
      .single()

    const currentSettings = currentTenant?.settings ?
      (typeof currentTenant.settings === 'string' ? JSON.parse(currentTenant.settings) : currentTenant.settings) : {}

    // Build settings object for JSON column
    const jsonSettings = {
      ...currentSettings,
      description: settings.description || currentSettings.description,
      address: settings.address || currentSettings.address,
      postal_code: settings.postal_code || currentSettings.postal_code,
      city: settings.city || currentSettings.city,
      phone: settings.phone || currentSettings.phone,
      email: settings.email || currentSettings.email,
      social_media: settings.social_media || currentSettings.social_media,
      images: settings.images || currentSettings.images || []
    }

    // Prepare update data for tenants table
    const updateData: any = {
      name: settings.name,
      updated_at: new Date().toISOString(),
      settings: jsonSettings
    }

    // Add fields that are direct columns
    if (settings.slug) updateData.slug = settings.slug
    if (settings.logo_url !== undefined) updateData.logo_url = settings.logo_url
    if (settings.opening_hours) updateData.opening_hours = settings.opening_hours

    // Update the tenants table
    const { data, error } = await supabase
      .from('tenants')
      .update(updateData)
      .eq('id', tenantId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error updating tenant settings:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}