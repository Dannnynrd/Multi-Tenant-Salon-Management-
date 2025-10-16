'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Calendar } from '@/components/ui/calendar'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ArrowLeft,
  ArrowRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  Scissors,
  CheckCircle,
  Mail,
  Phone,
  AlertCircle,
  Loader2,
  Star,
  UserCheck,
  RefreshCw,
  ShoppingCart,
  X,
  Timer,
  Euro,
  CheckCircle2
} from 'lucide-react'
import { format, addDays, isBefore, isAfter, startOfDay, addMinutes, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { getPublicServices, getPublicStaff, getPublicAvailableSlots, createPublicBooking } from '@/lib/api/public-tenant'

type BookingStep = 'service' | 'staff' | 'datetime' | 'details' | 'confirmation'

interface Service {
  id: string
  name: string
  duration: number // duration not duration_minutes!
  price: string // price is stored as string!
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
  create_account: boolean
  password: string
}

interface BookingState {
  services: Service[]
  staff: Staff | null
  date: Date | null
  time: string | null
  customer: CustomerData
  holdId: string | null
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

export default function EnhancedBookingWidget({ tenantId, tenantSlug, customerSession, isPreviewMode = false }: Props) {
  const searchParams = useSearchParams()
  const preselectedService = searchParams.get('service')
  const rebookAppointment = searchParams.get('rebook')

  // State machine
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
      terms_accepted: false,
      create_account: false,
      password: ''
    },
    holdId: null,
    appointmentId: null,
    error: null
  })

  // Data
  const [services, setServices] = useState<Service[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [lastBookedService, setLastBookedService] = useState<Service | null>(null)

  // UI State
  const [cartOpen, setCartOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Load initial data
  useEffect(() => {
    loadInitialData()
  }, [])

  // Load customer's last booking if logged in
  useEffect(() => {
    if (customerSession?.customerId) {
      loadLastBooking()
    }
  }, [customerSession])

  // Handle preselected service
  useEffect(() => {
    if (preselectedService && services.length > 0) {
      const service = services.find(s => s.id === preselectedService)
      if (service) {
        handleServiceSelect(service)
      }
    }
  }, [preselectedService, services])

  // Load available slots when date and services change
  useEffect(() => {
    if (bookingState.date && bookingState.services.length > 0) {
      loadAvailableSlots()
    }
  }, [bookingState.date, bookingState.services, bookingState.staff])

  const loadInitialData = async () => {
    try {
      // Load services using secure function
      const servicesData = await getPublicServices(tenantSlug)
      setServices(servicesData as any || [])

      // Load staff using secure function
      const staffData = await getPublicStaff(tenantSlug)
      // Map to expected format
      const mappedStaff = staffData.map(s => ({
        id: s.id,
        first_name: s.display_name,
        last_name: '', // Not exposed for privacy
        specializations: []
      }))
      setStaff(mappedStaff)
    } catch (error) {
      console.error('Error loading initial data:', error)
      setBookingState(prev => ({ ...prev, error: 'Fehler beim Laden der Daten' }))
    }
  }

  const loadLastBooking = async () => {
    if (!customerSession?.customerId) return

    try {
      const response = await fetch(`/${tenantSlug}/api/public/customers/last-booking`)
      if (response.ok) {
        const data = await response.json()
        if (data.service) {
          setLastBookedService(data.service)
        }
      }
    } catch (error) {
      console.error('Error loading last booking:', error)
    }
  }

  const loadAvailableSlots = async () => {
    if (!bookingState.date || bookingState.services.length === 0) return

    setLoading(true)
    try {
      // If no staff selected, use first available staff
      const staffId = bookingState.staff?.id || staff[0]?.id
      if (!staffId) {
        setAvailableSlots([])
        return
      }

      // Use secure function to get available slots
      const slots = await getPublicAvailableSlots(
        tenantSlug,
        bookingState.services.map(s => s.id),
        staffId,
        format(bookingState.date, 'yyyy-MM-dd')
      )

      // Map to expected format
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
      setBookingState(prev => ({ ...prev, error: 'Fehler beim Laden der Termine' }))
    } finally {
      setLoading(false)
    }
  }

  // Removed holdSlot function - we now book directly without holding

  const confirmBooking = async () => {
    if (!bookingState.date || !bookingState.time || !bookingState.staff) {
      setBookingState(prev => ({ ...prev, error: 'Bitte wählen Sie Datum, Zeit und Mitarbeiter' }))
      return
    }

    setLoading(true)
    try {
      // Use secure function to create booking directly (no separate hold/confirm)
      // Create date in local timezone, then convert to ISO string with proper offset
      const [hours, minutes] = bookingState.time.split(':')
      const localDate = new Date(bookingState.date)
      localDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)

      // This will create an ISO string with the correct local timezone offset
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

    // Auto-select preferred staff if customer is logged in (only on first service selection)
    if (bookingState.services.length === 0 && customerSession?.preferredStaffId) {
      const preferredStaff = staff.find(s => s.id === customerSession.preferredStaffId)
      if (preferredStaff) {
        setBookingState(prev => ({ ...prev, staff: preferredStaff }))
      }
    }
    // Don't auto-navigate - let user select multiple services
  }

  const handleStaffSelect = (selectedStaff: Staff | null) => {
    setBookingState(prev => ({ ...prev, staff: selectedStaff, error: null }))
    // Don't auto-navigate - let user click "Weiter" button
  }

  const handleDateTimeSelect = async () => {
    if (!bookingState.date || !bookingState.time) {
      setBookingState(prev => ({ ...prev, error: 'Bitte wählen Sie Datum und Uhrzeit' }))
      return
    }

    // No holding needed - move directly to next step
    // Skip customer details if logged in
    if (customerSession) {
      await confirmBooking()
    } else {
      setCurrentStep('details')
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 'service':
        return bookingState.services.length > 0
      case 'staff':
        return true // Staff selection is optional
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

  const stepTitles: Record<BookingStep, string> = {
    service: 'Service wählen',
    staff: 'Mitarbeiter wählen',
    datetime: 'Datum & Uhrzeit',
    details: 'Ihre Daten',
    confirmation: 'Bestätigung'
  }

  // Calculate totals
  const totalDuration = bookingState.services.reduce((sum, s) => sum + s.duration, 0)
  const totalPrice = bookingState.services.reduce((sum, s) => sum + parseFloat(s.price), 0)

  // Progress calculation
  const steps = Object.keys(stepTitles)
  const currentStepIndex = steps.indexOf(currentStep)
  const progress = ((currentStepIndex + 1) / steps.length) * 100

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8">
      {/* Header with Cart */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Termin buchen</h1>
          <p className="text-muted-foreground">
            {stepTitles[currentStep]} - Schritt {currentStepIndex + 1} von {steps.length}
          </p>
        </div>

        {/* Shopping Cart */}
        {bookingState.services.length > 0 && currentStep !== 'confirmation' && (
          <Sheet open={cartOpen} onOpenChange={setCartOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="lg" className="relative group hover:border-gray-400">
                <ShoppingCart className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Warenkorb</span>
                {bookingState.services.length > 0 && (
                  <>
                    <div className="h-5 w-px bg-gray-300 mx-3" />
                    <Badge variant="secondary" className="bg-black text-white px-2">
                      {bookingState.services.length}
                    </Badge>
                    <div className="h-5 w-px bg-gray-300 mx-3" />
                    <span className="font-bold">€{totalPrice.toFixed(2)}</span>
                  </>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-lg">
              <SheetHeader className="pb-6 border-b">
                <SheetTitle className="text-xl">Ihr Warenkorb</SheetTitle>
              </SheetHeader>

              <ScrollArea className="h-[calc(100vh-200px)] mt-6">
                <div className="space-y-3 pr-6">
                  {bookingState.services.length === 0 ? (
                    <div className="text-center py-12">
                      <ShoppingCart className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500">Ihr Warenkorb ist leer</p>
                      <p className="text-sm text-gray-400 mt-2">Wählen Sie Services aus, um fortzufahren</p>
                    </div>
                  ) : (
                    bookingState.services.map((service, index) => (
                      <div
                        key={service.id}
                        className="group bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1 pr-4">
                            <h4 className="font-semibold text-base">{service.name}</h4>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Timer className="h-3.5 w-3.5" />
                                {service.duration} Min
                              </span>
                              <span className="font-semibold text-black">
                                €{service.price}
                              </span>
                            </div>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleServiceSelect(service)}
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              {bookingState.services.length > 0 && (
                <div className="border-t pt-6 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Gesamtdauer</span>
                    <span className="font-medium">{totalDuration} Minuten</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold">
                    <span>Gesamt</span>
                    <span>€{totalPrice.toFixed(2)}</span>
                  </div>
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => {
                      setCartOpen(false)
                      if (currentStep === 'service' && bookingState.services.length > 0) {
                        setCurrentStep('staff')
                      }
                    }}
                  >
                    Weiter zur Mitarbeiter-Auswahl
                  </Button>
                </div>
              )}
            </SheetContent>
          </Sheet>
        )}
      </div>

      {/* Modern Progress Bar - Apple/Stripe Style */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          {/* Background Line */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 -z-10" />

          {/* Progress Line */}
          <div
            className="absolute top-5 left-0 h-0.5 bg-black transition-all duration-500 -z-10"
            style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
          />

          {Object.keys(stepTitles).map((step, index) => {
            const isActive = step === currentStep
            const isPast = Object.keys(stepTitles).indexOf(currentStep) > index
            return (
              <button
                key={step}
                className={cn(
                  "relative flex flex-col items-center gap-2 bg-white px-2",
                  isPast && "cursor-pointer",
                  !isPast && !isActive && "cursor-not-allowed"
                )}
                onClick={() => isPast && setCurrentStep(step as BookingStep)}
                disabled={!isPast && !isActive}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 bg-white",
                    isActive && "border-black scale-110",
                    isPast && "border-black bg-black text-white",
                    !isActive && !isPast && "border-gray-300"
                  )}
                >
                  {isPast ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <span className={cn(
                      "text-sm font-semibold",
                      isActive && "text-black",
                      !isActive && !isPast && "text-gray-400"
                    )}>
                      {index + 1}
                    </span>
                  )}
                </div>
                <span className={cn(
                  "text-xs font-medium absolute -bottom-6 whitespace-nowrap",
                  isActive && "text-black font-semibold",
                  isPast && "text-gray-700",
                  !isActive && !isPast && "text-gray-400"
                )}>
                  {stepTitles[step as BookingStep]}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Error Display */}
      {bookingState.error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{bookingState.error}</AlertDescription>
        </Alert>
      )}

      {/* Customer Session Banner */}
      {customerSession && currentStep !== 'confirmation' && (
        <Alert className="mb-4 bg-blue-50 border-blue-200">
          <UserCheck className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            Eingeloggt als <strong>{customerSession.name}</strong>
          </AlertDescription>
        </Alert>
      )}

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          {/* Service Selection */}
          {currentStep === 'service' && (
            <div className="space-y-6">

              {/* Last Booked Service (for logged in customers) */}
              {lastBookedService && (
                <Alert className="bg-green-50 border-green-200">
                  <Star className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <div className="flex items-center justify-between">
                      <span>Zuletzt gebucht: <strong>{lastBookedService.name}</strong></span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleServiceSelect(lastBookedService)}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Erneut buchen
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Multiple selection hint */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Sie können mehrere Services auswählen. Klicken Sie auf die Karten, um Services hinzuzufügen oder zu entfernen.
                </AlertDescription>
              </Alert>

              {/* Service Categories with grouped services */}
              {(() => {
                // Group services by category - service_categories is an object with name field
                const servicesByCategory = services.reduce((acc, service) => {
                  // Check if service_categories exists and has a name property
                  const categoryName =
                    (typeof service.service_categories === 'object' && service.service_categories?.name) ||
                    service.category ||
                    'Weitere Services'

                  if (!acc[categoryName]) {
                    acc[categoryName] = []
                  }
                  acc[categoryName].push(service)
                  return acc
                }, {} as Record<string, Service[]>)

                return Object.entries(servicesByCategory).map(([category, categoryServices]) => (
                  <div key={category} className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="h-px flex-1 bg-gray-200" />
                      <h3 className="font-medium text-sm text-gray-700 uppercase tracking-wider px-2">
                        {category}
                      </h3>
                      <div className="h-px flex-1 bg-gray-200" />
                    </div>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {categoryServices.map((service) => {
                        const isSelected = bookingState.services.some(s => s.id === service.id)
                        return (
                          <Card
                            key={service.id}
                            className={cn(
                              "cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5",
                              isSelected && "ring-2 ring-black shadow-lg bg-gray-50"
                            )}
                            onClick={() => handleServiceSelect(service)}
                          >
                            <CardContent className="p-5">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-base mb-1">{service.name}</h4>
                                  {service.description_short && (
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                      {service.description_short}
                                    </p>
                                  )}
                                </div>
                                {isSelected && (
                                  <CheckCircle2 className="h-5 w-5 text-black ml-3 flex-shrink-0" />
                                )}
                              </div>
                              <div className="flex items-center justify-between mt-4">
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Timer className="h-4 w-4" />
                                    {service.duration} Min
                                  </span>
                                </div>
                                <div className="font-bold text-lg">
                                  €{service.price}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </div>
                ))
              })()}
            </div>
          )}

          {/* Staff Selection */}
          {currentStep === 'staff' && (
            <div className="space-y-4">
              {staff.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Keine Mitarbeiter verfügbar. Bitte versuchen Sie es später erneut.
                  </AlertDescription>
                </Alert>
              ) : (
                <RadioGroup
                  value={bookingState.staff?.id || 'no-preference'}
                  onValueChange={(value) => {
                    if (value === 'no-preference') {
                      handleStaffSelect(null)
                    } else {
                      const selected = staff.find(s => s.id === value)
                      if (selected) handleStaffSelect(selected)
                    }
                  }}
                >
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card
                      className={cn(
                        "cursor-pointer transition-colors hover:bg-accent",
                        !bookingState.staff && "ring-2 ring-primary"
                      )}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="no-preference" id="no-preference" />
                          <Label htmlFor="no-preference" className="flex-1 cursor-pointer">
                            <div>
                              <p className="font-medium">Keine Präferenz</p>
                              <p className="text-sm text-muted-foreground">
                                Nächster verfügbarer Mitarbeiter
                              </p>
                            </div>
                          </Label>
                        </div>
                      </CardContent>
                    </Card>

                    {staff.map((member) => {
                      const isPreferred = customerSession?.preferredStaffId === member.id
                      return (
                        <Card
                          key={member.id}
                          className={cn(
                            "cursor-pointer transition-colors hover:bg-accent",
                            bookingState.staff?.id === member.id && "ring-2 ring-primary"
                          )}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-3">
                              <RadioGroupItem value={member.id} id={member.id} />
                              <Label htmlFor={member.id} className="flex-1 cursor-pointer">
                                <div>
                                  <p className="font-medium flex items-center">
                                    {member.first_name} {member.last_name}
                                    {isPreferred && (
                                      <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                                        Favorit
                                      </span>
                                    )}
                                  </p>
                                  {member.role && (
                                    <p className="text-sm text-muted-foreground">
                                      {member.role}
                                    </p>
                                  )}
                                </div>
                              </Label>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </RadioGroup>
              )}
            </div>
          )}

          {/* Date & Time Selection */}
          {currentStep === 'datetime' && (
            <div className="space-y-6">
              <div>
                <Label className="text-base font-semibold mb-3 block">Datum wählen</Label>
                <Calendar
                  mode="single"
                  selected={bookingState.date || undefined}
                  onSelect={(date) => setBookingState(prev => ({ ...prev, date, time: null }))}
                  disabled={(date) =>
                    isBefore(date, startOfDay(new Date())) ||
                    isAfter(date, addDays(new Date(), 30))
                  }
                  locale={de}
                  className="rounded-md border"
                />
              </div>

              {bookingState.date && (
                <div>
                  <Label className="text-base font-semibold mb-3 block">Uhrzeit wählen</Label>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Keine freien Termine an diesem Tag verfügbar. Bitte wählen Sie einen anderen Tag.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                      {availableSlots.map((slot) => (
                        <Button
                          key={slot.time}
                          variant={bookingState.time === slot.time ? "default" : "outline"}
                          size="sm"
                          disabled={!slot.available}
                          onClick={() => setBookingState(prev => ({ ...prev, time: slot.time }))}
                        >
                          {slot.time}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Customer Details */}
          {currentStep === 'details' && !customerSession && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={bookingState.customer.name}
                    onChange={(e) => setBookingState(prev => ({
                      ...prev,
                      customer: { ...prev.customer, name: e.target.value }
                    }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">E-Mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={bookingState.customer.email}
                    onChange={(e) => setBookingState(prev => ({
                      ...prev,
                      customer: { ...prev.customer, email: e.target.value }
                    }))}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Telefon (optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={bookingState.customer.phone}
                  onChange={(e) => setBookingState(prev => ({
                    ...prev,
                    customer: { ...prev.customer, phone: e.target.value }
                  }))}
                />
              </div>

              <div>
                <Label htmlFor="notes">Anmerkungen (optional)</Label>
                <Textarea
                  id="notes"
                  value={bookingState.customer.notes}
                  onChange={(e) => setBookingState(prev => ({
                    ...prev,
                    customer: { ...prev.customer, notes: e.target.value }
                  }))}
                  rows={3}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="terms"
                    checked={bookingState.customer.terms_accepted}
                    onCheckedChange={(checked) => setBookingState(prev => ({
                      ...prev,
                      customer: { ...prev.customer, terms_accepted: checked as boolean }
                    }))}
                  />
                  <Label htmlFor="terms" className="text-sm">
                    Ich akzeptiere die <a href="/recht/agb" className="underline">AGB</a> und{' '}
                    <a href="/recht/datenschutz" className="underline">Datenschutzerklärung</a> *
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="marketing"
                    checked={bookingState.customer.marketing_consent}
                    onCheckedChange={(checked) => setBookingState(prev => ({
                      ...prev,
                      customer: { ...prev.customer, marketing_consent: checked as boolean }
                    }))}
                  />
                  <Label htmlFor="marketing" className="text-sm">
                    Ich möchte über Angebote und Neuigkeiten informiert werden
                  </Label>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Bereits Kunde? <a href="/portal/login" className="underline">Hier einloggen</a> für schnellere Buchung
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Confirmation */}
          {currentStep === 'confirmation' && (
            <div className="space-y-6">
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Ihr Termin wurde erfolgreich gebucht!</strong>
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <CardTitle>Terminübersicht</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Scissors className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <span className="font-medium">Services:</span>
                        <div className="ml-2 mt-1 space-y-1">
                          {bookingState.services.map(service => (
                            <div key={service.id} className="text-sm">
                              {service.name} ({service.duration} Min, €{service.price})
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  {bookingState.staff && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Mitarbeiter:</span>
                      <span>{bookingState.staff.first_name} {bookingState.staff.last_name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Datum:</span>
                    <span>{bookingState.date && format(bookingState.date, 'EEEE, dd. MMMM yyyy', { locale: de })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Uhrzeit:</span>
                    <span>{bookingState.time} Uhr</span>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Eine Bestätigungs-E-Mail wurde an <strong>{bookingState.customer.email}</strong> gesendet.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button className="flex-1">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Zu Kalender hinzufügen
                  </Button>
                  {customerSession ? (
                    <Button variant="outline" className="flex-1" asChild>
                      <a href="/portal/termine">
                        Zum Kundenportal
                      </a>
                    </Button>
                  ) : (
                    <Button variant="outline" className="flex-1" asChild>
                      <a href="/portal/login">
                        Konto erstellen
                      </a>
                    </Button>
                  )}
                </div>

                {customerSession && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      // Reset and rebook same service
                      setBookingState(prev => ({
                        ...prev,
                        date: null,
                        time: null,
                        holdId: null,
                        appointmentId: null,
                        error: null
                      }))
                      setCurrentStep('datetime')
                    }}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Gleichen Service erneut buchen
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>

        {/* Navigation */}
        {currentStep !== 'confirmation' && (
          <CardContent className="pt-0 pb-6">
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  const steps: BookingStep[] = ['service', 'staff', 'datetime', 'details', 'confirmation']
                  const currentIndex = steps.indexOf(currentStep)
                  if (currentIndex > 0) {
                    setCurrentStep(steps[currentIndex - 1])
                  }
                }}
                disabled={currentStep === 'service'}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Zurück
              </Button>

              <Button
                onClick={async () => {
                  if (currentStep === 'datetime') {
                    await handleDateTimeSelect()
                  } else if (currentStep === 'details') {
                    await confirmBooking()
                  } else {
                    const steps: BookingStep[] = ['service', 'staff', 'datetime', 'details', 'confirmation']
                    const currentIndex = steps.indexOf(currentStep)
                    if (currentIndex < steps.length - 1) {
                      setCurrentStep(steps[currentIndex + 1])
                    }
                  }
                }}
                disabled={!canProceed() || loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {currentStep === 'details' ? 'Termin buchen' : 'Weiter'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}