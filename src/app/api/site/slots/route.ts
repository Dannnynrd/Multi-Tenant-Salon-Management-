import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { addMinutes, format, parse, startOfDay, endOfDay } from 'date-fns'

const requestSchema = z.object({
  service_id: z.string().uuid(),
  date: z.string(),
  staff_id: z.string().uuid().optional(),
})

interface TimeSlot {
  time: string
  available: boolean
  staff_id: string
  staff_name: string
}

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers()
    const tenantId = headersList.get('x-tenant-id')

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const body = await request.json()
    const validated = requestSchema.parse(body)

    const supabase = await createClient()

    // Get available slots from database function
    const { data: slots, error } = await supabase
      .rpc('get_available_slots', {
        p_tenant_id: tenantId,
        p_service_id: validated.service_id,
        p_date: validated.date,
        p_staff_id: validated.staff_id || null
      })

    if (error) {
      console.error('Error fetching slots:', error)
      return NextResponse.json({ error: 'Failed to fetch available slots' }, { status: 500 })
    }

    // Group slots by time
    const groupedSlots = new Map<string, TimeSlot[]>()

    slots?.forEach((slot: any) => {
      const timeKey = format(new Date(slot.slot_start), 'HH:mm')

      if (!groupedSlots.has(timeKey)) {
        groupedSlots.set(timeKey, [])
      }

      groupedSlots.get(timeKey)!.push({
        time: timeKey,
        available: slot.available,
        staff_id: slot.staff_id,
        staff_name: slot.staff_name
      })
    })

    // Convert to array and sort by time
    const formattedSlots = Array.from(groupedSlots.entries())
      .map(([time, staffSlots]) => ({
        time,
        available: staffSlots.some(s => s.available),
        staff: staffSlots.filter(s => s.available)
      }))
      .sort((a, b) => a.time.localeCompare(b.time))

    return NextResponse.json({ slots: formattedSlots })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 })
    }
    console.error('Error in slots API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}