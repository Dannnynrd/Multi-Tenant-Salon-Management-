'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
  CheckCircle2,
  Eye,
  EyeOff,
  Download,
  UserPlus,
  Sparkles
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
    lastServiceIds?: string[]
  } | null
  isPreviewMode?: boolean
}

export default function ImprovedBookingWidget({ tenantId, tenantSlug, customerSession, isPreviewMode = false }: Props) {
  const searchParams = useSearchParams()

  // State
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
  const [lastBookedServices, setLastBookedServices] = useState<Service[]>([])

  // UI State
  const [cartOpen, setCartOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Load initial data
  useEffect(() => {
    loadServices()
    loadStaff()
  }, [])

  // Load customer's last booking if logged in
  useEffect(() => {
    if (customerSession?.lastServiceIds && services.length > 0) {
      const lastServices = services.filter(s =>
        customerSession.lastServiceIds?.includes(s.id)
      )
      setLastBookedServices(lastServices)
    }
  }, [customerSession, services])

  // Load available slots when date changes
  useEffect(() => {
    if (bookingState.date) {
      loadAvailableSlots()
    }
  }, [bookingState.date, bookingState.staff])

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
          bio: 'Erfahrener Stylist mit Fokus auf moderne Schnitte'
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
        totalDuration || 30
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

  const handleRepeatLastBooking = () => {
    setBookingState(prev => ({
      ...prev,
      services: lastBookedServices,
      error: null
    }))
  }

  const confirmBooking = async () => {
    if (!bookingState.date || !bookingState.time || !bookingState.staff) {
      setBookingState(prev => ({ ...prev, error: 'Bitte wählen Sie alle erforderlichen Felder aus' }))
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
        setBookingState(prev => ({ ...prev, error: result.error || 'Buchung fehlgeschlagen' }))
      }
    } catch (error) {
      setBookingState(prev => ({ ...prev, error: 'Ein Fehler ist aufgetreten' }))
    } finally {
      setLoading(false)
    }
  }

  const downloadCalendarEvent = () => {
    if (!bookingState.date || !bookingState.time) return

    const [hours, minutes] = bookingState.time.split(':')
    const startDate = new Date(bookingState.date)
    startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)

    const totalDuration = bookingState.services.reduce((sum, s) => sum + s.duration, 0)
    const endDate = addMinutes(startDate, totalDuration)

    const event = {
      title: `Termin: ${bookingState.services.map(s => s.name).join(', ')}`,
      start: format(startDate, "yyyyMMdd'T'HHmmss"),
      end: format(endDate, "yyyyMMdd'T'HHmmss"),
      description: `Services: ${bookingState.services.map(s => s.name).join(', ')}\\nMitarbeiter: ${bookingState.staff?.first_name} ${bookingState.staff?.last_name}`
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

  // Group services by category
  const servicesByCategory = services.reduce((acc, service) => {
    const categoryName = service.service_categories?.name || service.category || 'Weitere Services'
    if (!acc[categoryName]) acc[categoryName] = []
    acc[categoryName].push(service)
    return acc
  }, {} as Record<string, Service[]>)

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
              <Button variant="outline" className="relative">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Warenkorb
                <Badge className="ml-2 bg-primary text-primary-foreground">
                  {bookingState.services.length}
                </Badge>
                {totalPrice > 0 && (
                  <span className="ml-2 font-semibold">€{totalPrice.toFixed(2)}</span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Ihr Warenkorb</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                {bookingState.services.map(service => (
                  <Card key={service.id} className="relative">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{service.name}</h4>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Timer className="h-4 w-4" />
                              {service.duration} Min
                            </span>
                            <span className="flex items-center gap-1">
                              <Euro className="h-4 w-4" />
                              {service.price}
                            </span>
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleServiceToggle(service)}
                          className="h-8 w-8"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Dauer gesamt:</span>
                    <span className="font-medium">{totalDuration} Minuten</span>
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
      <div className="mb-8">
        <Progress value={progress} className="h-2 mb-4" />
        <div className="flex justify-between items-center">
          {Object.keys(stepTitles).map((step, index) => {
            const isActive = step === currentStep
            const isPast = Object.keys(stepTitles).indexOf(currentStep) > index
            return (
              <div
                key={step}
                className={cn(
                  "flex flex-col items-center gap-2 transition-all",
                  isPast && "cursor-pointer hover:scale-105"
                )}
                onClick={() => isPast && setCurrentStep(step as BookingStep)}
              >
                <div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                    isActive && "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg scale-110",
                    isPast && "bg-green-500 text-white",
                    !isActive && !isPast && "bg-gray-200 text-gray-600"
                  )}
                >
                  {isPast ? <CheckCircle2 className="h-6 w-6" /> : (
                    step === 'service' ? <Scissors className="h-5 w-5" /> :
                    step === 'staff' ? <User className="h-5 w-5" /> :
                    step === 'datetime' ? <CalendarIcon className="h-5 w-5" /> :
                    step === 'details' ? <Mail className="h-5 w-5" /> :
                    <CheckCircle className="h-5 w-5" />
                  )}
                </div>
                <span className={cn(
                  "text-xs font-medium hidden sm:block",
                  isActive && "text-primary",
                  isPast && "text-green-600",
                  !isActive && !isPast && "text-gray-500"
                )}>
                  {stepTitles[step as BookingStep]}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ERROR CONTINUES IN NEXT MESSAGE... */}
    </div>
  )
}