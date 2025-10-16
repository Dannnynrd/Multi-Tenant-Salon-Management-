'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
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
  ShoppingCart,
  X,
  Timer,
  CreditCard,
  Download,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  ChevronRight
} from 'lucide-react'
import { format, addDays, isBefore, isAfter, startOfDay, addMinutes } from 'date-fns'
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
  bio?: string
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

const STEPS = [
  { key: 'service', label: 'Services', icon: Scissors, color: 'text-purple-600' },
  { key: 'staff', label: 'Mitarbeiter', icon: User, color: 'text-blue-600' },
  { key: 'datetime', label: 'Termin', icon: CalendarIcon, color: 'text-green-600' },
  { key: 'details', label: 'Kontakt', icon: Mail, color: 'text-orange-600' },
  { key: 'confirmation', label: 'Fertig', icon: CheckCircle2, color: 'text-emerald-600' }
]

export default function ImprovedBookingWidget({ tenantId, tenantSlug, customerSession, isPreviewMode = false }: Props) {
  const searchParams = useSearchParams()
  const [currentStep, setCurrentStep] = useState<BookingStep>('service')
  const [services, setServices] = useState<Service[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)

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
    if (bookingState.date) {
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
        // Add mock images and ratings for demo
        const staffWithExtras = result.staff.map(s => ({
          ...s,
          image_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.id}`,
          rating: 4.5 + Math.random() * 0.5,
          bio: 'Erfahrener Stylist mit Fokus auf moderne Schnitte und Farbtechniken.'
        }))
        setStaff(staffWithExtras)
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
        return bookingState.staff !== null
      case 'datetime':
        return bookingState.date !== null && bookingState.time !== null
      case 'details':
        return (
          bookingState.customer.name !== '' &&
          bookingState.customer.email !== '' &&
          bookingState.customer.terms_accepted &&
          (!bookingState.customer.create_account || bookingState.customer.password.length >= 8)
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

  // Calendar export function
  const downloadCalendarEvent = () => {
    if (!bookingState.date || !bookingState.time) return

    const [hours, minutes] = bookingState.time.split(':')
    const startDate = new Date(bookingState.date)
    startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)
    const endDate = addMinutes(startDate, totalDuration)

    const event = {
      title: `Termin: ${bookingState.services.map(s => s.name).join(', ')}`,
      start: format(startDate, "yyyyMMdd'T'HHmmss"),
      end: format(endDate, "yyyyMMdd'T'HHmmss"),
      description: `Mitarbeiter: ${bookingState.staff?.first_name} ${bookingState.staff?.last_name}\\nServices: ${bookingState.services.map(s => s.name).join(', ')}\\nPreis: €${totalPrice.toFixed(2)}`
    }

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Your Salon//NONSGML v1.0//EN
BEGIN:VEVENT
UID:${Date.now()}@yoursalon.com
DTSTAMP:${event.start}
DTSTART:${event.start}
DTEND:${event.end}
SUMMARY:${event.title}
DESCRIPTION:${event.description}
END:VEVENT
END:VCALENDAR`

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'termin.ics'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Modern Header with Progress */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Termin buchen
            </h1>
            <p className="text-muted-foreground">
              Schritt {currentStepIndex + 1} von {STEPS.length}
            </p>
          </div>

          {/* Shopping Cart */}
          {bookingState.services.length > 0 && currentStep !== 'confirmation' && (
            <Sheet open={cartOpen} onOpenChange={setCartOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="relative">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Warenkorb
                  <Badge className="ml-2 bg-primary text-primary-foreground">
                    {bookingState.services.length}
                  </Badge>
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Ihr Warenkorb</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  {bookingState.services.map(service => (
                    <Card key={service.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold">{service.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {service.duration} Minuten
                            </p>
                          </div>
                          <div className="text-right ml-4">
                            <p className="font-semibold">€{service.price}</p>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleServiceToggle(service)}
                              className="mt-1"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Dauer gesamt:</span>
                      <span className="font-medium">{totalDuration} Min</span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Gesamtpreis:</span>
                      <span>€{totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>

        {/* Improved Progress Bar */}
        <div className="relative">
          <Progress value={progress} className="h-3 bg-gray-100" />
          <div className="absolute top-0 w-full flex justify-between mt-6">
            {STEPS.map((step, index) => {
              const Icon = step.icon
              const isActive = index === currentStepIndex
              const isCompleted = index < currentStepIndex
              const StepIcon = step.icon

              return (
                <button
                  key={step.key}
                  onClick={() => isCompleted && setCurrentStep(step.key as BookingStep)}
                  className={cn(
                    "flex flex-col items-center gap-2 transition-all",
                    isCompleted && "cursor-pointer hover:scale-105",
                    !isCompleted && !isActive && "cursor-not-allowed"
                  )}
                  disabled={!isCompleted && !isActive}
                >
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-sm",
                      isActive && "bg-gradient-to-br from-purple-600 to-blue-600 text-white scale-110 shadow-lg",
                      isCompleted && "bg-green-500 text-white hover:shadow-md",
                      !isActive && !isCompleted && "bg-gray-200 text-gray-400"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <StepIcon className="w-6 h-6" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium transition-colors",
                      isActive && "text-primary font-semibold",
                      isCompleted && "text-green-600",
                      !isActive && !isCompleted && "text-gray-400"
                    )}
                  >
                    {step.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mt-20">
        {currentStep === 'service' && (
          <div className="space-y-6">
            {Object.entries(servicesByCategory).map(([category, categoryServices]) => (
              <div key={category}>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <div className="w-8 h-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded" />
                  {category}
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {categoryServices.map((service) => {
                    const isSelected = bookingState.services.find(s => s.id === service.id)
                    return (
                      <Card
                        key={service.id}
                        className={cn(
                          "cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]",
                          isSelected && "ring-2 ring-primary shadow-lg bg-primary/5"
                        )}
                        onClick={() => handleServiceToggle(service)}
                      >
                        <CardContent className="p-5">
                          <div className="flex justify-between items-start mb-3">
                            <h3 className="font-semibold text-lg">{service.name}</h3>
                            {isSelected && (
                              <CheckCircle2 className="w-5 h-5 text-primary animate-in zoom-in" />
                            )}
                          </div>
                          {service.description_short && (
                            <p className="text-sm text-muted-foreground mb-3">
                              {service.description_short}
                            </p>
                          )}
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Timer className="w-4 h-4" />
                              {service.duration} Min
                            </div>
                            <div className="text-xl font-bold text-primary">
                              €{service.price}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {currentStep === 'staff' && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {staff.map((staffMember) => {
              const isSelected = bookingState.staff?.id === staffMember.id
              return (
                <Card
                  key={staffMember.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]",
                    isSelected && "ring-2 ring-primary shadow-lg bg-primary/5"
                  )}
                  onClick={() => setBookingState(prev => ({ ...prev, staff: staffMember }))}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-20 h-20 border-2 border-gray-200">
                        <AvatarImage src={staffMember.image_url} />
                        <AvatarFallback className="text-lg">
                          {staffMember.first_name[0]}{staffMember.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold text-lg">
                            {staffMember.first_name} {staffMember.last_name}
                          </h3>
                          {isSelected && (
                            <CheckCircle2 className="w-5 h-5 text-primary animate-in zoom-in" />
                          )}
                        </div>
                        {staffMember.rating && (
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{staffMember.rating.toFixed(1)}</span>
                          </div>
                        )}
                        {staffMember.bio && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {staffMember.bio}
                          </p>
                        )}
                        {staffMember.specializations && staffMember.specializations.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
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
        )}

        {currentStep === 'datetime' && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Datum wählen</CardTitle>
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
                <CardTitle>Verfügbare Zeiten</CardTitle>
                <CardDescription>
                  {bookingState.date
                    ? format(bookingState.date, 'EEEE, d. MMMM yyyy', { locale: de })
                    : 'Bitte wählen Sie zuerst ein Datum'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!bookingState.date ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Bitte wählen Sie zuerst ein Datum aus dem Kalender
                    </AlertDescription>
                  </Alert>
                ) : loading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="grid grid-cols-3 gap-2">
                      {availableSlots
                        .filter(slot => slot.available)
                        .map((slot) => (
                          <Button
                            key={slot.time}
                            variant={bookingState.time === slot.time ? "default" : "outline"}
                            className={cn(
                              "w-full transition-all",
                              bookingState.time === slot.time && "ring-2 ring-offset-2"
                            )}
                            onClick={() => {
                              setBookingState(prev => ({
                                ...prev,
                                time: slot.time,
                                error: null
                              }))
                            }}
                          >
                            <Clock className="w-4 h-4 mr-2" />
                            {slot.time}
                          </Button>
                        ))}
                    </div>
                    {availableSlots.filter(s => s.available).length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">
                          Keine verfügbaren Termine an diesem Tag
                        </p>
                      </div>
                    )}
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {currentStep === 'details' && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Ihre Kontaktdaten</CardTitle>
              <CardDescription>
                Wir benötigen Ihre Kontaktdaten für die Terminbestätigung
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
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

                <div className="space-y-2">
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
              </div>

              <div className="space-y-2">
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

              <div className="space-y-2">
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

              <Separator className="my-6" />

              {/* Account Creation Option */}
              <Card className="bg-muted/30">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="create-account"
                      checked={bookingState.customer.create_account}
                      onCheckedChange={(checked) => setBookingState(prev => ({
                        ...prev,
                        customer: { ...prev.customer, create_account: checked as boolean }
                      }))}
                    />
                    <div className="flex-1">
                      <Label htmlFor="create-account" className="text-base font-medium cursor-pointer">
                        <UserPlus className="w-4 h-4 inline mr-2" />
                        Kostenloses Konto erstellen
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Verwalten Sie Ihre Termine, speichern Sie Favoriten und erhalten Sie exklusive Angebote
                      </p>
                    </div>
                  </div>

                  {bookingState.customer.create_account && (
                    <div className="mt-4 space-y-2">
                      <Label htmlFor="password">Passwort (min. 8 Zeichen)</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={bookingState.customer.password}
                          onChange={(e) => setBookingState(prev => ({
                            ...prev,
                            customer: { ...prev.customer, password: e.target.value }
                          }))}
                          placeholder="Sicheres Passwort wählen"
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                      {bookingState.customer.password.length > 0 && bookingState.customer.password.length < 8 && (
                        <p className="text-sm text-red-500">Passwort muss mindestens 8 Zeichen lang sein</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Separator className="my-6" />

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="terms"
                    checked={bookingState.customer.terms_accepted}
                    onCheckedChange={(checked) => setBookingState(prev => ({
                      ...prev,
                      customer: { ...prev.customer, terms_accepted: checked as boolean }
                    }))}
                  />
                  <Label htmlFor="terms" className="text-sm font-normal cursor-pointer">
                    Ich akzeptiere die AGB und Datenschutzerklärung *
                  </Label>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="marketing"
                    checked={bookingState.customer.marketing_consent}
                    onCheckedChange={(checked) => setBookingState(prev => ({
                      ...prev,
                      customer: { ...prev.customer, marketing_consent: checked as boolean }
                    }))}
                  />
                  <Label htmlFor="marketing" className="text-sm font-normal cursor-pointer">
                    Ich möchte über Angebote und Neuigkeiten informiert werden
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 'confirmation' && (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-8">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Termin erfolgreich gebucht!</h2>
                <p className="text-muted-foreground">
                  Eine Bestätigungs-E-Mail wurde an {bookingState.customer.email} gesendet.
                </p>
              </div>

              <Card className="bg-muted/30 mb-6">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4 text-lg">Terminübersicht</h3>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Scissors className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium">Services</p>
                        <div className="text-sm text-muted-foreground space-y-1">
                          {bookingState.services.map((service, idx) => (
                            <p key={service.id}>
                              • {service.name} ({service.duration} Min, €{service.price})
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>

                    {bookingState.staff && (
                      <div className="flex items-start gap-3">
                        <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium">Mitarbeiter</p>
                          <p className="text-sm text-muted-foreground">
                            {bookingState.staff.first_name} {bookingState.staff.last_name}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-3">
                      <CalendarIcon className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium">Datum & Zeit</p>
                        <p className="text-sm text-muted-foreground">
                          {bookingState.date && format(bookingState.date, 'EEEE, d. MMMM yyyy', { locale: de })}
                          <br />
                          {bookingState.time} Uhr
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-muted-foreground" />
                        <p className="font-semibold">Gesamtpreis</p>
                      </div>
                      <p className="text-2xl font-bold text-primary">€{totalPrice.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-3 md:grid-cols-2">
                <Button
                  variant="outline"
                  onClick={downloadCalendarEvent}
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Zum Kalender hinzufügen
                </Button>
                {bookingState.customer.create_account && (
                  <Button className="w-full">
                    <Lock className="w-4 h-4 mr-2" />
                    Zum Konto
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Error Display */}
      {bookingState.error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{bookingState.error}</AlertDescription>
        </Alert>
      )}

      {/* Navigation */}
      {currentStep !== 'confirmation' && (
        <Card className="mt-8 bg-muted/30">
          <CardContent className="py-4">
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={() => {
                  const prevStep = STEPS[currentStepIndex - 1]
                  if (prevStep) setCurrentStep(prevStep.key as BookingStep)
                }}
                disabled={currentStepIndex === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Zurück
              </Button>

              <div className="flex items-center gap-4">
                {totalPrice > 0 && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Gesamt: </span>
                    <span className="font-bold text-lg">€{totalPrice.toFixed(2)}</span>
                  </div>
                )}

                <Button
                  onClick={async () => {
                    if (currentStep === 'details') {
                      await confirmBooking()
                    } else {
                      const nextStep = STEPS[currentStepIndex + 1]
                      if (nextStep) setCurrentStep(nextStep.key as BookingStep)
                    }
                  }}
                  disabled={!canProceed() || loading}
                  className="min-w-[120px]"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      {currentStep === 'details' ? 'Termin buchen' : 'Weiter'}
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}