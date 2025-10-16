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
import { Checkbox } from '@/components/ui/checkbox'
import { AlertCircle, Calendar, Clock, User, Scissors, Euro, Plus, X } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { format, addMinutes, isValid } from 'date-fns'
import { de } from 'date-fns/locale'

interface Service {
  id: string
  name: string
  duration: number
  duration_minutes?: number
  price: number
  category_id?: string | null
}

interface SelectedService {
  service: Service
  position: number
}

interface AppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  appointment: any | null
  staff: any[]
  services: Service[]
  customers: any[]
  tenantId: string
  defaultDate?: Date | null
  onSuccess: () => void
}

export default function AppointmentModalMultiService({
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

  // Form state
  const [customerId, setCustomerId] = useState<string>('walk-in')
  const [staffId, setStaffId] = useState('')
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([])
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [status, setStatus] = useState('confirmed')
  const [internalNotes, setInternalNotes] = useState('')
  const [customerNotes, setCustomerNotes] = useState('')

  const supabase = createSupabaseClient()

  // Calculate total duration and price
  const totalDuration = selectedServices.reduce((sum, item) =>
    sum + (item.service.duration_minutes || item.service.duration || 30), 0
  )
  const totalPrice = selectedServices.reduce((sum, item) =>
    sum + (item.service.price || 0), 0
  )

  // Initialize form
  useEffect(() => {
    if (appointment) {
      // Edit mode - load existing appointment
      setCustomerId(appointment.customer_id || 'walk-in')
      setStaffId(appointment.staff_id || '')

      const startDate = new Date(appointment.start_time)
      if (isValid(startDate)) {
        setDate(format(startDate, 'yyyy-MM-dd'))
        setStartTime(format(startDate, 'HH:mm'))
      }

      setStatus(appointment.status || 'confirmed')
      setInternalNotes('')
      setCustomerNotes(appointment.notes || '')

      // Load existing services from appointment_services
      if (appointment.id) {
        loadAppointmentServices(appointment.id)
      }
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

  const loadAppointmentServices = async (appointmentId: string) => {
    const { data, error } = await supabase
      .from('appointment_services')
      .select('*, services(*)')
      .eq('appointment_id', appointmentId)
      .order('position')

    if (data && !error) {
      const loadedServices = data.map(as => ({
        service: as.services,
        position: as.position
      }))
      setSelectedServices(loadedServices)
    }
  }

  const handleAddService = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId)
    if (service && !selectedServices.find(s => s.service.id === serviceId)) {
      setSelectedServices([...selectedServices, {
        service,
        position: selectedServices.length
      }])
    }
  }

  const handleRemoveService = (serviceId: string) => {
    setSelectedServices(selectedServices.filter(s => s.service.id !== serviceId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!date || !startTime) {
        setError('Bitte wählen Sie Datum und Uhrzeit')
        setLoading(false)
        return
      }

      if (selectedServices.length === 0) {
        setError('Bitte wählen Sie mindestens einen Service')
        setLoading(false)
        return
      }

      const startDateTime = new Date(`${date}T${startTime}`)

      if (!isValid(startDateTime)) {
        setError('Ungültiges Datum oder Uhrzeit')
        setLoading(false)
        return
      }

      const endDateTime = addMinutes(startDateTime, totalDuration)

      // For appointments table
      const appointmentData: any = {
        staff_id: staffId,
        customer_id: customerId === 'walk-in' ? null : customerId,
        service_id: selectedServices[0]?.service.id, // Primary service
        time_range: `[${startDateTime.toISOString()},${endDateTime.toISOString()})`,
        status,
        notes: customerNotes || internalNotes || null,
        tenant_id: tenantId,
        total_price: totalPrice,
        services_metadata: selectedServices.map((s, idx) => ({
          id: s.service.id,
          name: s.service.name,
          duration: s.service.duration_minutes || s.service.duration,
          price: s.service.price,
          position: idx
        }))
      }

      let appointmentResult
      if (appointment) {
        // Update existing appointment
        appointmentResult = await supabase
          .from('appointments')
          .update(appointmentData)
          .eq('id', appointment.id)
          .select()
          .single()

        if (appointmentResult.error) throw appointmentResult.error

        // Delete existing appointment_services
        await supabase
          .from('appointment_services')
          .delete()
          .eq('appointment_id', appointment.id)
      } else {
        // Create new appointment
        appointmentResult = await supabase
          .from('appointments')
          .insert(appointmentData)
          .select()
          .single()

        if (appointmentResult.error) throw appointmentResult.error
      }

      // Insert appointment_services
      const appointmentId = appointmentResult.data.id
      const servicesToInsert = selectedServices.map((s, idx) => ({
        appointment_id: appointmentId,
        service_id: s.service.id,
        position: idx,
        duration_min: s.service.duration_minutes || s.service.duration || 30,
        price_decimal: s.service.price || 0
      }))

      const { error: servicesError } = await supabase
        .from('appointment_services')
        .insert(servicesToInsert)

      if (servicesError) throw servicesError

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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {appointment ? 'Termin bearbeiten' : 'Neuer Termin'}
          </DialogTitle>
          <DialogDescription>
            {appointment ? 'Bearbeiten Sie die Termindetails' : 'Erstellen Sie einen neuen Termin mit mehreren Services'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-800 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Services Selection */}
          <div className="space-y-2">
            <Label>
              <Scissors className="h-4 w-4 inline mr-2" />
              Services auswählen
            </Label>

            {/* Selected Services */}
            {selectedServices.length > 0 && (
              <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                {selectedServices.map((item, idx) => (
                  <div key={item.service.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">{idx + 1}.</span>
                      <span className="font-medium">{item.service.name}</span>
                      <span className="text-sm text-gray-500">
                        {item.service.duration_minutes || item.service.duration} Min
                      </span>
                      <span className="text-sm font-medium">
                        €{item.service.price}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveService(item.service.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="pt-2 mt-2 border-t flex justify-between font-semibold">
                  <span>Gesamt:</span>
                  <span>{totalDuration} Min • €{totalPrice.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Add Service Dropdown */}
            <Select
              value=""
              onValueChange={handleAddService}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Service hinzufügen..." />
              </SelectTrigger>
              <SelectContent>
                {services
                  .filter(s => !selectedServices.find(ss => ss.service.id === s.id))
                  .map(service => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} • {service.duration_minutes || service.duration || 0} Min • €{service.price || '0'}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
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
                    {customer.email && ` (${customer.email})`}
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
            <Select
              value={staffId}
              onValueChange={setStaffId}
              required
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Mitarbeiter wählen" />
              </SelectTrigger>
              <SelectContent>
                {staff.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.first_name} {s.last_name}
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
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">
                <Clock className="h-4 w-4 inline mr-2" />
                Startzeit *
              </Label>
              <Input
                id="time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={status}
              onValueChange={setStatus}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="confirmed">Bestätigt</SelectItem>
                <SelectItem value="pending">Ausstehend</SelectItem>
                <SelectItem value="completed">Abgeschlossen</SelectItem>
                <SelectItem value="cancelled">Abgesagt</SelectItem>
                <SelectItem value="no_show">Nicht erschienen</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notizen</Label>
            <Textarea
              id="notes"
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              placeholder="Zusätzliche Informationen..."
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading || selectedServices.length === 0}>
              {loading ? 'Speichern...' : appointment ? 'Aktualisieren' : 'Termin erstellen'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}