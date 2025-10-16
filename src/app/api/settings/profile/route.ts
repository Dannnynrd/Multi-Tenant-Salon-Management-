import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer, createSupabaseAdmin } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get profile from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Get staff profile from staff table
    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .select('*')
      .or(`user_id.eq.${user.id},email.eq.${user.email}`)
      .maybeSingle()

    // Get membership to determine role
    const { data: membership } = await supabase
      .from('tenant_members')
      .select('role, tenant_id')
      .eq('user_id', user.id)
      .maybeSingle()

    // Combine all data sources
    const combinedProfile = {
      // From auth user
      email: user.email || '',

      // From profiles table (global data)
      full_name: profile?.full_name || '',
      avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url || '',

      // From profiles (names are derived from full_name)
      first_name: profile?.full_name?.split(' ')[0] || user.user_metadata?.first_name || '',
      last_name: profile?.full_name?.split(' ').slice(1).join(' ') || user.user_metadata?.last_name || '',
      phone: profile?.phone || user.user_metadata?.phone || '',  // Phone now from profiles!
      bio: staff?.bio || '',
      color: staff?.color || '#3B82F6',
      role: membership?.role || staff?.role || 'user',
      can_book_appointments: staff?.can_book_appointments ?? true,
      notification_preferences: staff?.notification_preferences || {
        email: true,
        sms: false,
        appointment_reminder: true,
        appointment_changes: true
      },

      // IDs for updates
      staff_id: staff?.id || null,
      profile_id: profile?.id || user.id,
      tenant_id: membership?.tenant_id || staff?.tenant_id || null
    }

    return NextResponse.json(combinedProfile)
  } catch (error: any) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer()
    const supabaseAdmin = await createSupabaseAdmin()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profileData = await req.json()
    const fullName = `${profileData.first_name} ${profileData.last_name}`.trim()

    // Prepare all updates
    const updates = []

    // 1. Always update/create profile (including phone)
    updates.push(
      supabaseAdmin
        .from('profiles')
        .upsert({
          id: user.id,
          email: profileData.email || user.email,
          full_name: fullName,
          phone: profileData.phone || null,  // Phone now stored in profiles!
          avatar_url: profileData.avatar_url,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })
        .select()
        .single()
    )

    // 2. Check for existing staff and update
    const { data: existingStaff } = await supabase
      .from('staff')
      .select('id, tenant_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingStaff) {
      // Staff table now only contains bio and notification_preferences
      // Names, email and phone are stored in profiles table
      updates.push(
        supabaseAdmin
          .from('staff')
          .update({
            bio: profileData.bio || null,
            notification_preferences: profileData.notification_preferences || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingStaff.id)
          .select()
          .single()
      )
    }

    // 3. Update auth metadata using admin client - including phone number
    try {
      const authUpdate = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          full_name: fullName,
          phone: profileData.phone || null,
          avatar_url: profileData.avatar_url || null
        }
      })

      if (authUpdate.error) {
        console.error('Error updating auth metadata:', authUpdate.error)
      }
      updates.push(Promise.resolve(authUpdate))
    } catch (error) {
      console.error('Error with auth update:', error)
      // Continue with other updates even if auth update fails
    }

    // Execute all updates
    try {
      const results = await Promise.allSettled(updates)

      // Check for errors
      const errors = results.filter(r => r.status === 'rejected')
      if (errors.length > 0) {
        console.error('Some updates failed:', errors)
        // Continue anyway - partial success is better than failure
      }

      // Get the successful profile result
      const profileResult = results[0]
      if (profileResult.status === 'fulfilled' && profileResult.value.data) {
        return NextResponse.json({
          success: true,
          profile: profileResult.value.data,
          message: 'Profil erfolgreich aktualisiert',
          updatedTables: {
            profiles: results[0]?.status === 'fulfilled',
            staff: existingStaff ? results[1]?.status === 'fulfilled' : 'no_staff',
            auth: results[results.length - 1]?.status === 'fulfilled'
          }
        })
      }

      return NextResponse.json({
        success: true,
        message: 'Profil teilweise aktualisiert',
        warnings: errors.map(e => (e as any).reason?.message || 'Unknown error')
      })
    } catch (updateError: any) {
      console.error('Error during updates:', updateError)
      throw updateError
    }
  } catch (error: any) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}