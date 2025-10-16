import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { addMinutes } from 'date-fns'

const holdSchema = z.object({
  service_ids: z.array(z.string().uuid()),
  staff_id: z.string().uuid(),
  start_time: z.string(),
  duration_minutes: z.number(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  try {
    const body = await request.json()
    const validated = holdSchema.parse(body)

    const supabase = await createClient()

    // Get tenant
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

    // Use provided duration (already calculated by frontend)
    const totalDuration = validated.duration_minutes

    const startTime = new Date(validated.start_time)
    const endTime = addMinutes(startTime, totalDuration)

    // Check availability first
    const { data: slots } = await supabase.rpc('get_available_slots_multi', {
      p_tenant_id: tenant.id,
      p_service_ids: validated.service_ids,
      p_date: startTime.toISOString().split('T')[0],
      p_staff_id: validated.staff_id
    })

    // Check if the requested time slot is available
    const isAvailable = slots?.some((slot: any) => {
      const slotStart = new Date(slot.slot_start)
      return slot.staff_id === validated.staff_id &&
             slot.available &&
             slotStart.getTime() === startTime.getTime()
    })

    if (!isAvailable) {
      return NextResponse.json(
        { error: 'Time slot is no longer available' },
        { status: 409 }
      )
    }

    // Create hold
    const { data: hold, error: holdError } = await supabase
      .from('appointment_holds')
      .insert({
        tenant_id: tenant.id,
        staff_id: validated.staff_id,
        service_id: validated.service_ids[0], // Primary service
        start_time: startTime.toISOString(),
        duration_minutes: totalDuration,
        expires_at: addMinutes(new Date(), 5).toISOString(), // 5 minute hold
        metadata: {
          service_ids: validated.service_ids,
          tenant_slug: params.tenantSlug
        }
      })
      .select('id')
      .single()

    if (holdError) {
      console.error('Error creating hold:', holdError)
      return NextResponse.json(
        { error: 'Failed to create hold' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      hold_id: hold.id,
      expires_at: addMinutes(new Date(), 5).toISOString()
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error in hold API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}