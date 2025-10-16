import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createSupabaseServer } from '@/lib/supabase/server'
import { addMinutes } from 'date-fns'

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers()
    const tenantId = headersList.get('x-tenant-id')

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 })
    }

    const { service_id, starts_at, customer, staff_id } = await request.json()

    // Validate required fields
    if (!service_id || !starts_at || !customer?.full_name || !customer?.email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = await createSupabaseServer()

    // Get service details
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('*')
      .eq('id', service_id)
      .eq('tenant_id', tenantId)
      .single()

    if (serviceError || !service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    // Calculate end time
    const startTime = new Date(starts_at)
    const endTime = addMinutes(startTime, service.duration_minutes || 30)

    // Start a transaction-like operation
    // First, find or create customer
    let customerId = null

    // Check if customer exists
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('email', customer.email)
      .single()

    if (existingCustomer) {
      customerId = existingCustomer.id
    } else {
      // Create new customer
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
          tenant_id: tenantId,
          first_name: customer.full_name.split(' ')[0] || customer.full_name,
          last_name: customer.full_name.split(' ').slice(1).join(' ') || '',
          email: customer.email,
          phone: customer.phone || null
        })
        .select('id')
        .single()

      if (customerError) {
        console.error('Error creating customer:', customerError)
        return NextResponse.json(
          { error: 'Failed to create customer' },
          { status: 500 }
        )
      }

      customerId = newCustomer.id
    }

    // If no staff specified, find available staff
    let assignedStaffId = staff_id

    if (!assignedStaffId) {
      // Get any available staff
      const { data: availableStaff } = await supabase
        .from('staff')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .eq('can_book_appointments', true)
        .limit(1)

      if (availableStaff && availableStaff.length > 0) {
        assignedStaffId = availableStaff[0].id
      } else {
        return NextResponse.json(
          { error: 'No staff available' },
          { status: 400 }
        )
      }
    }

    // Create appointment using time_range
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert({
        tenant_id: tenantId,
        customer_id: customerId,
        service_id: service_id,
        staff_id: assignedStaffId,
        time_range: `[${startTime.toISOString()},${endTime.toISOString()})`,
        status: 'confirmed', // Auto-confirm for online bookings
        notes: `Online-Buchung von ${customer.full_name}`
      })
      .select('id, status')
      .single()

    if (appointmentError) {
      console.error('Error creating appointment:', appointmentError)

      // Check if it's a conflict error
      if (appointmentError.message?.includes('overlapping')) {
        return NextResponse.json(
          { error: 'Dieser Termin ist bereits belegt' },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to create appointment' },
        { status: 500 }
      )
    }

    // TODO: Send confirmation email
    // This would be handled by a separate service or Supabase Edge Function

    return NextResponse.json({
      success: true,
      appointment: {
        id: appointment.id,
        status: appointment.status,
        starts_at: startTime.toISOString(),
        ends_at: endTime.toISOString()
      }
    })
  } catch (error) {
    console.error('Error creating appointment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}