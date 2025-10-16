'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { InfoCard } from '@/components/ui/info-card'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Phone, Mail, Calendar, Clock, User, MapPin, CreditCard,
  Edit2, Trash2, Plus, FileText, Lock, TrendingUp, Euro
} from 'lucide-react'
import { format, parseISO, differenceInDays } from 'date-fns'
import { de } from 'date-fns/locale'
import { createSupabaseClient } from '@/lib/supabase/client'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import CustomerFormModal from '../customer-form-modal'

interface Customer {
  id: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  notes?: string
  created_at: string
  updated_at: string
}

interface Appointment {
  id: string
  start_time: string
  end_time: string
  status: string
  service?: {
    name: string
    duration: number
    price: number
  }
  staff?: {
    name: string
  }
}

interface CustomerDetailViewProps {
  customer: Customer
  appointments: Appointment[]
  hasAdvancedCRM: boolean
  tenantId: string
}

export default function CustomerDetailView({
  customer,
  appointments,
  hasAdvancedCRM,
  tenantId
}: CustomerDetailViewProps) {
  const router = useRouter()
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const supabase = createSupabaseClient()

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customer.id)

      if (error) throw error
      router.push('/dashboard/customers')
    } catch (err) {
      console.error('Error deleting customer:', err)
      setDeleting(false)
    }
  }

  // Calculate customer stats
  const customerSince = differenceInDays(new Date(), parseISO(customer.created_at))
  const totalAppointments = appointments.length
  const completedAppointments = appointments.filter(a => a.status === 'completed').length
  const totalRevenue = appointments
    .filter(a => a.status === 'completed')
    .reduce((sum, a) => sum + (a.service?.price || 0), 0)

  const upcomingAppointments = appointments.filter(a =>
    new Date(a.start_time) > new Date() && a.status !== 'cancelled'
  )
  const pastAppointments = appointments.filter(a =>
    new Date(a.start_time) <= new Date() || a.status === 'cancelled'
  )

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-700 border-0">Bestätigt</Badge>
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-700 border-0">Ausstehend</Badge>
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-700 border-0">Abgeschlossen</Badge>
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-500 border-0">Abgesagt</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <>
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column - Basic Info */}
        <div className="col-span-4 space-y-4">
          {/* Contact Information */}
          <InfoCard
            title="Kontaktinformationen"
            items={[
              {
                label: 'E-Mail',
                value: customer.email,
                icon: Mail
              },
              {
                label: 'Telefon',
                value: customer.phone,
                icon: Phone
              },
              {
                label: 'Kunde seit',
                value: format(parseISO(customer.created_at), 'dd. MMMM yyyy', { locale: de }),
                icon: Calendar
              }
            ]}
          />

          {/* Stats */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Statistiken</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Kunde seit</span>
                <span className={`text-sm font-semibold ${!hasAdvancedCRM ? 'blur-sm select-none' : ''}`}>
                  {customerSince} Tagen
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Termine gesamt</span>
                <span className={`text-sm font-semibold ${!hasAdvancedCRM ? 'blur-sm select-none' : ''}`}>
                  {totalAppointments}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Abgeschlossen</span>
                <span className={`text-sm font-semibold ${!hasAdvancedCRM ? 'blur-sm select-none' : ''}`}>
                  {completedAppointments}
                </span>
              </div>
              {hasAdvancedCRM && (
                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Gesamtumsatz</span>
                    <span className="text-sm font-semibold">€{totalRevenue.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Actions */}
          <Card className="p-4 space-y-2">
            <Button
              onClick={() => setShowEditModal(true)}
              className="w-full justify-start gap-2"
              variant="outline"
            >
              <Edit2 className="h-4 w-4" />
              Bearbeiten
            </Button>
            <Button
              onClick={() => router.push(`/dashboard/appointments/new?customer=${customer.id}`)}
              className="w-full justify-start gap-2"
              variant="outline"
            >
              <Plus className="h-4 w-4" />
              Termin buchen
            </Button>
            <Button
              onClick={() => setShowDeleteDialog(true)}
              className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              variant="outline"
            >
              <Trash2 className="h-4 w-4" />
              Löschen
            </Button>
          </Card>
        </div>

        {/* Right Column - Tabs */}
        <div className="col-span-8">
          <Card className="h-full">
            <Tabs defaultValue="appointments" className="h-full">
              <div className="border-b px-6 pt-6">
                <TabsList className="flex gap-6 h-auto p-0 bg-white rounded-none border-none">
                  <TabsTrigger
                    value="appointments"
                    className="flex-none bg-white hover:bg-white data-[state=active]:bg-white border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:shadow-none rounded-none px-0 pb-3 font-medium text-gray-600 data-[state=active]:text-gray-900 disabled:opacity-50"
                    disabled={!hasAdvancedCRM}
                  >
                    <span className="flex items-center gap-1">
                      {!hasAdvancedCRM && <Lock className="h-3.5 w-3.5" />}
                      Termine
                    </span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="notes"
                    className="flex-none bg-white hover:bg-white data-[state=active]:bg-white border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:shadow-none rounded-none px-0 pb-3 font-medium text-gray-600 data-[state=active]:text-gray-900 disabled:opacity-50"
                    disabled={!hasAdvancedCRM}
                  >
                    <span className="flex items-center gap-1">
                      {!hasAdvancedCRM && <Lock className="h-3.5 w-3.5" />}
                      Notizen
                    </span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="history"
                    className="flex-none bg-white hover:bg-white data-[state=active]:bg-white border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:shadow-none rounded-none px-0 pb-3 font-medium text-gray-600 data-[state=active]:text-gray-900 disabled:opacity-50"
                    disabled={!hasAdvancedCRM}
                  >
                    <span className="flex items-center gap-1">
                      {!hasAdvancedCRM && <Lock className="h-3.5 w-3.5" />}
                      Historie
                    </span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="appointments" className="p-6">
                {hasAdvancedCRM ? (
                  <div className="space-y-6">
                    {/* Upcoming Appointments - Professional Feature */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Bevorstehende Termine</h4>
                      {upcomingAppointments.length > 0 ? (
                        <div className="space-y-2">
                          {upcomingAppointments.map((appointment) => (
                            <div
                              key={appointment.id}
                              className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                            >
                              <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    <span className="font-medium">
                                      {format(parseISO(appointment.start_time), 'dd.MM.yyyy', { locale: de })}
                                    </span>
                                    <Clock className="h-4 w-4 text-gray-400 ml-2" />
                                    <span className="text-sm">
                                      {format(parseISO(appointment.start_time), 'HH:mm', { locale: de })}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600">
                                    {appointment.service?.name} • {appointment.staff?.name}
                                  </p>
                                  {appointment.service?.price && (
                                    <p className="text-sm font-medium">€{appointment.service.price}</p>
                                  )}
                                </div>
                                {getStatusBadge(appointment.status)}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Keine bevorstehenden Termine</p>
                      )}
                    </div>

                    {/* Past Appointments */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Vergangene Termine</h4>
                      {pastAppointments.length > 0 ? (
                        <div className="space-y-2">
                          {pastAppointments.slice(0, 5).map((appointment) => (
                            <div
                              key={appointment.id}
                              className="p-3 border border-gray-200 rounded-lg opacity-75"
                            >
                              <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm">
                                      {format(parseISO(appointment.start_time), 'dd.MM.yyyy', { locale: de })}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600">
                                    {appointment.service?.name}
                                  </p>
                                </div>
                                {getStatusBadge(appointment.status)}
                              </div>
                            </div>
                          ))}
                          {pastAppointments.length > 5 && (
                            <p className="text-sm text-gray-500 text-center pt-2">
                              +{pastAppointments.length - 5} weitere Termine
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Keine vergangenen Termine</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="py-8">
                    <EmptyState
                      icon={Lock}
                      title="Professional Feature"
                      description="Upgrade auf Professional für detaillierte Terminhistorie und Kundenmanagement."
                      action={{
                        label: "Jetzt upgraden",
                        onClick: () => router.push('/dashboard/billing')
                      }}
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="notes" className="p-6">
                <div className="py-8">
                  <EmptyState
                    icon={FileText}
                    title="Notizen"
                    description={hasAdvancedCRM ? customer.notes || "Keine Notizen vorhanden" : "Diese Funktion ist im Professional Plan verfügbar"}
                  />
                </div>
              </TabsContent>

              <TabsContent value="history" className="p-6">
                <div className="py-8">
                  <EmptyState
                    icon={Clock}
                    title="Historie"
                    description="Diese Funktion ist im Professional Plan verfügbar"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <CustomerFormModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          customer={customer}
          tenantId={tenantId}
          onSuccess={() => {
            router.refresh()
            setShowEditModal(false)
          }}
        />
      )}

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kunde löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie {customer.first_name} {customer.last_name} wirklich löschen?
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Lösche...' : 'Löschen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}