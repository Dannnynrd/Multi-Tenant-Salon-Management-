'use server'

import { createSupabaseServer } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createCustomer(formData: FormData) {
  const supabase = await createSupabaseServer()

  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    console.error('Auth error:', authError)
    return { error: 'Not authenticated' }
  }

  // Get form data
  const firstName = formData.get('first_name') as string
  const lastName = formData.get('last_name') as string
  const email = formData.get('email') as string | null
  const phone = formData.get('phone') as string | null
  let tenantId = formData.get('tenant_id') as string

  if (!firstName || !lastName) {
    return { error: 'Missing required fields' }
  }

  // Get user's actual tenant memberships
  const { data: memberships, error: membershipError } = await supabase
    .from('tenant_members')
    .select('tenant_id, role')
    .eq('user_id', user.id)

  if (membershipError || !memberships || memberships.length === 0) {
    console.error('No memberships found for user:', user.id)
    return { error: 'No tenant membership found' }
  }

  // If no tenant_id provided or user doesn't have membership in provided tenant
  // Use the first membership's tenant_id
  const userTenantIds = memberships.map(m => m.tenant_id)

  if (!tenantId || !userTenantIds.includes(tenantId)) {
    tenantId = memberships[0].tenant_id
    console.log('Using user\'s default tenant:', tenantId)
  }

  const membership = memberships.find(m => m.tenant_id === tenantId)
  console.log('Using tenant:', tenantId, 'with role:', membership?.role)

  // Check for duplicate email/phone if provided
  if (email) {
    const { data: existingEmail } = await supabase
      .from('customers')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('email', email)
      .single()

    if (existingEmail) {
      return { error: 'Ein Kunde mit dieser E-Mail-Adresse existiert bereits' }
    }
  }

  if (phone) {
    const { data: existingPhone } = await supabase
      .from('customers')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('phone', phone)
      .single()

    if (existingPhone) {
      return { error: 'Ein Kunde mit dieser Telefonnummer existiert bereits' }
    }
  }

  // Direct insert since we already verified the user has membership
  const { data, error } = await supabase
    .from('customers')
    .insert({
      tenant_id: tenantId,
      first_name: firstName,
      last_name: lastName,
      email: email || null,
      phone: phone || null,
      source: 'manual',
      created_by: user.id
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating customer:', error)
    console.error('Error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    })
    return { error: error.message }
  }

  revalidatePath('/dashboard/customers')
  return { data }
}

export async function updateCustomer(formData: FormData) {
  const supabase = await createSupabaseServer()

  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  // Get form data
  const customerId = formData.get('id') as string
  const firstName = formData.get('first_name') as string
  const lastName = formData.get('last_name') as string
  const email = formData.get('email') as string | null
  const phone = formData.get('phone') as string | null

  if (!customerId || !firstName || !lastName) {
    return { error: 'Missing required fields' }
  }

  // Use the safe RPC function instead of direct UPDATE
  const { data, error } = await supabase
    .rpc('update_customer_safe', {
      p_customer_id: customerId,
      p_first_name: firstName,
      p_last_name: lastName,
      p_email: email || null,
      p_phone: phone || null
    })

  if (error) {
    console.error('Error updating customer:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/customers')
  revalidatePath(`/dashboard/customers/${customerId}`)
  return { data }
}