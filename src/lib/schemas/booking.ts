import { z } from 'zod'

// ========================================
// EXACT SCHEMA MATCHING PRODUCTION DATABASE
// ========================================

// Service Schema - EXACT column names!
export const ServiceSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  name: z.string().min(2),
  description: z.string().nullable().optional(),
  description_short: z.string().max(140).nullable().optional(),
  duration: z.number().int().positive(), // duration NOT duration_minutes!
  price: z.string(), // stored as string "15.00"
  category: z.string().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  is_active: z.boolean(),
  sort_order: z.number().int().optional(),
  display_order: z.number().int().optional(),
  buffers: z.object({
    prep: z.number().int().min(0).default(0),
    cleanup: z.number().int().min(0).default(0)
  }).default({ prep: 0, cleanup: 0 }),
  staff_ids: z.array(z.string().uuid()).default([]),
  online_booking_enabled: z.boolean().default(true),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional()
})

// Staff Schema - first_name/last_name!
export const StaffSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  first_name: z.string(), // first_name NOT name!
  last_name: z.string(),  // last_name NOT name!
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  role: z.string().nullable().optional(),
  specializations: z.array(z.string()).nullable().optional(),
  working_hours: z.record(z.any()).default({}),
  breaks: z.array(z.any()).default([]),
  buffer_before: z.number().int().min(0).default(0),
  buffer_after: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
  can_book_appointments: z.boolean().default(true),
  display_order: z.number().int().nullable().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional()
})

// Customer Schema - first_name/last_name!
export const CustomerSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  user_id: z.string().uuid().nullable().optional(),
  first_name: z.string(), // first_name NOT full_name!
  last_name: z.string(),  // last_name NOT full_name!
  email: z.string().email(),
  phone: z.string().nullable().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
  source: z.enum(['manual', 'online', 'phone', 'walk-in']).default('manual'),
  total_spent: z.number().default(0),
  total_spent_cents: z.number().nullable().optional(),
  visit_count: z.number().int().min(0).default(0),
  last_visit: z.string().datetime().nullable().optional(),
  flags: z.record(z.any()).default({}),
  consents: z.object({
    marketing: z.boolean().default(false),
    terms: z.boolean().default(false),
    privacy: z.boolean().default(false)
  }).default({}),
  preferred_staff_id: z.string().uuid().nullable().optional(),
  no_show_count: z.number().int().min(0).default(0),
  canceled_count: z.number().int().min(0).default(0),
  trust_score: z.number().int().min(0).max(100).default(50),
  notes: z.string().nullable().optional(),
  marketing_consent: z.boolean().default(false),
  terms_accepted: z.boolean().default(false),
  created_by: z.string().uuid().nullable().optional(),
  search_tsv: z.string().nullable().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional()
})

// Appointment Hold Schema
export const AppointmentHoldSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  customer_id: z.string().uuid().nullable().optional(),
  user_id: z.string().uuid().nullable().optional(),
  service_id: z.string().uuid(),
  staff_id: z.string().uuid().nullable().optional(),
  start_time: z.string().datetime(), // start_time NOT start_ts!
  end_time: z.string().datetime(),   // end_time NOT end_ts!
  expires_at: z.string().datetime(),
  session_id: z.string(),
  created_at: z.string().datetime().optional()
})

// Appointment Schema - EXACT column names!
export const AppointmentSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  customer_id: z.string().uuid().nullable().optional(),
  staff_id: z.string().uuid().nullable().optional(),
  service_id: z.string().uuid(),
  status: z.enum(['requested', 'confirmed', 'completed', 'cancelled', 'no_show']),
  notes: z.string().nullable().optional(),
  total_price: z.string().nullable().optional(), // string like "90.00"
  paid_amount: z.string().nullable().optional(), // string like "0.00"
  payment_status: z.enum(['PENDING', 'PAID', 'PARTIAL', 'REFUNDED']).nullable().optional(),
  total_amount_cents: z.number().nullable().optional(),
  time_range: z.string().optional(), // PostgreSQL tstzrange as string
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
  duration_minutes: z.number().nullable().optional(), // generated column
  cancelled_at: z.string().datetime().nullable().optional(),
  cancelled_by: z.string().nullable().optional(),
  hold_id: z.string().uuid().nullable().optional(),
  confirmed_at: z.string().datetime().nullable().optional(),
  canceled_at: z.string().datetime().nullable().optional(),
  canceled_by: z.enum(['customer', 'salon', 'system']).nullable().optional(),
  cancellation_reason: z.string().nullable().optional(),
  reminder_sent_at: z.string().datetime().nullable().optional(),
  checked_in_at: z.string().datetime().nullable().optional(),
  completed_at: z.string().datetime().nullable().optional(),
  no_show_marked_at: z.string().datetime().nullable().optional(),
  source: z.enum(['online', 'phone', 'walk-in', 'admin']).default('online'),
  metadata: z.record(z.any()).default({}),
  created_by: z.string().uuid().nullable().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional()
})

