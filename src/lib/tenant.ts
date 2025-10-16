import { cookies } from 'next/headers'
import { createSupabaseServer } from '@/lib/supabase/server'

export async function getTenantData() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return {
      tenantId: null,
      tenantSlug: null,
      tenantName: null
    }
  }

  const cookieStore = await cookies()
  const currentTenantId = cookieStore.get('current-tenant')?.value

  // Check tenant members
  const { data: memberships } = await supabase
    .from('tenant_members')
    .select('tenant:tenants(id, slug, name), role')
    .eq('user_id', user.id)

  if (memberships && memberships.length > 0) {
    // If cookie tenant_id exists and user has membership in it, use it
    if (currentTenantId) {
      const cookieTenant = memberships.find(m => m.tenant?.id === currentTenantId)
      if (cookieTenant && cookieTenant.tenant) {
        return {
          tenantId: cookieTenant.tenant.id,
          tenantSlug: cookieTenant.tenant.slug,
          tenantName: cookieTenant.tenant.name
        }
      }
    }

    // Otherwise use first membership
    const tenant = memberships[0].tenant
    if (tenant) {
      return {
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
        tenantName: tenant.name
      }
    }
  }

  return {
    tenantId: null,
    tenantSlug: null,
    tenantName: null
  }
}

export async function setTenantCookie(tenantId: string, tenantSlug: string) {
  const cookieStore = await cookies()

  cookieStore.set('tenantId', tenantId, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30 // 30 days
  })

  cookieStore.set('tenantSlug', tenantSlug, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30 // 30 days
  })
}

export async function clearTenantCookie() {
  const cookieStore = await cookies()
  cookieStore.delete('tenantId')
  cookieStore.delete('tenantSlug')
}