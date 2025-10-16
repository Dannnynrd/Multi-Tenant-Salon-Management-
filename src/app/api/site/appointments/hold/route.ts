import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getCustomerSession } from '@/lib/customer-auth'
import { z } from 'zod'
import { addMinutes, parseISO } from 'date-fns'
import { nanoid } from 'nanoid'

const holdSchema = z.object({
  service_id: z.string().uuid(),
  staff_id: z.string().uuid().optional(),
  start_time: z.string().datetime(),
  duration_minutes: z.number().min(15).max(480),
})

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers()
    const tenantId = headersList.get('x-tenant-id')

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const body = await request.json()
    const validated = holdSchema.parse(body)

    // Get session ID from cookie or generate new one
    const sessionId = request.cookies.get('booking_session')?.value || nanoid()

    const supabase = await createClient()

    // Check if customer is logged in
    const customerSession = await getCustomerSession()

    const startTime = parseISO(validated.start_time)
    const endTime = addMinutes(startTime, validated.duration_minutes)
    const expiresAt = addMinutes(new Date(), 10) // Hold for 10 minutes

    // Check if slot is still available
    const { data: conflicts } = await supabase
      .from('appointments')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('staff_id', validated.staff_id)
      .in('status', ['confirmed', 'requested'])
      .overlaps('time_range', `[${startTime.toISOString()},${endTime.toISOString()})`)

    if (conflicts && conflicts.length > 0) {
      return NextResponse.json({
        error: 'Slot is no longer available',
        alternative_slots: [] // TODO: Calculate alternatives
      }, { status: 409 })
    }

    // Check for existing holds
    const { data: existingHolds } = await supabase
      .from('appointment_holds')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('staff_id', validated.staff_id)
      .gte('expires_at', new Date().toISOString())
      .overlaps('tstzrange(start_time, end_time)', `[${startTime.toISOString()},${endTime.toISOString()})`)

    if (existingHolds && existingHolds.length > 0) {
      return NextResponse.json({
        error: 'Slot is being held by another customer',
        retry_after: 600 // Retry after 10 minutes
      }, { status: 409 })
    }

    // Release any existing holds for this session
    await supabase
      .from('appointment_holds')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('session_id', sessionId)

    // Create new hold
    const { data: hold, error: holdError } = await supabase
      .from('appointment_holds')
      .insert({
        tenant_id: tenantId,
        customer_id: customerSession?.customerId,
        user_id: customerSession?.userId,
        service_id: validated.service_id,
        staff_id: validated.staff_id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        expires_at: expiresAt.toISOString(),
        session_id: sessionId
      })
      .select()
      .single()

    if (holdError) {
      console.error('Error creating hold:', holdError)
      return NextResponse.json({ error: 'Failed to hold slot' }, { status: 500 })
    }

    // Set session cookie
    const response = NextResponse.json({
      hold_id: hold.id,
      expires_at: hold.expires_at,
      session_id: sessionId
    })

    response.cookies.set('booking_session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24 hours
    })

    return response
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 })
    }
    console.error('Error in hold API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const headersList = await headers()
    const tenantId = headersList.get('x-tenant-id')

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const sessionId = request.cookies.get('booking_session')?.value

    if (!sessionId) {
      return NextResponse.json({ error: 'No active hold found' }, { status: 404 })
    }

    const supabase = await createClient()

    // Release hold
    const { error } = await supabase
      .from('appointment_holds')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('session_id', sessionId)

    if (error) {
      console.error('Error releasing hold:', error)
      return NextResponse.json({ error: 'Failed to release hold' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in hold release API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}