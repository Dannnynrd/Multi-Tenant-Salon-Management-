import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer, createSupabaseAdmin } from '@/lib/supabase/server'
import { getTenantData } from '@/lib/tenant'
import { checkIfAdminOrStaff } from '@/lib/tenant-auth'

export async function GET(req: NextRequest) {
  try {
    const { tenantId } = await getTenantData()
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createSupabaseServer()

    // Get all staff for tenant with profile data
    const { data, error } = await supabase
      .from('staff_with_profiles')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error fetching staff:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
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

    const body = await req.json()
    const supabase = await createSupabaseServer()
    const supabaseAdmin = await createSupabaseAdmin()

    console.log('Creating staff with data:', {
      tenantId,
      firstName: body.first_name,
      lastName: body.last_name,
      email: body.email,
      role: body.role
    })

    // Check if we can add one more active staff member
    const { data: canAddStaff, error: limitError } = await supabase
      .rpc('check_staff_limit', {
        p_tenant_id: tenantId,
        p_extra: 1  // Check if we can add 1 more
      })

    if (limitError) {
      console.error('Error checking staff limit:', limitError)
    }

    // If limit check returns false, get current count and limit for error message
    if (canAddStaff === false) {
      // Get current active staff count
      const { data: currentStaff } = await supabase
        .from('staff')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)

      const currentCount = currentStaff?.length || 0

      // Get subscription details to show proper limit
      const { data: subscription } = await supabase
        .from('active_subscriptions')
        .select('tier_name, max_staff, quantity')
        .eq('tenant_id', tenantId)
        .eq('has_access', true)
        .single()

      // Calculate effective limit
      const effectiveLimit = subscription
        ? (subscription.quantity || 1) * subscription.max_staff
        : 2 // Default to starter limit

      return NextResponse.json({
        error: 'Staff limit reached',
        details: {
          message: `Sie haben das Limit von ${effectiveLimit} Mitarbeitern für Ihren ${subscription?.tier_name || 'Starter'} Plan erreicht.`,
          limit: effectiveLimit,
          current: currentCount,
          upgrade_required: true
        }
      }, { status: 403 })
    }

    // Create auth user if email is provided
    let authUserId: string | null = null
    let tempPassword: string | null = null

    if (body.email) {
      // Generate a temporary password
      tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase() + '1!'

      // Create auth user with Admin SDK
      try {
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: body.email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            first_name: body.first_name,
            last_name: body.last_name,
            tenant_id: tenantId,
            role: body.role || 'mitarbeiter'
          }
        })

        if (authError) throw authError
        if (authUser) {
          authUserId = authUser.user.id
        }
      } catch (authError: any) {
        // If user already exists, try to link them
        if (authError.message?.includes('already been registered') || authError.message?.includes('already exists')) {
          // Get existing user by email
          const { data: existingUsers, error: lookupError } = await supabaseAdmin.auth.admin.listUsers()

          if (!lookupError && existingUsers?.users) {
            const existingUser = existingUsers.users.find(u => u.email === body.email)
            if (existingUser) {
              authUserId = existingUser.id
              // Update user metadata to include tenant_id
              await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
                user_metadata: {
                  ...existingUser.user_metadata,
                  tenant_id: tenantId,
                  role: body.role || 'mitarbeiter'
                }
              })
            }
          }
        } else {
          console.error('Error creating auth user:', authError)
          // Continue without auth user - staff can be created without auth
        }
      }
    }

    // If we have an auth user, create membership first
    if (authUserId) {
      // Try RPC first to bypass RLS
      const { error: rpcMembershipError } = await supabaseAdmin.rpc('create_staff_membership', {
        p_tenant_id: tenantId,
        p_user_id: authUserId,
        p_role: body.role === 'admin' ? 'admin' : 'staff'
      })

      if (rpcMembershipError) {
        console.log('RPC create_staff_membership failed:', rpcMembershipError)
        console.log('Attempting direct insert with service role...')

        // Fallback: Try direct insert with service role - using raw SQL
        const { data: membershipData, error: membershipError } = await supabaseAdmin
          .rpc('insert_membership_direct', {
            p_tenant_id: tenantId,
            p_user_id: authUserId,
            p_role: body.role === 'admin' ? 'admin' : 'staff'
          })

        if (membershipError) {
          console.log('RPC insert_membership_direct failed:', membershipError)

          // Final fallback: Direct table insert
          try {
            const { data: finalMembership, error: finalError } = await supabaseAdmin
              .from('tenant_members')
              .insert({
                tenant_id: tenantId,
                user_id: authUserId,
                role: body.role === 'admin' ? 'admin' : 'staff',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select()
              .single()

            if (finalError && !finalError.message?.includes('duplicate')) {
              console.error('Final attempt - Error creating membership:', finalError)
              console.error('Details:', { tenantId, authUserId, role: body.role })
            } else {
              console.log('Membership created successfully via direct insert')
            }
          } catch (e) {
            console.error('Exception creating membership:', e)
          }
        } else {
          console.log('Membership created successfully via RPC')
        }
      } else {
        console.log('Membership created successfully via create_staff_membership')
      }

      // Ensure profile exists with full name
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: authUserId,
          email: body.email,
          full_name: `${body.first_name} ${body.last_name}`.trim(),
          avatar_url: body.avatar_url || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })

      if (profileError) {
        console.error('Error creating/updating profile:', profileError)
        // Continue anyway
      }
    }

    // Try to insert staff - first with RPC function, then direct
    let staffData = null
    let staffError = null

    // First try the RPC function
    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('create_staff_complete', {
      p_tenant_id: tenantId,
      p_first_name: body.first_name,
      p_last_name: body.last_name,
      p_email: body.email || null,
      p_phone: body.phone || null,
      p_role: body.role || 'mitarbeiter',
      p_color: body.color || '#3B82F6',
      p_is_active: body.is_active !== undefined ? body.is_active : true,
      p_can_book_appointments: body.can_book_appointments !== undefined ? body.can_book_appointments : true,
      p_user_id: authUserId
    })

    if (!rpcError && rpcData?.success) {
      console.log('Staff created via RPC function')
      staffData = rpcData
    } else {
      if (rpcError) console.log('RPC create_staff_complete failed:', rpcError)

      // Fallback to direct insert with admin client
      // Note: first_name, last_name, email are stored in profiles, not staff
      const { data, error } = await supabaseAdmin
        .from('staff')
        .insert({
          tenant_id: tenantId,
          phone: body.phone || null,
          role: body.role || 'mitarbeiter',
          color: body.color || '#3B82F6',
          is_active: body.is_active !== undefined ? body.is_active : true,
          can_book_appointments: body.can_book_appointments !== undefined ? body.can_book_appointments : true,
          user_id: authUserId,
          bio: body.bio || null,
          notification_preferences: body.notification_preferences || {
            email: true,
            sms: false,
            appointment_reminder: true,
            appointment_changes: true
          }
        })
        .select('*, profiles!staff_user_id_fkey(full_name, email, avatar_url)')
        .single()

      staffData = data
      staffError = error
    }

    const error = staffError
    const data = staffData

    if (error) {
      // Check if it's a staff limit error from a trigger
      if (error.message?.includes('Staff limit') || error.code === 'P0001') {
        // Get current count and limit for better error message
        const { data: currentStaff } = await supabase
          .from('staff')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('is_active', true)

        const currentCount = currentStaff?.length || 0

        const { data: subscription } = await supabase
          .from('active_subscriptions')
          .select('tier_name, max_staff, quantity')
          .eq('tenant_id', tenantId)
          .eq('has_access', true)
          .single()

        const effectiveLimit = subscription
          ? (subscription.quantity || 1) * subscription.max_staff
          : 2

        return NextResponse.json({
          error: 'Staff limit reached',
          details: {
            message: `Sie haben das Limit von ${effectiveLimit} Mitarbeitern für Ihren ${subscription?.tier_name || 'Starter'} Plan erreicht.`,
            limit: effectiveLimit,
            current: currentCount,
            upgrade_required: true
          }
        }, { status: 403 })
      }
      throw error
    }

    // Send invite email if email was provided and auth user was created
    if (body.invite && body.email && tempPassword) {
      // Here you would normally send an email with the login credentials
      // For now, we'll include it in the response (in production, use an email service)

      // Generate magic link for password reset (optional)
      const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: body.email,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`
        }
      })

      if (!resetError && resetData) {
        return NextResponse.json({
          ...data,
          invite_sent: true,
          // In production, don't include these - send via email instead
          invite_details: {
            email: body.email,
            temporary_password: tempPassword,
            reset_link: resetData.properties?.action_link,
            message: 'Einladung wurde versendet. Der Mitarbeiter erhält eine E-Mail mit den Zugangsdaten.'
          }
        })
      }
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error creating staff:', error)
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

    const body = await req.json()
    const supabase = await createSupabaseServer()
    const supabaseAdmin = await createSupabaseAdmin()

    // Get the user_id for this staff member
    const { data: staffMember } = await supabaseAdmin
      .from('staff')
      .select('user_id')
      .eq('id', body.id)
      .eq('tenant_id', tenantId)
      .single()

    if (!staffMember) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
    }

    // Update profile data if name or email changed
    if (staffMember.user_id && (body.first_name || body.last_name || body.email || body.avatar_url !== undefined)) {
      const fullName = body.first_name && body.last_name
        ? `${body.first_name} ${body.last_name}`.trim()
        : undefined

      await supabaseAdmin
        .from('profiles')
        .update({
          ...(fullName && { full_name: fullName }),
          ...(body.email && { email: body.email }),
          ...(body.avatar_url !== undefined && { avatar_url: body.avatar_url }),
          updated_at: new Date().toISOString()
        })
        .eq('id', staffMember.user_id)
    }

    // Update staff-specific data
    const { data, error } = await supabaseAdmin
      .from('staff')
      .update({
        phone: body.phone,
        role: body.role,
        color: body.color,
        is_active: body.is_active,
        can_book_appointments: body.can_book_appointments,
        bio: body.bio,
        notification_preferences: body.notification_preferences,
        updated_at: new Date().toISOString()
      })
      .eq('id', body.id)
      .eq('tenant_id', tenantId)
      .select('*, profiles!staff_user_id_fkey(full_name, email, avatar_url)')
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error updating staff:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
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

    const { searchParams } = new URL(req.url)
    const staffId = searchParams.get('id')
    const deleteAuthUser = searchParams.get('deleteAuthUser') === 'true'

    if (!staffId) {
      return NextResponse.json({ error: 'Staff ID required' }, { status: 400 })
    }

    const supabaseAdmin = await createSupabaseAdmin()

    // Use the delete_staff_complete function to properly handle all related records
    const { data, error } = await supabaseAdmin
      .rpc('delete_staff_complete', {
        p_staff_id: staffId,
        p_tenant_id: tenantId,
        p_delete_auth_user: deleteAuthUser
      })

    if (error) {
      console.error('Error in delete_staff_complete:', error)

      // Fallback to simple soft delete
      const { error: fallbackError } = await supabaseAdmin
        .from('staff')
        .update({ is_active: false })
        .eq('id', staffId)
        .eq('tenant_id', tenantId)

      if (fallbackError) throw fallbackError

      return NextResponse.json({
        success: true,
        method: 'fallback',
        message: 'Staff soft deleted (fallback method)'
      })
    }

    // If the RPC function returns success: false, handle it
    if (data && !data.success) {
      return NextResponse.json({
        error: data.error || 'Failed to delete staff',
        details: data
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      method: 'complete',
      details: data
    })
  } catch (error: any) {
    console.error('Error deleting staff:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}