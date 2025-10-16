import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createSupabaseServer } from '@/lib/supabase/server'
import { format, parse, addMinutes, isWithinInterval, startOfDay, endOfDay } from 'date-fns'

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers()
    const tenantId = headersList.get('x-tenant-id')

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 })
    }

    const { service_id, date, duration_minutes } = await request.json()

    if (!service_id || !date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = await createSupabaseServer()

    // Get all staff that can perform this service
    const { data: availableStaff } = await supabase
      .from('staff')
      .select('id, first_name, last_name')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .eq('can_book_appointments', true)

    if (!availableStaff || availableStaff.length === 0) {
      return NextResponse.json({ slots: [] })
    }

    // Get existing appointments for the selected date
    const startDate = startOfDay(new Date(date))
    const endDate = endOfDay(new Date(date))

    const { data: existingAppointments } = await supabase
      .from('appointments')
      .select('id, start_time, end_time, staff_id')
      .eq('tenant_id', tenantId)
      .gte('start_time', startDate.toISOString())
      .lte('start_time', endDate.toISOString())
      .in('status', ['confirmed', 'scheduled'])

    // Define business hours (9:00 - 19:00)
    const businessStart = 9 * 60 // 9:00 in minutes
    const businessEnd = 19 * 60 // 19:00 in minutes
    const slotDuration = duration_minutes || 30
    const slotInterval = 15 // Generate slots every 15 minutes

    // Generate all possible time slots
    const allSlots: any[] = []

    for (let minutes = businessStart; minutes <= businessEnd - slotDuration; minutes += slotInterval) {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      const timeString = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`

      // Check availability for each staff member
      for (const staff of availableStaff) {
        const slotStart = parse(`${date} ${timeString}`, 'yyyy-MM-dd HH:mm', new Date())
        const slotEnd = addMinutes(slotStart, slotDuration)

        // Check if this slot conflicts with existing appointments
        const hasConflict = existingAppointments?.some(apt => {
          if (apt.staff_id !== staff.id) return false

          const aptStart = new Date(apt.start_time)
          const aptEnd = new Date(apt.end_time)

          // Check for overlap
          return (
            (slotStart >= aptStart && slotStart < aptEnd) ||
            (slotEnd > aptStart && slotEnd <= aptEnd) ||
            (slotStart <= aptStart && slotEnd >= aptEnd)
          )
        })

        if (!hasConflict) {
          // Add this as an available slot
          const existingSlot = allSlots.find(s => s.time === timeString)
          if (!existingSlot) {
            allSlots.push({
              time: timeString,
              available: true,
              staff_id: staff.id,
              staff_name: `${staff.first_name} ${staff.last_name}`
            })
          }
        }
      }
    }

    // Sort slots by time
    allSlots.sort((a, b) => a.time.localeCompare(b.time))

    return NextResponse.json({
      slots: allSlots,
      date,
      service_id
    })
  } catch (error) {
    console.error('Error getting free slots:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}