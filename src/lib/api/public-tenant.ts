import { createSupabaseClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database.types'

type PublicTenant = {
  id: string
  slug: string
  name: string
  logo_url: string | null
  timezone: string
  opening_hours: any
  booking_settings: any
  settings: any
}

type PublicService = {
  id: string
  name: string
  description_short: string | null
  duration: number
  price: string
  category_id: string | null
  category_name: string | null
  display_order: number | null
}

type PublicStaff = {
  id: string
  display_name: string
  role: string | null
  color: string | null
  can_book_appointments: boolean
}

type AvailableSlot = {
  slot_time: string
  available: boolean
}

/**
 * Get public tenant information by slug
 * Uses secure function that only returns data for active tenants
 */
export async function getPublicTenant(slug: string): Promise<PublicTenant | null> {
  const supabase = createSupabaseClient()

  const { data, error } = await supabase
    .rpc('get_public_tenant', { p_slug: slug })

  if (error) {
    console.error('Error fetching tenant:', error)
    return null
  }

  return data && data.length > 0 ? data[0] : null
}

/**
 * Get public services for a tenant
 * Only returns active, bookable services
 */
export async function getPublicServices(slug: string): Promise<PublicService[]> {
  const supabase = createSupabaseClient()

  const { data, error } = await supabase
    .rpc('get_public_services', { p_slug: slug })

  if (error) {
    console.error('Error fetching services:', error)
    return []
  }

  return data || []
}

/**
 * Get public staff members for a tenant
 * Only returns active staff who can book appointments
 * No PII exposed (only first names)
 */
export async function getPublicStaff(slug: string): Promise<PublicStaff[]> {
  const supabase = createSupabaseClient()

  const { data, error } = await supabase
    .rpc('get_public_staff', { p_slug: slug })

  if (error) {
    console.error('Error fetching staff:', error)
    return []
  }

  return data || []
}

/**
 * Get available appointment slots
 * Requires tenant slug, service IDs, staff ID, and date
 */
export async function getPublicAvailableSlots(
  slug: string,
  serviceIds: string[],
  staffId: string,
  date: string
): Promise<AvailableSlot[]> {
  const supabase = createSupabaseClient()

  const { data, error } = await supabase
    .rpc('get_public_available_slots', {
      p_slug: slug,
      p_service_ids: serviceIds,
      p_staff_id: staffId,
      p_date: date
    })

  if (error) {
    console.error('Error fetching available slots:', error)
    return []
  }

  return data || []
}

/**
 * Create a public booking
 * Returns success status, appointment ID, or error message
 */
export async function createPublicBooking(
  slug: string,
  serviceIds: string[],
  staffId: string,
  startTime: string,
  customer: {
    firstName: string
    lastName: string
    email: string
    phone: string
  },
  notes?: string
): Promise<{
  success: boolean
  appointmentId?: string
  errorMessage?: string
}> {
  const supabase = createSupabaseClient()

  const { data, error } = await supabase
    .rpc('create_public_booking', {
      p_slug: slug,
      p_service_ids: serviceIds,
      p_staff_id: staffId,
      p_start_time: startTime,
      p_customer_first_name: customer.firstName,
      p_customer_last_name: customer.lastName,
      p_customer_email: customer.email,
      p_customer_phone: customer.phone,
      p_notes: notes || null
    })

  if (error) {
    console.error('Error creating booking:', error)
    return {
      success: false,
      errorMessage: error.message
    }
  }

  const result = data && data.length > 0 ? data[0] : null

  if (!result) {
    return {
      success: false,
      errorMessage: 'Booking failed - no response'
    }
  }

  return {
    success: result.success,
    appointmentId: result.appointment_id || undefined,
    errorMessage: result.error_message || undefined
  }
}

/**
 * Verify if a tenant slug exists and is active
 * Used for quick checks without fetching full tenant data
 */
export async function verifyTenantSlug(slug: string): Promise<boolean> {
  const supabase = createSupabaseClient()

  const { data, error } = await supabase
    .rpc('verify_tenant_slug', { p_slug: slug })

  if (error) {
    console.error('Error verifying tenant slug:', error)
    return false
  }

  return data === true
}