// Time Slot Response
export const TimeSlotSchema = z.object({
  time: z.string().regex(/^\d{2}:\d{2}$/), // HH:mm format
  available: z.boolean(),
  staff: z.array(z.object({
    staff_id: z.string().uuid(),
    staff_name: z.string()
  })).optional()
})

// Available Slot from DB Function
export const AvailableSlotSchema = z.object({
  staff_id: z.string().uuid(),
  staff_name: z.string(),
  slot_start: z.string().datetime(),
  slot_end: z.string().datetime(),
  available: z.boolean()
})

// ========================================
// API REQUEST SCHEMAS
// ========================================

export const GetSlotsRequestSchema = z.object({
  service_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  staff_id: z.string().uuid().optional()
})

export const HoldSlotRequestSchema = z.object({
  service_id: z.string().uuid(),
  staff_id: z.string().uuid().optional(),
  start_time: z.string().datetime(),
  duration_minutes: z.number().int().min(15).max(480).optional() // optional, will use service duration
})

export const ConfirmAppointmentRequestSchema = z.object({
  hold_id: z.string().uuid(),
  customer: z.object({
    first_name: z.string().min(1), // first_name!
    last_name: z.string().min(1),  // last_name!
    email: z.string().email(),
    phone: z.string().optional(),
    notes: z.string().optional(),
    marketing_consent: z.boolean().default(false),
    terms_accepted: z.boolean()
  })
})

export const CancelAppointmentRequestSchema = z.object({
  appointment_id: z.string().uuid(),
  reason: z.string().optional()
})

// ========================================
// VIEW SCHEMAS
// ========================================

export const CustomerAppointmentHistorySchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  customer_id: z.string().uuid().nullable(),
  service_id: z.string().uuid(),
  staff_id: z.string().uuid().nullable(),
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
  time_range: z.string().nullable(),
  status: z.string(),
  notes: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().nullable(),
  confirmed_at: z.string().datetime().nullable(),
  canceled_at: z.string().datetime().nullable(),
  canceled_by: z.string().nullable(),
  cancellation_reason: z.string().nullable(),
  completed_at: z.string().datetime().nullable(),
  total_price: z.string().nullable(),
  paid_amount: z.string().nullable(),
  payment_status: z.string().nullable(),
  service_name: z.string(),
  duration_minutes: z.number(), // from services.duration
  service_price: z.string(),
  staff_name: z.string().nullable(),
  staff_first_name: z.string().nullable(),
  staff_last_name: z.string().nullable(),
  customer_email: z.string().nullable(),
  customer_name: z.string().nullable(),
  customer_first_name: z.string().nullable(),
  customer_last_name: z.string().nullable(),
  customer_phone: z.string().nullable()
})

// ========================================
// TYPE EXPORTS
// ========================================

export type Service = z.infer<typeof ServiceSchema>
export type Staff = z.infer<typeof StaffSchema>
export type Customer = z.infer<typeof CustomerSchema>
export type AppointmentHold = z.infer<typeof AppointmentHoldSchema>
export type Appointment = z.infer<typeof AppointmentSchema>
export type TimeSlot = z.infer<typeof TimeSlotSchema>
export type AvailableSlot = z.infer<typeof AvailableSlotSchema>
export type GetSlotsRequest = z.infer<typeof GetSlotsRequestSchema>
export type HoldSlotRequest = z.infer<typeof HoldSlotRequestSchema>
export type ConfirmAppointmentRequest = z.infer<typeof ConfirmAppointmentRequestSchema>
export type CancelAppointmentRequest = z.infer<typeof CancelAppointmentRequestSchema>
export type CustomerAppointmentHistory = z.infer<typeof CustomerAppointmentHistorySchema>