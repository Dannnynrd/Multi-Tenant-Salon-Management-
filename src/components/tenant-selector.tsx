'use client'

import { useEffect, useState } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

interface Tenant {
  id: string
  name: string
  slug: string
}

export function TenantSelector() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [currentTenantId, setCurrentTenantId] = useState<string>()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTenants()
  }, [])

  const loadTenants = async () => {
    try {
      const supabase = createSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      // Get user's tenants
      const { data: memberships } = await supabase
        .from('tenant_members')
        .select(`
          tenant_id,
          tenants (
            id,
            name,
            slug
          )
        `)
        .eq('user_id', user.id)

      if (memberships && memberships.length > 0) {
        const tenantList = memberships.map(m => m.tenants).filter(Boolean) as Tenant[]
        setTenants(tenantList)

        // Get current tenant from cookie
        const cookieTenant = document.cookie
          .split('; ')
          .find(row => row.startsWith('current-tenant='))
          ?.split('=')[1]

        if (cookieTenant && tenantList.find(t => t.id === cookieTenant)) {
          setCurrentTenantId(cookieTenant)
        } else if (tenantList.length === 1) {
          // Auto-select if only one tenant
          selectTenant(tenantList[0].id)
        } else if (tenantList.length > 0) {
          // Select first tenant if no cookie
          selectTenant(tenantList[0].id)
        }
      }
    } catch (error) {
      console.error('Error loading tenants:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectTenant = (tenantId: string) => {
    document.cookie = `current-tenant=${tenantId}; path=/; max-age=${60 * 60 * 24 * 30}`
    setCurrentTenantId(tenantId)
    // Reload to apply tenant context
    window.location.reload()
  }

  if (loading) {
    return <Loader2 className="h-4 w-4 animate-spin" />
  }

  if (tenants.length === 0) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => window.location.href = '/onboarding'}
      >
        Salon erstellen
      </Button>
    )
  }

  if (tenants.length === 1) {
    return (
      <div className="text-sm font-medium">
        {tenants[0].name}
      </div>
    )
  }

  return (
    <Select value={currentTenantId} onValueChange={selectTenant}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Salon wählen" />
      </SelectTrigger>
      <SelectContent>
        {tenants.map(tenant => (
          <SelectItem key={tenant.id} value={tenant.id}>
            {tenant.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}