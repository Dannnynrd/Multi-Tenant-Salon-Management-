import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const confirmSchema = z.object({
  hold_id: z.string().uuid(),
  customer: z.object({
    name: z.string(),
    email: z.string().email(),
    phone: z.string(),
    notes: z.string().optional(),
    marketing_consent: z.boolean().optional(),
    terms_accepted: z.boolean()
  })
})

export async function POST(
  request: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  try {
    const body = await request.json()
    const validated = confirmSchema.parse(body)

    if (!validated.customer.terms_accepted) {
      return NextResponse.json(
        { error: 'Terms must be accepted' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get hold details
    const { data: hold, error: holdError } = await supabase
      .from('appointment_holds')
      .select('*')
      .eq('id', validated.hold_id)
      .single()

    if (holdError || !hold) {
      return NextResponse.json(
        { error: 'Hold not found or expired' },
        { status: 404 }
      )
    }

    // Check if hold is still valid
    if (new Date(hold.expires_at) < new Date()) {
      // Delete expired hold
      await supabase
        .from('appointment_holds')
        .delete()
        .eq('id', validated.hold_id)

      return NextResponse.json(
        { error: 'Hold has expired' },
        { status: 410 }
      )
    }

    // Create or get customer
    let customerId: string

    // Try to find existing customer by email
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('tenant_id', hold.tenant_id)
      .eq('email', validated.customer.email)
      .single()

    if (existingCustomer) {
      customerId = existingCustomer.id

      // Update customer info
      await supabase
        .from('customers')
        .update({
          first_name: validated.customer.name.split(' ')[0],
          last_name: validated.customer.name.split(' ').slice(1).join(' '),
          phone: validated.customer.phone,
          marketing_consent: validated.customer.marketing_consent
        })
        .eq('id', customerId)
    } else {
      // Create new customer
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
          tenant_id: hold.tenant_id,
          email: validated.customer.email,
          first_name: validated.customer.name.split(' ')[0],
          last_name: validated.customer.name.split(' ').slice(1).join(' '),
          phone: validated.customer.phone,
          status: 'active',
          source: 'online',
          marketing_consent: validated.customer.marketing_consent
        })
        .select('id')
        .single()

      if (customerError || !newCustomer) {
        console.error('Error creating customer:', customerError)
        return NextResponse.json(
          { error: 'Failed to create customer' },
          { status: 500 }
        )
      }

      customerId = newCustomer.id
    }

    // Extract service IDs from hold metadata
    const serviceIds = hold.metadata?.service_ids || [hold.service_id]

    // Create appointment with multiple services
    let appointmentId: string

    if (serviceIds.length > 1) {
      // Use multi-service function
      const { data: appointmentResult, error: appointmentError } = await supabase.rpc('create_appointment_multi', {
        p_tenant_id: hold.tenant_id,
        p_customer_id: customerId,
        p_staff_id: hold.staff_id,
        p_service_ids: serviceIds,
        p_start_time: hold.start_time,
        p_notes: validated.customer.notes,
        p_source: 'online'
      })

      if (appointmentError || !appointmentResult) {
        console.error('Error creating multi-service appointment:', appointmentError)
        return NextResponse.json(
          { error: 'Failed to create appointment' },
          { status: 500 }
        )
      }

      appointmentId = appointmentResult
    } else {
      // Single service - use regular insert
      const endTime = new Date(hold.start_time)
      endTime.setMinutes(endTime.getMinutes() + hold.duration_minutes)

      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          tenant_id: hold.tenant_id,
          customer_id: customerId,
          staff_id: hold.staff_id,
          service_id: serviceIds[0],
          start_time: hold.start_time,
          end_time: endTime.toISOString(),
          time_range: `[${hold.start_time},${endTime.toISOString()})`,
          status: 'confirmed',
          notes: validated.customer.notes,
          source: 'online'
        })
        .select('id')
        .single()

      if (appointmentError || !appointment) {
        console.error('Error creating appointment:', appointmentError)
        return NextResponse.json(
          { error: 'Failed to create appointment' },
          { status: 500 }
        )
      }

      appointmentId = appointment.id
    }

    // Delete the hold
    await supabase
      .from('appointment_holds')
      .delete()
      .eq('id', validated.hold_id)

    // Send confirmation email (TODO: implement email service)
    // await sendConfirmationEmail(...)

    return NextResponse.json({
      appointment_id: appointmentId,
      message: 'Appointment confirmed successfully'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error in confirm API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}