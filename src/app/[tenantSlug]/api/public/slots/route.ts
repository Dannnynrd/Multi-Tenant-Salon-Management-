import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { format } from 'date-fns'

const requestSchema = z.object({
  service_ids: z.array(z.string().uuid()),
  date: z.string(),
  staff_id: z.string().uuid().optional(),
})

interface TimeSlot {
  time: string
  available: boolean
  staff: Array<{
    staff_id: string
    staff_name: string
  }>
}

export async function POST(
  request: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  try {
    const body = await request.json()
    const validated = requestSchema.parse(body)

    const supabase = await createClient()

    // Get tenant from slug
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

    // Always use multi-service function
    const { data: slotsData, error: slotsError } = await supabase.rpc('get_available_slots_multi', {
      p_tenant_id: tenant.id,
      p_service_ids: validated.service_ids,
      p_date: validated.date,
      p_staff_id: validated.staff_id || null
    })

    if (slotsError) {
      console.error('Error fetching available slots:', slotsError)
      return NextResponse.json(
        { error: 'Failed to fetch available slots' },
        { status: 500 }
      )
    }

    // Group slots by time for frontend display
    const slotsByTime = new Map<string, any[]>()

    slotsData?.forEach((slot: any) => {
      const timeKey = format(new Date(slot.slot_start), 'HH:mm')

      if (!slotsByTime.has(timeKey)) {
        slotsByTime.set(timeKey, [])
      }

      if (slot.available) {
        slotsByTime.get(timeKey)!.push({
          staff_id: slot.staff_id,
          staff_name: slot.staff_name
        })
      }
    })

    // Convert to frontend format
    const slots: TimeSlot[] = Array.from(slotsByTime.entries())
      .map(([time, staff]) => ({
        time,
        available: staff.length > 0,
        staff: staff
      }))
      .sort((a, b) => a.time.localeCompare(b.time))

    return NextResponse.json({ slots })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error in slots API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}