'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  ArrowLeft,
  ArrowRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  CheckCircle2,
  Mail,
  Phone,
  AlertCircle,
  Loader2,
  Star,
  UserCheck,
  ShoppingCart,
  X,
  Timer,
  Euro,
  ChevronRight,
  Check,
  MapPin,
  Sparkles,
  Shield
} from 'lucide-react'
import { format, addDays, isBefore, isAfter, startOfDay, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import { getPublicServices, getPublicStaff, getPublicAvailableSlots, createPublicBooking } from '@/lib/api/public-tenant'

type BookingStep = 'service' | 'datetime' | 'details' | 'confirmation'

interface Service {
  id: string
  name: string
  duration: number
  price: string
  description_short?: string
  category?: string
  category_id?: string
  service_categories?: { name: string }
}

interface Staff {
  id: string
  first_name: string
  last_name: string
  specializations?: string[]
}

interface TimeSlot {
  time: string
  available: boolean
  staff: Array<{
    staff_id: string
    staff_name: string
  }>
}

interface CustomerData {
  name: string
  email: string
  phone: string
  notes: string
  marketing_consent: boolean
  terms_accepted: boolean
}

interface BookingState {
  services: Service[]
  staff: Staff | null
  date: Date | null
  time: string | null
  customer: CustomerData
  appointmentId: string | null
  error: string | null
}

interface Props {
  tenantId: string
  tenantSlug: string
  customerSession?: {
    customerId: string
    name: string
    email: string
    phone?: string
    preferredStaffId?: string
  } | null
  isPreviewMode?: boolean
}

export default function ProfessionalBookingWidget({ tenantId, tenantSlug, customerSession, isPreviewMode = false }: Props) {
  const searchParams = useSearchParams()
  const preselectedService = searchParams.get('service')

  const [currentStep, setCurrentStep] = useState<BookingStep>('service')
  const [bookingState, setBookingState] = useState<BookingState>({
    services: [],
    staff: null,
    date: null,
    time: null,
    customer: {
      name: customerSession?.name || '',
      email: customerSession?.email || '',
      phone: customerSession?.phone || '',
      notes: '',
      marketing_consent: false,
      terms_accepted: false
    },
    appointmentId: null,
    error: null
  })

  const [services, setServices] = useState<Service[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (preselectedService && services.length > 0) {
      const service = services.find(s => s.id === preselectedService)
      if (service) {
        handleServiceSelect(service)
      }
    }
  }, [preselectedService, services])

  useEffect(() => {
    if (bookingState.date && bookingState.services.length > 0) {
      loadAvailableSlots()
    }
  }, [bookingState.date, bookingState.services, bookingState.staff])

  const loadInitialData = async () => {
    try {
      const servicesData = await getPublicServices(tenantSlug)
      setServices(servicesData as any || [])

      const staffData = await getPublicStaff(tenantSlug)
      const mappedStaff = staffData.map(s => ({
        id: s.id,
        first_name: s.display_name,
        last_name: '',
        specializations: []
      }))
      setStaff(mappedStaff)

      if (mappedStaff.length > 0) {
        setBookingState(prev => ({ ...prev, staff: mappedStaff[0] }))
      }
    } catch (error) {
      console.error('Error loading initial data:', error)
      setBookingState(prev => ({ ...prev, error: 'Fehler beim Laden der Daten' }))
    }
  }

  const loadAvailableSlots = async () => {
    if (!bookingState.date || bookingState.services.length === 0) return

    setLoading(true)
    try {
      const staffId = bookingState.staff?.id || staff[0]?.id
      if (!staffId) {
        setAvailableSlots([])
        return
      }

      const slots = await getPublicAvailableSlots(
        tenantSlug,
        bookingState.services.map(s => s.id),
        staffId,
        format(bookingState.date, 'yyyy-MM-dd')
      )

      const mappedSlots = slots.map(slot => ({
        time: format(parseISO(slot.slot_time), 'HH:mm'),
        available: slot.available,
        staff: staffId ? [{
          staff_id: staffId,
          staff_name: bookingState.staff?.first_name || 'Staff'
        }] : []
      }))
      setAvailableSlots(mappedSlots)
    } catch (error) {
      console.error('Error loading slots:', error)
    } finally {
      setLoading(false)
    }
  }

  const confirmBooking = async () => {
    if (!bookingState.date || !bookingState.time || !bookingState.staff) {
      setBookingState(prev => ({ ...prev, error: 'Bitte wählen Sie Datum, Zeit und Mitarbeiter' }))
      return
    }

    setLoading(true)
    try {
      const [hours, minutes] = bookingState.time.split(':')
      const localDate = new Date(bookingState.date)
      localDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)
      const startTime = localDate.toISOString()

      const [firstName, lastName] = bookingState.customer.name.split(' ', 2)

      const result = await createPublicBooking(
        tenantSlug,
        bookingState.services.map(s => s.id),
        bookingState.staff.id,
        startTime,
        {
          firstName: firstName || bookingState.customer.name,
          lastName: lastName || '',
          email: bookingState.customer.email,
          phone: bookingState.customer.phone
        },
        bookingState.customer.notes
      )

      if (result.success && result.appointmentId) {
        setBookingState(prev => ({ ...prev, appointmentId: result.appointmentId }))
        setCurrentStep('confirmation')
      } else {
        setBookingState(prev => ({ ...prev, error: result.errorMessage || 'Fehler beim Buchen' }))
      }
    } catch (error) {
      console.error('Error confirming booking:', error)
      setBookingState(prev => ({ ...prev, error: 'Fehler beim Bestätigen der Buchung' }))
    } finally {
      setLoading(false)
    }
  }

  const handleServiceSelect = (service: Service) => {
    setBookingState(prev => {
      const isSelected = prev.services.some(s => s.id === service.id)
      const newServices = isSelected
        ? prev.services.filter(s => s.id !== service.id)
        : [...prev.services, service]
      return { ...prev, services: newServices, error: null }
    })
  }

  const canProceed = () => {
    switch (currentStep) {
      case 'service':
        return bookingState.services.length > 0
      case 'datetime':
        return bookingState.date !== null && bookingState.time !== null
      case 'details':
        return (
          bookingState.customer.name !== '' &&
          bookingState.customer.email !== '' &&
          bookingState.customer.terms_accepted
        )
      default:
        return false
    }
  }

  const totalDuration = bookingState.services.reduce((sum, s) => sum + s.duration, 0)
  const totalPrice = bookingState.services.reduce((sum, s) => sum + parseFloat(s.price), 0)

  const servicesByCategory = services.reduce((acc, service) => {
    const categoryName = (typeof service.service_categories === 'object' && service.service_categories?.name) ||
      service.category ||
      'Weitere Services'
    if (!acc[categoryName]) {
      acc[categoryName] = []
    }
    acc[categoryName].push(service)
    return acc
  }, {} as Record<string, Service[]>)

  const categories = Object.keys(servicesByCategory)

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 pb-20 lg:pb-0">
      <div className="max-w-6xl mx-auto px-4 py-12 lg:px-8">

        {/* Clean Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Termin buchen
          </h1>
          <p className="text-lg text-gray-600">
            Wählen Sie Ihre gewünschten Services und buchen Sie Ihren Termin online
          </p>
        </div>

        {/* Main Container */}
        <div className="grid lg:grid-cols-3 gap-8">

          {/* Left Column - Main Content */}
          <div className="lg:col-span-2">

            {/* Step Indicator */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
              <div className="flex items-center justify-between">
                {['Service', 'Termin', 'Daten', 'Bestätigung'].map((step, index) => {
                  const isActive = index === ['service', 'datetime', 'details', 'confirmation'].indexOf(currentStep)
                  const isPast = index < ['service', 'datetime', 'details', 'confirmation'].indexOf(currentStep)

                  return (
                    <div key={step} className="flex items-center flex-1">
                      <div className="flex items-center">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                            isActive && "bg-black text-white",
                            isPast && "bg-green-500 text-white",
                            !isActive && !isPast && "bg-gray-100 text-gray-400"
                          )}
                        >
                          {isPast ? <Check className="w-4 h-4" /> : index + 1}
                        </div>
                        <span className={cn(
                          "ml-3 text-sm font-medium hidden sm:block",
                          isActive && "text-gray-900",
                          !isActive && "text-gray-400"
                        )}>
                          {step}
                        </span>
                      </div>
                      {index < 3 && (
                        <div
                          className={cn(
                            "flex-1 h-0.5 ml-4 mr-4 transition-all",
                            isPast ? "bg-green-500" : "bg-gray-200"
                          )}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Error Display */}
            {bookingState.error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{bookingState.error}</AlertDescription>
              </Alert>
            )}

            {/* Step Content */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

              {/* Service Selection */}
              {currentStep === 'service' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                      Wählen Sie Ihre Services
                    </h2>
                    <p className="text-gray-600">
                      Sie können mehrere Services gleichzeitig buchen
                    </p>
                  </div>

                  {/* Category Filter */}
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                        selectedCategory === null
                          ? "bg-black text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      )}
                    >
                      Alle Services
                    </button>
                    {categories.map(category => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                          selectedCategory === category
                            ? "bg-black text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        )}
                      >
                        {category}
                      </button>
                    ))}
                  </div>

                  {/* Services Grid */}
                  <div className="grid gap-4">
                    {Object.entries(servicesByCategory)
                      .filter(([category]) => !selectedCategory || category === selectedCategory)
                      .map(([category, categoryServices]) => (
                        <div key={category} className="space-y-3">
                          {selectedCategory === null && (
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                              {category}
                            </h3>
                          )}
                          <div className="grid gap-3">
                            {categoryServices.map((service) => {
                              const isSelected = bookingState.services.some(s => s.id === service.id)
                              return (
                                <button
                                  key={service.id}
                                  onClick={() => handleServiceSelect(service)}
                                  className={cn(
                                    "group relative p-5 rounded-xl border-2 text-left transition-all hover:shadow-md",
                                    isSelected
                                      ? "border-black bg-black/5"
                                      : "border-gray-200 hover:border-gray-300 bg-white"
                                  )}
                                >
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1 pr-4">
                                      <div className="flex items-start justify-between">
                                        <div>
                                          <h4 className="font-semibold text-gray-900 mb-1">
                                            {service.name}
                                          </h4>
                                          {service.description_short && (
                                            <p className="text-sm text-gray-600 mb-3">
                                              {service.description_short}
                                            </p>
                                          )}
                                          <div className="flex items-center gap-4">
                                            <span className="inline-flex items-center gap-1.5 text-sm text-gray-600">
                                              <Clock className="w-4 h-4" />
                                              {service.duration} Min
                                            </span>
                                            <span className="text-lg font-semibold text-gray-900">
                                              €{service.price}
                                            </span>
                                          </div>
                                        </div>
                                        <div className={cn(
                                          "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                          isSelected
                                            ? "border-black bg-black"
                                            : "border-gray-300 group-hover:border-gray-400"
                                        )}>
                                          {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Date & Time Selection */}
              {currentStep === 'datetime' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                      Wählen Sie Datum & Uhrzeit
                    </h2>
                    <p className="text-gray-600">
                      Verfügbare Termine für Ihre ausgewählten Services
                    </p>
                  </div>

                  {/* Staff Selection */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Mitarbeiter</Label>
                    <div className="grid gap-2">
                      {staff.map((member) => (
                        <button
                          key={member.id}
                          onClick={() => setBookingState(prev => ({ ...prev, staff: member, time: null }))}
                          className={cn(
                            "p-4 rounded-lg border text-left transition-all",
                            bookingState.staff?.id === member.id
                              ? "border-black bg-black/5"
                              : "border-gray-200 hover:border-gray-300"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{member.first_name}</span>
                            <div className={cn(
                              "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                              bookingState.staff?.id === member.id
                                ? "border-black bg-black"
                                : "border-gray-300"
                            )}>
                              {bookingState.staff?.id === member.id && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Calendar */}
                  <div>
                    <Label className="text-base font-medium mb-3 block">Datum</Label>
                    <div className="flex justify-center">
                      <Calendar
                        mode="single"
                        selected={bookingState.date || undefined}
                        onSelect={(date) => setBookingState(prev => ({ ...prev, date, time: null }))}
                        disabled={(date) =>
                          isBefore(date, startOfDay(new Date())) ||
                          isAfter(date, addDays(new Date(), 30))
                        }
                        locale={de}
                        className="rounded-xl border"
                      />
                    </div>
                  </div>

                  {/* Time Slots */}
                  {bookingState.date && (
                    <div>
                      <Label className="text-base font-medium mb-3 block">Uhrzeit</Label>
                      {loading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                        </div>
                      ) : availableSlots.length === 0 ? (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Keine freien Termine an diesem Tag. Bitte wählen Sie einen anderen Tag.
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                          {availableSlots.map((slot) => (
                            <button
                              key={slot.time}
                              onClick={() => setBookingState(prev => ({ ...prev, time: slot.time }))}
                              disabled={!slot.available}
                              className={cn(
                                "py-2.5 px-3 rounded-lg font-medium text-sm transition-all",
                                bookingState.time === slot.time
                                  ? "bg-black text-white"
                                  : slot.available
                                  ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
                                  : "bg-gray-50 text-gray-300 cursor-not-allowed"
                              )}
                            >
                              {slot.time}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Customer Details */}
              {currentStep === 'details' && !customerSession && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                      Ihre Kontaktdaten
                    </h2>
                    <p className="text-gray-600">
                      Bitte geben Sie Ihre Daten für die Terminbestätigung ein
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="name" className="mb-2 block">
                          Vollständiger Name *
                        </Label>
                        <Input
                          id="name"
                          value={bookingState.customer.name}
                          onChange={(e) => setBookingState(prev => ({
                            ...prev,
                            customer: { ...prev.customer, name: e.target.value }
                          }))}
                          className="h-11"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="email" className="mb-2 block">
                          E-Mail-Adresse *
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={bookingState.customer.email}
                          onChange={(e) => setBookingState(prev => ({
                            ...prev,
                            customer: { ...prev.customer, email: e.target.value }
                          }))}
                          className="h-11"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="phone" className="mb-2 block">
                        Telefonnummer (optional)
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={bookingState.customer.phone}
                        onChange={(e) => setBookingState(prev => ({
                          ...prev,
                          customer: { ...prev.customer, phone: e.target.value }
                        }))}
                        className="h-11"
                      />
                    </div>

                    <div>
                      <Label htmlFor="notes" className="mb-2 block">
                        Anmerkungen (optional)
                      </Label>
                      <Textarea
                        id="notes"
                        value={bookingState.customer.notes}
                        onChange={(e) => setBookingState(prev => ({
                          ...prev,
                          customer: { ...prev.customer, notes: e.target.value }
                        }))}
                        rows={3}
                        className="resize-none"
                      />
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="terms"
                          checked={bookingState.customer.terms_accepted}
                          onCheckedChange={(checked) => setBookingState(prev => ({
                            ...prev,
                            customer: { ...prev.customer, terms_accepted: checked as boolean }
                          }))}
                          className="mt-1"
                        />
                        <Label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed cursor-pointer">
                          Ich akzeptiere die <a href="/recht/agb" className="underline hover:text-black">AGB</a> und{' '}
                          <a href="/recht/datenschutz" className="underline hover:text-black">Datenschutzerklärung</a> *
                        </Label>
                      </div>

                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="marketing"
                          checked={bookingState.customer.marketing_consent}
                          onCheckedChange={(checked) => setBookingState(prev => ({
                            ...prev,
                            customer: { ...prev.customer, marketing_consent: checked as boolean }
                          }))}
                          className="mt-1"
                        />
                        <Label htmlFor="marketing" className="text-sm text-gray-600 leading-relaxed cursor-pointer">
                          Ich möchte über Angebote und Neuigkeiten per E-Mail informiert werden
                        </Label>
                      </div>
                    </div>

                    <Alert className="bg-blue-50 border-blue-200">
                      <UserCheck className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-800">
                        Bereits Kunde? <a href="/portal/login" className="font-medium underline hover:text-blue-900">Hier einloggen</a> für schnellere Buchung
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>
              )}

              {/* Confirmation */}
              {currentStep === 'confirmation' && (
                <div className="space-y-6">
                  <div className="text-center py-8">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Termin erfolgreich gebucht!
                    </h2>
                    <p className="text-gray-600">
                      Wir haben Ihnen eine Bestätigung per E-Mail gesendet
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Ihre Buchungsdetails</h3>

                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <CalendarIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-600">Datum</p>
                          <p className="font-medium">
                            {bookingState.date && format(bookingState.date, 'EEEE, dd. MMMM yyyy', { locale: de })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-600">Uhrzeit</p>
                          <p className="font-medium">{bookingState.time} Uhr</p>
                        </div>
                      </div>

                      {bookingState.staff && (
                        <div className="flex items-start gap-3">
                          <User className="w-5 h-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-600">Mitarbeiter</p>
                            <p className="font-medium">{bookingState.staff.first_name}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-600">Services</p>
                          {bookingState.services.map(service => (
                            <p key={service.id} className="font-medium">
                              {service.name} • {service.duration} Min • €{service.price}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button size="lg" className="flex-1 h-12">
                      <CalendarIcon className="mr-2 h-5 w-5" />
                      Zu Kalender hinzufügen
                    </Button>
                    <Button size="lg" variant="outline" className="flex-1 h-12" asChild>
                      <a href="/">
                        Zur Startseite
                      </a>
                    </Button>
                  </div>
                </div>
              )}

              {/* Navigation */}
              {currentStep !== 'confirmation' && (
                <div className="flex justify-between mt-8">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      const steps: BookingStep[] = ['service', 'datetime', 'details', 'confirmation']
                      const currentIndex = steps.indexOf(currentStep)
                      if (currentIndex > 0) {
                        setCurrentStep(steps[currentIndex - 1])
                      }
                    }}
                    disabled={currentStep === 'service'}
                    className="h-12"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Zurück
                  </Button>

                  <Button
                    size="lg"
                    onClick={async () => {
                      if (currentStep === 'service' && canProceed()) {
                        setCurrentStep('datetime')
                      } else if (currentStep === 'datetime' && canProceed()) {
                        if (customerSession) {
                          await confirmBooking()
                        } else {
                          setCurrentStep('details')
                        }
                      } else if (currentStep === 'details') {
                        await confirmBooking()
                      }
                    }}
                    disabled={!canProceed() || loading}
                    className="h-12 min-w-[140px]"
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        {currentStep === 'details' ? 'Jetzt buchen' : 'Weiter'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Summary (Desktop) */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-8">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Zusammenfassung
                </h3>

                {bookingState.services.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">
                      Noch keine Services ausgewählt
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Selected Services */}
                    <div className="space-y-3">
                      {bookingState.services.map((service) => (
                        <div
                          key={service.id}
                          className="flex items-start justify-between gap-3 pb-3 border-b border-gray-100 last:border-0"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-sm text-gray-900">
                              {service.name}
                            </p>
                            <p className="text-sm text-gray-500 mt-0.5">
                              {service.duration} Min
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              €{service.price}
                            </span>
                            <button
                              onClick={() => handleServiceSelect(service)}
                              className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Selected Date & Time */}
                    {(bookingState.date || bookingState.time) && (
                      <div className="pt-3 border-t border-gray-100 space-y-2">
                        {bookingState.date && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <CalendarIcon className="w-4 h-4" />
                            <span>{format(bookingState.date, 'dd. MMM yyyy', { locale: de })}</span>
                          </div>
                        )}
                        {bookingState.time && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span>{bookingState.time} Uhr</span>
                          </div>
                        )}
                        {bookingState.staff && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <User className="w-4 h-4" />
                            <span>{bookingState.staff.first_name}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Totals */}
                    <div className="pt-3 border-t border-gray-100 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Dauer</span>
                        <span className="font-medium">{totalDuration} Minuten</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold">Gesamt</span>
                        <span className="font-bold text-lg">€{totalPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Trust Badges */}
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span>Sofortige Terminbestätigung</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Shield className="w-5 h-5 text-green-500" />
                  <span>Sichere Datenübertragung</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Mail className="w-5 h-5 text-green-500" />
                  <span>E-Mail-Erinnerung</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Bottom Cart - Apple Style */}
        {bookingState.services.length > 0 && (
          <div className="lg:hidden fixed bottom-4 left-4 right-4 z-50">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/30">
              <div className="px-5 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className="w-7 h-7 bg-black rounded-full flex items-center justify-center">
                        <ShoppingCart className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {bookingState.services.length} {bookingState.services.length === 1 ? 'Service' : 'Services'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 ml-9">
                      <span className="flex items-center gap-1">
                        <Timer className="w-3 h-3 opacity-60" />
                        {totalDuration} Min
                      </span>
                      {bookingState.date && (
                        <>
                          <span className="text-gray-300">•</span>
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="w-3 h-3 opacity-60" />
                            {format(bookingState.date, 'dd.MM.', { locale: de })}
                          </span>
                        </>
                      )}
                      {bookingState.time && (
                        <>
                          <span className="text-gray-300">•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 opacity-60" />
                            {bookingState.time}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-gray-900">
                      €{totalPrice.toFixed(2)}
                    </div>
                    <button
                      onClick={() => {
                        const cartDetails = document.getElementById('mobile-cart-details')
                        if (cartDetails) {
                          cartDetails.classList.toggle('hidden')
                        }
                      }}
                      className="text-xs text-blue-600 font-semibold mt-0.5"
                    >
                      Details
                    </button>
                  </div>
                </div>

                {/* Expandable Details */}
                <div id="mobile-cart-details" className="hidden mt-4 pt-4 border-t border-gray-100/50">
                  <div className="space-y-2.5 max-h-36 overflow-y-auto pr-1">
                    {bookingState.services.map((service) => (
                      <div key={service.id} className="flex items-center justify-between bg-gray-50/50 rounded-xl p-2.5">
                        <div className="flex-1">
                          <p className="font-medium text-sm text-gray-900">{service.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{service.duration} Min</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-sm">€{service.price}</span>
                          <button
                            onClick={() => handleServiceSelect(service)}
                            className="w-6 h-6 rounded-full bg-gray-200/60 hover:bg-gray-300/60 flex items-center justify-center transition-colors"
                          >
                            <X className="w-3.5 h-3.5 text-gray-600" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}