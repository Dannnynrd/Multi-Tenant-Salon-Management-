'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertCircle, Calendar, Clock, User, Scissors, Euro } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { format, addMinutes, isValid } from 'date-fns'
import { de } from 'date-fns/locale'

interface AppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  appointment: any | null
  staff: any[]
  services: any[]
  customers: any[]
  tenantId: string
  defaultDate?: Date | null
  onSuccess: () => void
}

export default function AppointmentModal({
  isOpen,
  onClose,
  appointment,
  staff,
  services,
  customers,
  tenantId,
  defaultDate,
  onSuccess
}: AppointmentModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form state - initialize with default values to avoid uncontrolled/controlled switching
  const [title, setTitle] = useState('Termin')
  const [customerId, setCustomerId] = useState<string>('walk-in')
  const [staffId, setStaffId] = useState('')
  const [serviceId, setServiceId] = useState<string>('none')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [duration, setDuration] = useState(30)
  const [price, setPrice] = useState<number | null>(null)
  const [status, setStatus] = useState('confirmed')
  const [internalNotes, setInternalNotes] = useState('')
  const [customerNotes, setCustomerNotes] = useState('')

  const supabase = createSupabaseClient()

  // Initialize form
  useEffect(() => {
    if (appointment) {
      // Edit mode
      setTitle(appointment.title || 'Termin')
      setCustomerId(appointment.customer_id || 'walk-in')
      setStaffId(appointment.staff_id || '')
      setServiceId(appointment.service_id || 'none')

      const startDate = new Date(appointment.start_time)
      if (isValid(startDate)) {
        setDate(format(startDate, 'yyyy-MM-dd'))
        setStartTime(format(startDate, 'HH:mm'))
      }
      setDuration(appointment.duration_minutes || 30)
      setPrice(appointment.total_price)
      setStatus(appointment.status || 'confirmed')
      setInternalNotes('')
      setCustomerNotes(appointment.notes || '')
    } else if (defaultDate && isValid(defaultDate)) {
      // New appointment with selected date
      setDate(format(defaultDate, 'yyyy-MM-dd'))
      setStartTime(format(defaultDate, 'HH:mm'))
    } else {
      // New appointment
      const now = new Date()
      setDate(format(now, 'yyyy-MM-dd'))
      setStartTime('10:00')
    }

    // Set first staff member as default if none selected
    if (!staffId && staff.length > 0) {
      setStaffId(staff[0].id)
    }
  }, [appointment, defaultDate, staff, staffId])

  // Update title and duration when service changes
  useEffect(() => {
    if (serviceId && serviceId !== 'none' && services) {
      const service = services.find(s => s.id === serviceId)
      if (service) {
        // Only update title for new appointments or when title is default
        if (!appointment && (!title || title === 'Termin' || title === 'Neuer Termin')) {
          setTitle(service.name)
        }
        setDuration(service.duration_minutes)
        setPrice(service.price)
      }
    }
  }, [serviceId, services, appointment])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Ensure date and time are valid
      if (!date || !startTime) {
        setError('Bitte wählen Sie Datum und Uhrzeit')
        setLoading(false)
        return
      }

      const startDateTime = new Date(`${date}T${startTime}`)

      // Check if date is valid
      if (!isValid(startDateTime)) {
        setError('Ungültiges Datum oder Uhrzeit')
        setLoading(false)
        return
      }

      const endDateTime = addMinutes(startDateTime, duration || 30)

      // For writing to appointments table with time_range
      const appointmentData: any = {
        staff_id: staffId,
        customer_id: customerId === 'walk-in' ? null : customerId,
        service_id: serviceId === 'none' ? null : serviceId,
        time_range: `[${startDateTime.toISOString()},${endDateTime.toISOString()})`,
        status,
        notes: customerNotes || internalNotes || null,
        tenant_id: tenantId
      }
      // Don't send total_price - DB will cache from service

      let result
      if (appointment) {
        // Update existing appointment
        result = await supabase
          .from('appointments')
          .update(appointmentData)
          .eq('id', appointment.id)
          .select()
          .single()
      } else {
        // Create new appointment
        result = await supabase
          .from('appointments')
          .insert(appointmentData)
          .select()
          .single()
      }

      if (result.error) {
        throw result.error
      }

      onSuccess()
    } catch (err: any) {
      console.error('Error saving appointment:', err)
      if (err.message?.includes('overlap')) {
        setError('Es gibt bereits einen Termin zu dieser Zeit für diesen Mitarbeiter')
      } else {
        setError(err.message || 'Fehler beim Speichern')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {appointment ? 'Termin bearbeiten' : 'Neuer Termin'}
          </DialogTitle>
          <DialogDescription>
            {appointment ? 'Bearbeiten Sie die Termindetails' : 'Erstellen Sie einen neuen Termin'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-800 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Service Selection */}
          <div className="space-y-2">
            <Label htmlFor="service">
              <Scissors className="h-4 w-4 inline mr-2" />
              Service
            </Label>
            <Select
              value={serviceId}
              onValueChange={setServiceId}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Service wählen (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Kein Service</SelectItem>
                {services.map(service => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name} • {service.duration_minutes || service.duration || 0} Min • €{service.price || '0'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Titel *</Label>
            <Input
              id="title"
              value={title || ''}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. Haarschnitt"
              required
            />
          </div>

          {/* Customer Selection */}
          <div className="space-y-2">
            <Label htmlFor="customer">
              <User className="h-4 w-4 inline mr-2" />
              Kunde
            </Label>
            <Select
              value={customerId}
              onValueChange={setCustomerId}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Kunde wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="walk-in">Laufkunde</SelectItem>
                {customers.map(customer => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.first_name} {customer.last_name}
                    {customer.phone && ` • ${customer.phone}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Staff Selection */}
          <div className="space-y-2">
            <Label htmlFor="staff">
              <User className="h-4 w-4 inline mr-2" />
              Mitarbeiter *
            </Label>
            <Select value={staffId} onValueChange={setStaffId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Mitarbeiter wählen" />
              </SelectTrigger>
              <SelectContent>
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
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">
                <Calendar className="h-4 w-4 inline mr-2" />
                Datum *
              </Label>
              <Input
                id="date"
                type="date"
                value={date || ''}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">
                <Clock className="h-4 w-4 inline mr-2" />
                Uhrzeit *
              </Label>
              <Input
                id="time"
                type="time"
                value={startTime || ''}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Duration and Price */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Dauer (Minuten) *</Label>
              <Input
                id="duration"
                type="number"
                value={duration || 30}
                onChange={(e) => setDuration(parseInt(e.target.value) || 30)}
                min="15"
                max="480"
                step="15"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">
                <Euro className="h-4 w-4 inline mr-2" />
                Preis
              </Label>
              <Input
                id="price"
                type="number"
                value={price ?? ''}
                onChange={(e) => setPrice(e.target.value ? parseFloat(e.target.value) : null)}
                min="0"
                step="0.01"
                placeholder="0.00"
                disabled
              />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="confirmed">Bestätigt</SelectItem>
                <SelectItem value="cancelled">Abgesagt</SelectItem>
                <SelectItem value="completed">Abgeschlossen</SelectItem>
                <SelectItem value="no_show">Nicht erschienen</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="internal-notes">Interne Notizen</Label>
            <Textarea
              id="internal-notes"
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Notizen für das Team..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer-notes">Kundennotizen</Label>
            <Textarea
              id="customer-notes"
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              placeholder="Notizen für den Kunden..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Speichere...' : appointment ? 'Speichern' : 'Termin erstellen'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}