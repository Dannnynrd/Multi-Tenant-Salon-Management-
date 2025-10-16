// Debug-Code für Browser Console
// Führen Sie dies in der Browser-Konsole aus, wenn Sie auf der Kunden-Seite sind

import { createSupabaseClient } from '@/lib/supabase/client'

async function debugCustomerInsert() {
  const supabase = createSupabaseClient()

  // 1. Check current user
  const { data: { user } } = await supabase.auth.getUser()
  console.log('Current user:', user?.id)

  // 2. Check memberships
  const { data: memberships, error: membershipError } = await supabase
    .from('memberships')
    .select('*, tenants(*)')
    .eq('user_id', user?.id)

  console.log('Memberships:', memberships)
  if (membershipError) console.error('Membership error:', membershipError)

  // 3. Get tenant from cookie
  const tenantId = document.cookie
    .split('; ')
    .find(row => row.startsWith('current-tenant='))
    ?.split('=')[1]

  console.log('Tenant ID from cookie:', tenantId)

  // 4. Try a test insert with detailed error
  const testCustomer = {
    first_name: 'Debug',
    last_name: 'Test',
    tenant_id: tenantId,
    created_by: user?.id
  }

  console.log('Attempting to insert:', testCustomer)

  const { data, error } = await supabase
    .from('customers')
    .insert(testCustomer)
    .select()
    .single()

  if (error) {
    console.error('Insert error:', error)
    console.error('Error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    })
  } else {
    console.log('Insert successful:', data)
    // Clean up test data
    await supabase.from('customers').delete().eq('id', data.id)
  }

  // 5. Check RLS policies via RPC (if you have a debug function)
  const { data: canInsert } = await supabase.rpc('debug_can_insert_customer', {
    p_tenant_id: tenantId
  }).single()

  console.log('Can insert according to RPC:', canInsert)
}

// Run the debug
debugCustomerInsert()