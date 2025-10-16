'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Calendar,
  Clock,
  User,
  Scissors,
  Euro,
  Phone,
  Mail,
  Edit2,
  Trash2,
  FileText
} from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import AppointmentModal from './appointment-modal'

interface AppointmentDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  appointment: any
  staff: any[]
  services: any[]
  customers: any[]
  tenantId: string
  onEdit: () => void
  onDelete: (appointmentId: string) => void
}

export default function AppointmentDetailsModal({
  isOpen,
  onClose,
  appointment,
  staff,
  services,
  customers,
  tenantId,
  onEdit,
  onDelete
}: AppointmentDetailsModalProps) {
  const [loading, setLoading] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const supabase = createSupabaseClient()

  const handleDelete = async () => {
    if (!confirm('Sind Sie sicher, dass Sie diesen Termin löschen möchten?')) {
      return
    }

    setLoading(true)
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', appointment.id)

    if (!error) {
      onDelete(appointment.id)
    }
    setLoading(false)
  }

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true)

    // First get the current appointment to preserve time_range
    const { data: currentApt, error: fetchError } = await supabase
      .from('appointments')
      .select('time_range')
      .eq('id', appointment.id)
      .single()

    if (fetchError || !currentApt) {
      console.error('Error fetching appointment:', fetchError)
      setLoading(false)
      return
    }

    // Update with time_range preserved
    const { error } = await supabase
      .from('appointments')
      .update({
        status: newStatus,
        time_range: currentApt.time_range // Preserve existing time_range
      })
      .eq('id', appointment.id)

    if (!error) {
      appointment.status = newStatus
      // Refresh the page to show updated status
      window.location.reload()
    } else {
      console.error('Error updating status:', error)
    }
    setLoading(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'default'
      case 'completed':
        return 'secondary'
      case 'cancelled':
        return 'destructive'
      case 'no_show':
        return 'outline' // Orange appearance through custom styling
      default:
        return 'outline'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Bestätigt'
      case 'completed':
        return 'Abgeschlossen'
      case 'cancelled':
        return 'Abgesagt'
      case 'no_show':
        return 'Nicht erschienen'
      default:
        return status
    }
  }

  return (
    <>
      <Dialog open={isOpen && !showEditModal} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{appointment.service?.name || appointment.service_name || appointment.title || 'Termin'}</span>
              <Badge
                variant={getStatusColor(appointment.status)}
                className={appointment.status === 'no_show' ? 'bg-orange-100 text-orange-800 border-orange-200' : ''}
              >
                {getStatusLabel(appointment.status)}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Termindetails und Informationen
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Date and Time */}
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">
                  {appointment.start_time && format(new Date(appointment.start_time), 'EEEE, d. MMMM yyyy', { locale: de })}
                </p>
                <p className="text-sm text-gray-600">
                  {appointment.start_time && format(new Date(appointment.start_time), 'HH:mm')} -
                  {appointment.end_time && format(new Date(appointment.end_time), 'HH:mm')} Uhr
                  ({appointment.duration_minutes} Minuten)
                </p>
              </div>
            </div>

            {/* Staff */}
            <div className="flex items-start gap-4">
              <User className="h-5 w-5 text-gray-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-500">Mitarbeiter</p>
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: appointment.staff?.color || '#3B82F6' }}
                  />
                  <p className="font-medium">
                    {appointment.staff?.first_name} {appointment.staff?.last_name}
                  </p>
                </div>
              </div>
            </div>

            {/* Customer */}
            <div className="flex items-start gap-4">
              <User className="h-5 w-5 text-gray-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-500">Kunde</p>
                {appointment.customer ? (
                  <div>
                    <p className="font-medium">
                      {appointment.customer.first_name} {appointment.customer.last_name}
                    </p>
                    {appointment.customer.phone && (
                      <div className="flex items-center gap-2 mt-1">
                        <Phone className="h-3 w-3 text-gray-400" />
                        <p className="text-sm text-gray-600">{appointment.customer.phone}</p>
                      </div>
                    )}
                    {appointment.customer.email && (
                      <div className="flex items-center gap-2 mt-1">
                        <Mail className="h-3 w-3 text-gray-400" />
                        <p className="text-sm text-gray-600">{appointment.customer.email}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="font-medium">Laufkunde</p>
                )}
              </div>
            </div>

            {/* Service */}
            {appointment.service && (
              <div className="flex items-start gap-4">
                <Scissors className="h-5 w-5 text-gray-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Service</p>
                  <p className="font-medium">{appointment.service.name}</p>
                </div>
              </div>
            )}

            {/* Price */}
            {(appointment.total_price !== null || appointment.service_price !== null) && (
              <div className="flex items-start gap-4">
                <Euro className="h-5 w-5 text-gray-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Preis</p>
                  <p className="font-medium">€{appointment.total_price || appointment.service_price || '0.00'}</p>
                </div>
              </div>
            )}

            {/* Notes */}
            {(appointment.internal_notes || appointment.customer_notes) && (
              <div className="space-y-3 pt-2">
                {appointment.internal_notes && (
                  <div className="flex items-start gap-4">
                    <FileText className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Interne Notizen</p>
                      <p className="text-sm mt-1">{appointment.internal_notes}</p>
                    </div>
                  </div>
                )}
                {appointment.customer_notes && (
                  <div className="flex items-start gap-4">
                    <FileText className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Kundennotizen</p>
                      <p className="text-sm mt-1">{appointment.customer_notes}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quick Status Actions */}
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-500 mb-3">Status ändern</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={appointment.status === 'confirmed' ? 'default' : 'outline'}
                  onClick={() => handleStatusChange('confirmed')}
                  disabled={loading || appointment.status === 'confirmed'}
                >
                  ✓ Bestätigt
                </Button>
                <Button
                  size="sm"
                  variant={appointment.status === 'completed' ? 'default' : 'outline'}
                  onClick={() => handleStatusChange('completed')}
                  disabled={loading || appointment.status === 'completed'}
                >
                  ✓ Abgeschlossen
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className={appointment.status === 'no_show' ? 'bg-orange-100 text-orange-800 border-orange-300' : ''}
                  onClick={() => handleStatusChange('no_show')}
                  disabled={loading || appointment.status === 'no_show'}
                >
                  ○ Nicht erschienen
                </Button>
                <Button
                  size="sm"
                  variant={appointment.status === 'cancelled' ? 'destructive' : 'outline'}
                  className={appointment.status !== 'cancelled' ? 'text-red-600 hover:text-red-700' : ''}
                  onClick={() => handleStatusChange('cancelled')}
                  disabled={loading || appointment.status === 'cancelled'}
                >
                  ✗ Abgesagt
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between gap-3 pt-4 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700"
                onClick={handleDelete}
                disabled={loading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Löschen
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={loading}
                >
                  Schließen
                </Button>
                <Button
                  onClick={() => setShowEditModal(true)}
                  disabled={loading}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Bearbeiten
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      {showEditModal && (
        <AppointmentModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          appointment={appointment}
          staff={staff}
          services={services}
          customers={customers}
          tenantId={tenantId}
          defaultDate={null}
          onSuccess={() => {
            setShowEditModal(false)
            // Refresh the page to show updated appointment
            window.location.reload()
          }}
        />
      )}
    </>
  )
}