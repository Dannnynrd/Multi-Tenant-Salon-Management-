import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export interface CustomerSession {
  customerId: string
  tenantId: string
  userId: string
  email: string
  name: string
  phone?: string
  flags?: Record<string, any>
  consents?: Record<string, any>
  preferredStaffId?: string
}

export async function getCustomerSession(): Promise<CustomerSession | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const headersList = await headers()
  const tenantId = headersList.get('x-tenant-id')

  if (!tenantId) return null

  // Get or create customer record
  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('user_id', user.id)
    .single()

  if (!customer) {
    // Create customer record if doesn't exist
    const { data: newCustomer, error: createError } = await supabase
      .from('customers')
      .insert({
        tenant_id: tenantId,
        user_id: user.id,
        email: user.email,
        first_name: user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || '',
        last_name: user.user_metadata?.last_name || user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
        status: 'active',
        source: 'online',
        flags: { trusted: false },
        consents: { marketing: false, terms: false }
      })
      .select()
      .single()

    if (createError || !newCustomer) {
      console.error('Error creating customer:', createError)
      return null
    }

    return {
      customerId: newCustomer.id,
      tenantId: newCustomer.tenant_id,
      userId: user.id,
      email: newCustomer.email,
      name: `${newCustomer.first_name} ${newCustomer.last_name}`.trim(),
      phone: newCustomer.phone,
      flags: newCustomer.flags,
      consents: newCustomer.consents,
      preferredStaffId: newCustomer.preferred_staff_id
    }
  }

  return {
    customerId: customer.id,
    tenantId: customer.tenant_id,
    userId: user.id,
    email: customer.email,
    name: `${customer.first_name} ${customer.last_name}`.trim(),
    phone: customer.phone,
    flags: customer.flags,
    consents: customer.consents,
    preferredStaffId: customer.preferred_staff_id
  }
}

export async function requireCustomerAuth(redirectTo: string = '/portal/login') {
  const session = await getCustomerSession()
  if (!session) {
    redirect(redirectTo)
  }
  return session
}

export async function getCustomerAppointments(customerId: string) {
  const supabase = await createClient()

  const { data: appointments } = await supabase
    .from('customer_appointment_history')
    .select('*')
    .eq('customer_id', customerId)
    .order('start_time', { ascending: false })

  return appointments || []
}

export async function getCustomerUpcomingAppointments(customerId: string) {
  const supabase = await createClient()

  const { data: appointments } = await supabase
    .from('customer_appointment_history')
    .select('*')
    .eq('customer_id', customerId)
    .in('status', ['confirmed', 'requested'])
    .gte('start_time', new Date().toISOString())
    .order('start_time', { ascending: true })
    .limit(5)

  return appointments || []
}

export async function calculateCustomerTrustScore(customerId: string): Promise<number> {
  const supabase = await createClient()

  const { data: score } = await supabase
    .rpc('calculate_customer_trust_score', { p_customer_id: customerId })

  return score || 0
}

export async function isCustomerTrusted(customerId: string): Promise<boolean> {
  const score = await calculateCustomerTrustScore(customerId)
  return score >= 80 // 80+ score means trusted
}