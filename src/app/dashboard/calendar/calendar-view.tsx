'use client'

import { useState, useEffect, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Plus, ChevronLeft, ChevronRight, Calendar, List, Grid } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import AppointmentModal from './appointment-modal'
import AppointmentDetailsModal from './appointment-details-modal'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

// From calendar_events_v1 view
interface Appointment {
  id: string
  tenant_id: string
  staff_id: string
  customer_id: string | null
  service_id: string | null
  status: string
  start_time: string
  end_time: string
  duration_minutes: number
  payment_status: string
  total_price: number | null
  notes: string | null
  title: string
  color: string
  staff_first_name: string
  staff_last_name: string
  customer_name: string | null
  customer_phone: string | null
  customer_email: string | null
  service_name: string | null
  service_price: number | null
}

interface Staff {
  id: string
  first_name: string
  last_name: string
  color: string
  is_active: boolean
  can_book_appointments: boolean
}

interface Service {
  id: string
  name: string
  duration_minutes: number
  price: number
  category_id: string | null
}

interface Customer {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
}

interface CalendarViewProps {
  initialAppointments: Appointment[]
  staff: Staff[]
  services: Service[]
  customers: Customer[]
  tenantId: string
}

export default function CalendarView({
  initialAppointments,
  staff,
  services,
  customers,
  tenantId
}: CalendarViewProps) {
  const [appointments, setAppointments] = useState(initialAppointments)
  const [showAppointmentModal, setShowAppointmentModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedStaff, setSelectedStaff] = useState<string>('all')
  const [view, setView] = useState<'timeGridWeek' | 'timeGridDay' | 'dayGridMonth' | 'listWeek'>('timeGridWeek')
  const [mounted, setMounted] = useState(false)
  const calendarRef = useRef<FullCalendar>(null)
  const supabase = createSupabaseClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Convert appointments to FullCalendar events
  const calendarEvents = appointments
    .filter(apt => selectedStaff === 'all' || apt.staff_id === selectedStaff)
    .map(apt => ({
      id: apt.id,
      title: apt.service_name || apt.title || 'Termin',
      start: apt.start_time,
      end: apt.end_time,
      backgroundColor: apt.color || '#3B82F6',
      borderColor: apt.color || '#3B82F6',
      extendedProps: {
        appointment: apt,
        customerName: apt.customer_name || 'Laufkunde',
        staffName: `${apt.staff_first_name} ${apt.staff_last_name}`,
        serviceName: apt.service_name || apt.title || 'Termin',
        status: apt.status,
        paymentStatus: apt.payment_status,
        price: apt.total_price
      }
    }))

  const handleDateSelect = (selectInfo: any) => {
    setSelectedDate(new Date(selectInfo.start))
    setShowAppointmentModal(true)
  }

  const handleEventClick = (clickInfo: any) => {
    const appointment = clickInfo.event.extendedProps.appointment
    // Find full appointment data with all relations
    const fullAppointment = appointments.find(apt => apt.id === appointment.id)
    if (fullAppointment) {
      // Add related data
      const appointmentWithRelations = {
        ...fullAppointment,
        staff: staff.find(s => s.id === fullAppointment.staff_id),
        service: services.find(s => s.id === fullAppointment.service_id),
        customer: customers.find(c => c.id === fullAppointment.customer_id)
      }
      setSelectedAppointment(appointmentWithRelations)
      setShowDetailsModal(true)
    }
  }

  const handleEventDrop = async (dropInfo: any) => {
    const appointment = dropInfo.event.extendedProps.appointment
    const newStart = dropInfo.event.start
    const newEnd = dropInfo.event.end

    // Update using time_range since start_time and end_time are generated columns
    const { error } = await supabase
      .from('appointments')
      .update({
        time_range: `[${newStart.toISOString()},${newEnd.toISOString()})`
      })
      .eq('id', appointment.id)

    if (error) {
      console.error('Error updating appointment:', error)
      dropInfo.revert()
    } else {
      // Update local state
      setAppointments(prev =>
        prev.map(apt =>
          apt.id === appointment.id
            ? { ...apt, start_time: newStart.toISOString(), end_time: newEnd.toISOString() }
            : apt
        )
      )
    }
  }

  const handleAppointmentSaved = async () => {
    // Refresh all appointments from view
    const { data } = await supabase
      .from('calendar_events_v1')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('start_time', { ascending: true })

    if (data) {
      setAppointments(data)
    }

    setShowAppointmentModal(false)
    setShowDetailsModal(false)
    setSelectedAppointment(null)
    setSelectedDate(null)
  }

  const handleAppointmentDeleted = async (appointmentId: string) => {
    setAppointments(prev => prev.filter(apt => apt.id !== appointmentId))
    setShowDetailsModal(false)
    setSelectedAppointment(null)
  }

  const navigateToday = () => {
    calendarRef.current?.getApi().today()
  }

  const navigatePrev = () => {
    calendarRef.current?.getApi().prev()
  }

  const navigateNext = () => {
    calendarRef.current?.getApi().next()
  }

  if (!mounted) return null

  return (
    <div className="flex flex-col h-full">
        {/* Header Controls - All in one clean div */}
        <div className="bg-white border rounded-lg rounded-b-none p-4">
          <div className="flex flex-wrap gap-3 justify-between items-center">
            {/* Left: Navigation and Filters */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Button onClick={navigatePrev} variant="outline" size="icon" className="h-8 w-8">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button onClick={navigateToday} variant="outline" size="sm">
                  Heute
                </Button>
                <Button onClick={navigateNext} variant="outline" size="icon" className="h-8 w-8">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="h-6 w-px bg-gray-200" />

              <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                <SelectTrigger className="w-[180px] h-8">
                  <SelectValue placeholder="Alle Mitarbeiter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Mitarbeiter</SelectItem>
                  {staff.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      <span className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: s.color }}
                        />
                        <span>{s.first_name} {s.last_name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={view}
                onValueChange={(v) => setView(v as typeof view)}
              >
                <SelectTrigger className="w-[120px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="timeGridDay">
                    <span className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Tag</span>
                    </span>
                  </SelectItem>
                  <SelectItem value="timeGridWeek">
                    <span className="flex items-center gap-2">
                      <Grid className="h-4 w-4" />
                      <span>Woche</span>
                    </span>
                  </SelectItem>
                  <SelectItem value="dayGridMonth">
                    <span className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Monat</span>
                    </span>
                  </SelectItem>
                  <SelectItem value="listWeek">
                    <span className="flex items-center gap-2">
                      <List className="h-4 w-4" />
                      <span>Liste</span>
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Right: Actions */}
            <Button onClick={() => setShowAppointmentModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Neuer Termin
            </Button>
          </div>
        </div>

        {/* Calendar - Connected to header */}
        <div className="bg-white border border-t-0 rounded-lg rounded-t-none p-4 flex-1">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            initialView={view}
            headerToolbar={false} // We use our custom header
            locale="de"
            firstDay={1} // Start week with Monday
            height="auto"
            events={calendarEvents}
            selectable={true}
            selectMirror={true}
            select={handleDateSelect}
            eventClick={handleEventClick}
            eventDrop={handleEventDrop}
            eventResize={handleEventDrop}
            editable={true}
            dayMaxEvents={true}
            weekends={true}
            slotMinTime="07:00:00"
            slotMaxTime="21:00:00"
            slotDuration="00:15:00"
            slotLabelInterval="01:00:00"
            allDaySlot={false}
            nowIndicator={true}
            eventOverlap={false}
            businessHours={{
              daysOfWeek: [1, 2, 3, 4, 5, 6], // Monday - Saturday
              startTime: '09:00',
              endTime: '19:00'
            }}
            eventContent={(eventInfo) => {
              // Use duration to determine content display
              const durationMinutes = eventInfo.event.extendedProps.appointment?.duration_minutes || 30;
              const viewType = eventInfo.view.type;

              // Different display based on view type and duration
              const isTiny = durationMinutes <= 15;
              const isSmall = durationMinutes <= 30;
              const isMedium = durationMinutes <= 45;

              return (
                <div className="px-1 py-0.5 text-xs overflow-hidden h-full flex flex-col">
                  <div className="flex justify-between items-center">
                    <div className="font-semibold truncate">{eventInfo.timeText}</div>
                    {isSmall && viewType !== 'dayGridMonth' && (
                      <span className="text-[9px] opacity-60 ml-1">
                        {eventInfo.event.extendedProps.status === 'confirmed' && '✓'}
                        {eventInfo.event.extendedProps.status === 'completed' && '✓'}
                        {eventInfo.event.extendedProps.status === 'cancelled' && '✗'}
                        {eventInfo.event.extendedProps.status === 'no_show' && '○'}
                      </span>
                    )}
                  </div>
                  {!isTiny && (
                    <div className="truncate">{eventInfo.event.title}</div>
                  )}
                  {!isSmall && viewType !== 'dayGridMonth' && (
                    <>
                      <div className="truncate opacity-75 text-[10px]">
                        {eventInfo.event.extendedProps.customerName}
                      </div>
                      {!isMedium && (
                        <div className="mt-auto">
                          <span className="text-[10px] opacity-70">
                            {eventInfo.event.extendedProps.status === 'confirmed' && '✓ Bestätigt'}
                            {eventInfo.event.extendedProps.status === 'completed' && '✓ Fertig'}
                            {eventInfo.event.extendedProps.status === 'cancelled' && '✗ Abgesagt'}
                            {eventInfo.event.extendedProps.status === 'no_show' && '○ Nicht da'}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            }}
            dayCellClassNames="hover:bg-gray-50 cursor-pointer"
            eventClassNames="cursor-pointer hover:opacity-90 transition-opacity"
          />
        </div>

      {/* Appointment Modal */}
      {showAppointmentModal && (
        <AppointmentModal
          isOpen={showAppointmentModal}
          onClose={() => {
            setShowAppointmentModal(false)
            setSelectedDate(null)
            setSelectedAppointment(null)
          }}
          appointment={selectedAppointment} // Pass selected appointment for editing
          staff={staff}
          services={services}
          customers={customers}
          tenantId={tenantId}
          defaultDate={selectedDate}
          onSuccess={handleAppointmentSaved}
        />
      )}

      {/* Appointment Details Modal */}
      {showDetailsModal && selectedAppointment && (
        <AppointmentDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false)
            setSelectedAppointment(null)
          }}
          appointment={selectedAppointment}
          staff={staff}
          services={services}
          customers={customers}
          tenantId={tenantId}
          onEdit={() => {
            // Keep selectedAppointment set when transitioning to edit
            setShowDetailsModal(false)
            setShowAppointmentModal(true)
          }}
          onDelete={handleAppointmentDeleted}
        />
      )}
    </div>
  )
}