'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  Scissors,
  CheckCircle,
  CheckCircle2,
  Mail,
  Phone,
  AlertCircle,
  Loader2,
  Star,
  Euro,
  Sparkles,
  MapPin,
  X,
  ChevronDown,
  UserCircle,
  Timer,
  CreditCard
} from 'lucide-react'
import { format, addDays, isBefore, isAfter, startOfDay, addMinutes, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { getPublicServices, getPublicStaff, getPublicAvailableSlots, createPublicBooking } from '@/lib/api/public-tenant'

type BookingStep = 'service' | 'staff' | 'datetime' | 'details' | 'confirmation'

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
  image_url?: string
  rating?: number
  reviews_count?: number
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

const STEPS: { key: BookingStep; label: string; icon: any }[] = [
  { key: 'service', label: 'Service', icon: Scissors },
  { key: 'staff', label: 'Mitarbeiter', icon: User },
  { key: 'datetime', label: 'Termin', icon: CalendarIcon },
  { key: 'details', label: 'Details', icon: UserCircle },
  { key: 'confirmation', label: 'Bestätigung', icon: CheckCircle2 }
]

export default function ModernBookingWidget({ tenantId, tenantSlug, customerSession, isPreviewMode = false }: Props) {
  const searchParams = useSearchParams()
  const [currentStep, setCurrentStep] = useState<BookingStep>('service')
  const [services, setServices] = useState<Service[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(false)
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

  // Load services on mount
  useEffect(() => {
    loadServices()
  }, [])

  // Load staff when services selected
  useEffect(() => {
    if (bookingState.services.length > 0) {
      loadStaff()
    }
  }, [bookingState.services])

  // Load available slots when staff and date selected
  useEffect(() => {
    if (bookingState.staff && bookingState.date) {
      loadAvailableSlots()
    }
  }, [bookingState.staff, bookingState.date])

  const loadServices = async () => {
    setLoading(true)
    try {
      const result = await getPublicServices(tenantSlug)
      if (result.success && result.services) {
        setServices(result.services)
      }
    } catch (error) {
      console.error('Error loading services:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStaff = async () => {
    setLoading(true)
    try {
      const result = await getPublicStaff(tenantSlug)
      if (result.success && result.staff) {
        // Add mock ratings for demo
        const staffWithRatings = result.staff.map(s => ({
          ...s,
          rating: 4.5 + Math.random() * 0.5,
          reviews_count: Math.floor(Math.random() * 50) + 10,
          image_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.id}`
        }))
        setStaff(staffWithRatings)
      }
    } catch (error) {
      console.error('Error loading staff:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableSlots = async () => {
    if (!bookingState.date) return

    setLoading(true)
    try {
      const totalDuration = bookingState.services.reduce((sum, s) => sum + s.duration, 0)
      const result = await getPublicAvailableSlots(
        tenantSlug,
        format(bookingState.date, 'yyyy-MM-dd'),
        bookingState.staff?.id || undefined,
        totalDuration
      )

      if (result.success && result.slots) {
        setAvailableSlots(result.slots)
      }
    } catch (error) {
      console.error('Error loading slots:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleServiceToggle = (service: Service) => {
    setBookingState(prev => ({
      ...prev,
      services: prev.services.find(s => s.id === service.id)
        ? prev.services.filter(s => s.id !== service.id)
        : [...prev.services, service],
      error: null
    }))
  }

  const handleStaffSelect = (staffMember: Staff | null) => {
    setBookingState(prev => ({
      ...prev,
      staff: staffMember,
      date: null,
      time: null,
      error: null
    }))
  }

  const confirmBooking = async () => {
    if (!bookingState.date || !bookingState.time || !bookingState.staff) {
      setBookingState(prev => ({ ...prev, error: 'Bitte wählen Sie Datum, Zeit und Mitarbeiter' }))
      return
    }

    setLoading(true)
    try {
      // Create date in local timezone
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
        setBookingState(prev => ({ ...prev, error: result.error || 'Buchung fehlgeschlagen' }))
      }
    } catch (error) {
      setBookingState(prev => ({ ...prev, error: 'Ein Fehler ist aufgetreten' }))
    } finally {
      setLoading(false)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 'service':
        return bookingState.services.length > 0
      case 'staff':
        return true // Staff selection is optional (can choose "any")
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

  const getStepIndex = (step: BookingStep) => STEPS.findIndex(s => s.key === step)
  const currentStepIndex = getStepIndex(currentStep)
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100

  // Calculate totals
  const totalDuration = bookingState.services.reduce((sum, s) => sum + s.duration, 0)
  const totalPrice = bookingState.services.reduce((sum, s) => sum + parseFloat(s.price), 0)

  // Group services by category
  const servicesByCategory = services.reduce((acc, service) => {
    const categoryName = service.service_categories?.name || service.category || 'Weitere Services'
    if (!acc[categoryName]) acc[categoryName] = []
    acc[categoryName].push(service)
    return acc
  }, {} as Record<string, Service[]>)

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Modern Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Termin buchen</h1>
        <p className="text-muted-foreground">Wählen Sie Ihre gewünschten Services und einen passenden Termin</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <Progress value={progress} className="h-2 mb-4" />
        <div className="flex justify-between">
          {STEPS.map((step, index) => {
            const Icon = step.icon
            const isActive = index === currentStepIndex
            const isCompleted = index < currentStepIndex

            return (
              <div
                key={step.key}
                className={cn(
                  "flex flex-col items-center gap-2 cursor-pointer transition-all",
                  isActive && "scale-105",
                  !isActive && !isCompleted && "opacity-50"
                )}
                onClick={() => {
                  if (isCompleted) setCurrentStep(step.key)
                }}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                    isActive && "bg-primary text-primary-foreground",
                    isCompleted && "bg-green-500 text-white",
                    !isActive && !isCompleted && "bg-muted"
                  )}
                >
                  {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className={cn(
                  "text-xs font-medium hidden sm:block",
                  isActive && "text-primary",
                  isCompleted && "text-green-600"
                )}>
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {currentStep === 'service' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scissors className="w-5 h-5" />
                  Services auswählen
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Selected Services Summary */}
                {bookingState.services.length > 0 && (
                  <div className="mb-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-sm">Ausgewählte Services</h3>
                      <Badge variant="secondary">{bookingState.services.length} ausgewählt</Badge>
                    </div>
                    <div className="space-y-2">
                      {bookingState.services.map(service => (
                        <div key={service.id} className="flex items-center justify-between">
                          <span className="text-sm">{service.name}</span>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-muted-foreground">
                              <Timer className="w-3 h-3 inline mr-1" />
                              {service.duration} Min
                            </span>
                            <span className="text-sm font-medium">€{service.price}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleServiceToggle(service)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Separator className="my-2" />
                      <div className="flex justify-between font-semibold">
                        <span>Gesamt</span>
                        <div className="flex items-center gap-4">
                          <span>{totalDuration} Min</span>
                          <span>€{totalPrice.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Service Categories */}
                {Object.entries(servicesByCategory).map(([category, categoryServices]) => (
                  <div key={category} className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">{category}</h3>
                    <div className="grid gap-3 md:grid-cols-2">
                      {categoryServices.map((service) => {
                        const isSelected = bookingState.services.find(s => s.id === service.id)
                        return (
                          <Card
                            key={service.id}
                            className={cn(
                              "cursor-pointer transition-all hover:shadow-md",
                              isSelected && "ring-2 ring-primary bg-primary/5"
                            )}
                            onClick={() => handleServiceToggle(service)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-semibold flex items-center gap-2">
                                    {service.name}
                                    {isSelected && <CheckCircle2 className="w-4 h-4 text-primary" />}
                                  </h4>
                                  {service.description_short && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {service.description_short}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right ml-4">
                                  <p className="font-semibold text-lg">€{service.price}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {service.duration} Min
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {currentStep === 'staff' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Mitarbeiter wählen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Button
                    variant={!bookingState.staff ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => handleStaffSelect(null)}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Keine Präferenz - nächsten verfügbaren Mitarbeiter
                  </Button>
                </div>

                <Separator className="my-6" />

                <div className="grid gap-4 md:grid-cols-2">
                  {staff.map((staffMember) => {
                    const isSelected = bookingState.staff?.id === staffMember.id
                    return (
                      <Card
                        key={staffMember.id}
                        className={cn(
                          "cursor-pointer transition-all hover:shadow-md",
                          isSelected && "ring-2 ring-primary bg-primary/5"
                        )}
                        onClick={() => handleStaffSelect(staffMember)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <Avatar className="w-16 h-16">
                              <AvatarImage src={staffMember.image_url} />
                              <AvatarFallback>
                                {staffMember.first_name[0]}{staffMember.last_name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h4 className="font-semibold flex items-center gap-2">
                                {staffMember.first_name} {staffMember.last_name}
                                {isSelected && <CheckCircle2 className="w-4 h-4 text-primary" />}
                              </h4>
                              {staffMember.rating && (
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="flex items-center">
                                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                    <span className="text-sm ml-1">{staffMember.rating.toFixed(1)}</span>
                                  </div>
                                  <span className="text-sm text-muted-foreground">
                                    ({staffMember.reviews_count} Bewertungen)
                                  </span>
                                </div>
                              )}
                              {staffMember.specializations && staffMember.specializations.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {staffMember.specializations.slice(0, 3).map(spec => (
                                    <Badge key={spec} variant="secondary" className="text-xs">
                                      {spec}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 'datetime' && (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5" />
                    Datum wählen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={bookingState.date || undefined}
                    onSelect={(date) => {
                      setBookingState(prev => ({
                        ...prev,
                        date,
                        time: null,
                        error: null
                      }))
                    }}
                    disabled={(date) =>
                      isBefore(date, startOfDay(new Date())) ||
                      isAfter(date, addDays(new Date(), 60))
                    }
                    locale={de}
                    className="rounded-md border"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Zeit wählen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!bookingState.date ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Bitte wählen Sie zuerst ein Datum
                      </AlertDescription>
                    </Alert>
                  ) : loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Keine verfügbaren Termine an diesem Tag
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="grid grid-cols-3 gap-2">
                        {availableSlots
                          .filter(slot => slot.available)
                          .map((slot) => (
                            <Button
                              key={slot.time}
                              variant={bookingState.time === slot.time ? "default" : "outline"}
                              className="w-full"
                              onClick={() => {
                                setBookingState(prev => ({
                                  ...prev,
                                  time: slot.time,
                                  error: null
                                }))
                              }}
                            >
                              {slot.time}
                            </Button>
                          ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {currentStep === 'details' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCircle className="w-5 h-5" />
                  Ihre Kontaktdaten
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={bookingState.customer.name}
                      onChange={(e) => setBookingState(prev => ({
                        ...prev,
                        customer: { ...prev.customer, name: e.target.value }
                      }))}
                      placeholder="Max Mustermann"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="email">E-Mail *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={bookingState.customer.email}
                      onChange={(e) => setBookingState(prev => ({
                        ...prev,
                        customer: { ...prev.customer, email: e.target.value }
                      }))}
                      placeholder="max@beispiel.de"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="phone">Telefon</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={bookingState.customer.phone}
                      onChange={(e) => setBookingState(prev => ({
                        ...prev,
                        customer: { ...prev.customer, phone: e.target.value }
                      }))}
                      placeholder="+49 123 456789"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="notes">Anmerkungen</Label>
                    <Textarea
                      id="notes"
                      value={bookingState.customer.notes}
                      onChange={(e) => setBookingState(prev => ({
                        ...prev,
                        customer: { ...prev.customer, notes: e.target.value }
                      }))}
                      placeholder="Besondere Wünsche oder Anmerkungen..."
                      rows={3}
                    />
                  </div>

                  <Separator className="my-2" />

                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <Checkbox
                        id="terms"
                        checked={bookingState.customer.terms_accepted}
                        onCheckedChange={(checked) => setBookingState(prev => ({
                          ...prev,
                          customer: { ...prev.customer, terms_accepted: checked as boolean }
                        }))}
                      />
                      <Label htmlFor="terms" className="text-sm font-normal">
                        Ich akzeptiere die AGB und Datenschutzerklärung *
                      </Label>
                    </div>

                    <div className="flex items-start gap-2">
                      <Checkbox
                        id="marketing"
                        checked={bookingState.customer.marketing_consent}
                        onCheckedChange={(checked) => setBookingState(prev => ({
                          ...prev,
                          customer: { ...prev.customer, marketing_consent: checked as boolean }
                        }))}
                      />
                      <Label htmlFor="marketing" className="text-sm font-normal">
                        Ich möchte über Angebote und Neuigkeiten informiert werden
                      </Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 'confirmation' && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center mb-6">
                  <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">Termin erfolgreich gebucht!</h2>
                  <p className="text-muted-foreground">
                    Eine Bestätigungs-E-Mail wurde an {bookingState.customer.email} gesendet.
                  </p>
                </div>

                <Card className="bg-muted/50">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-4">Terminübersicht</h3>

                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Scissors className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Services</p>
                          {bookingState.services.map((service, idx) => (
                            <p key={service.id} className="text-sm text-muted-foreground">
                              {idx + 1}. {service.name} ({service.duration} Min, €{service.price})
                            </p>
                          ))}
                        </div>
                      </div>

                      {bookingState.staff && (
                        <div className="flex items-start gap-3">
                          <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">Mitarbeiter</p>
                            <p className="text-sm text-muted-foreground">
                              {bookingState.staff.first_name} {bookingState.staff.last_name}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-start gap-3">
                        <CalendarIcon className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Datum</p>
                          <p className="text-sm text-muted-foreground">
                            {bookingState.date && format(bookingState.date, 'EEEE, d. MMMM yyyy', { locale: de })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Uhrzeit</p>
                          <p className="text-sm text-muted-foreground">
                            {bookingState.time} Uhr
                          </p>
                        </div>
                      </div>

                      <Separator className="my-3" />

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-5 h-5 text-muted-foreground" />
                          <p className="font-semibold">Gesamtpreis</p>
                        </div>
                        <p className="text-xl font-bold">€{totalPrice.toFixed(2)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-3 mt-6">
                  <Button variant="outline" className="flex-1">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    Zu Kalender hinzufügen
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <User className="w-4 h-4 mr-2" />
                    Konto erstellen
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Error Display */}
      {bookingState.error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{bookingState.error}</AlertDescription>
        </Alert>
      )}

      {/* Navigation Buttons */}
      {currentStep !== 'confirmation' && (
        <Card className="mt-6">
          <CardContent className="py-4">
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  const prevStep = STEPS[currentStepIndex - 1]
                  if (prevStep) setCurrentStep(prevStep.key)
                }}
                disabled={currentStepIndex === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Zurück
              </Button>

              <div className="flex items-center gap-4">
                {(currentStep === 'service' || currentStep === 'datetime') && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Gesamt: </span>
                    <span className="font-semibold">{totalDuration} Min</span>
                    <span className="mx-2">•</span>
                    <span className="font-semibold">€{totalPrice.toFixed(2)}</span>
                  </div>
                )}

                <Button
                  onClick={async () => {
                    if (currentStep === 'details') {
                      await confirmBooking()
                    } else {
                      const nextStep = STEPS[currentStepIndex + 1]
                      if (nextStep) setCurrentStep(nextStep.key)
                    }
                  }}
                  disabled={!canProceed() || loading}
                >
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {currentStep === 'details' ? 'Termin buchen' : 'Weiter'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}