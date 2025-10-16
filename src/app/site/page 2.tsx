import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Clock,
  MapPin,
  Phone,
  Mail,
  Star,
  Calendar,
  Users,
  Scissors,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Timer,
  Euro,
  Award,
  Heart,
  TrendingUp,
  Zap,
  Palette,
  Smile
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

async function getTenantData() {
  const headersList = await headers()
  const tenantId = headersList.get('x-tenant-id')
  const tenantSlug = headersList.get('x-tenant-slug')

  if (!tenantId || !tenantSlug) {
    return null
  }

  const supabase = await createClient()

  // Get tenant data
  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single()

  // Get services with categories
  const { data: services } = await supabase
    .from('services')
    .select(`
      *,
      service_categories (
        name
      )
    `)
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .limit(6)

  // Get staff
  const { data: staff } = await supabase
    .from('staff')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .eq('can_book_appointments', true)
    .order('display_order', { ascending: true })
    .limit(4)

  // Get customer reviews/stats (mock for now)
  const stats = {
    totalCustomers: 1250,
    avgRating: 4.9,
    totalReviews: 342,
    yearsInBusiness: 8
  }

  return { ...tenant, services, staff, tenantSlug, stats }
}

export default async function SitePage() {
  const tenant = await getTenantData()

  if (!tenant) {
    notFound()
  }

  const activeServices = tenant.services || []
  const activeStaff = tenant.staff || []

  return (
    <div className="overflow-hidden">
      {/* Hero Section - Salon Style with Apple Clean */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Hero Background Image */}
        <div className="absolute inset-0">
          <div className="relative w-full h-full">
            {/* Placeholder Hero Image - Replace with actual salon image */}
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.0.3&w=1920&q=80')`,
              }}
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/40" />
          </div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center min-h-screen py-20">
            {/* Left Content */}
            <div className="space-y-8">
              {/* Elegant Badge */}
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-5 py-2 border border-white/20">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-white/90">Geöffnet • Termine verfügbar</span>
              </div>

              {/* Main Title with Salon Elegance */}
              <div className="space-y-4">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-light text-white leading-tight">
                  Ihr Haar.<br />
                  <span className="font-semibold">Unsere Passion.</span>
                </h1>
                <div className="h-1 w-20 bg-gradient-to-r from-amber-400 to-amber-600" />
              </div>

              {/* Refined Subtitle */}
              <p className="text-lg md:text-xl text-white/80 max-w-lg leading-relaxed">
                Willkommen bei <strong className="text-white">{tenant.name}</strong> – wo erstklassige Handwerkskunst
                auf moderne Styling-Techniken trifft. Verwöhnen Sie sich mit unseren Premium-Services.
              </p>

              {/* Trust Elements */}
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-amber-400 fill-current" />
                    ))}
                  </div>
                  <span className="text-white font-medium">{tenant.stats.avgRating}</span>
                  <span className="text-white/60">({tenant.stats.totalReviews}+ Bewertungen)</span>
                </div>
              </div>

              {/* Premium CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href={`/${tenant.tenantSlug}/book`}>
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-white text-black hover:bg-gray-100 shadow-2xl rounded-full px-8 py-6 text-base font-medium transition-all hover:scale-105"
                  >
                    <Scissors className="mr-2 h-5 w-5" />
                    Termin vereinbaren
                  </Button>
                </Link>
                <Link href={`/${tenant.tenantSlug}/services`}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto border-white/30 text-white hover:bg-white/10 backdrop-blur-sm rounded-full px-8 py-6 text-base font-medium"
                  >
                    <Sparkles className="mr-2 h-5 w-5" />
                    Services & Preise
                  </Button>
                </Link>
              </div>

              {/* Quick Info Bar */}
              <div className="flex flex-wrap gap-6 pt-4">
                <div className="flex items-center gap-2 text-white/80">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{tenant.city || 'Berlin'} Mitte</span>
                </div>
                <div className="flex items-center gap-2 text-white/80">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">{getTodayStatus(tenant.opening_hours)}</span>
                </div>
                <div className="flex items-center gap-2 text-white/80">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm">{tenant.phone || '030 123 456 78'}</span>
                </div>
              </div>
            </div>

            {/* Right Side - Floating Stats Card */}
            <div className="hidden lg:flex justify-end">
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 max-w-sm">
                <h3 className="text-white font-semibold text-lg mb-6">Warum {tenant.name}?</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <Award className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{tenant.stats.yearsInBusiness}+ Jahre Erfahrung</p>
                      <p className="text-white/60 text-sm">Meisterhandwerk seit 2016</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{tenant.stats.totalCustomers}+ Kunden</p>
                      <p className="text-white/60 text-sm">Vertrauen uns bereits</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <Zap className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Premium Produkte</p>
                      <p className="text-white/60 text-sm">Nur hochwertige Marken</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/60 rounded-full mt-2" />
          </div>
        </div>
      </section>

      {/* Salon Features - Elegant Grid */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-3">
              Das macht uns <span className="font-semibold">besonders</span>
            </h2>
            <div className="h-1 w-16 bg-gradient-to-r from-amber-400 to-amber-600 mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Feature 1 */}
            <div className="group">
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 h-full border border-gray-100">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Scissors className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Meisterhandwerk</h3>
                <p className="text-gray-600 leading-relaxed">
                  Unsere Stylisten sind ausgebildete Profis mit Leidenschaft für perfekte Schnitte und Farben.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group">
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 h-full border border-gray-100">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Palette className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Premium Produkte</h3>
                <p className="text-gray-600 leading-relaxed">
                  Wir verwenden ausschließlich hochwertige Produkte von L'Oréal, Kérastase und Olaplex.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group">
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 h-full border border-gray-100">
                <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Smile className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Wohlfühlatmosphäre</h3>
                <p className="text-gray-600 leading-relaxed">
                  Entspannen Sie in unserem stilvollen Ambiente bei einer Tasse Kaffee oder Prosecco.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section - Card Based */}
      {activeServices.length > 0 && (
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-purple-100 text-purple-700 border-0">
                <Scissors className="w-3.5 h-3.5 mr-2" />
                Unsere Services
              </Badge>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Was wir für Sie tun können
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Von klassischen Haarschnitten bis zu modernen Styling-Techniken – wir bieten alles für Ihren perfekten Look
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeServices.map((service, index) => (
                <div
                  key={service.id}
                  className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900 mb-2">
                          {service.name}
                        </h3>
                        {service.description_short && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {service.description_short}
                          </p>
                        )}
                      </div>
                      {index === 0 && (
                        <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                          Beliebt
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Timer className="w-4 h-4" />
                          {service.duration} Min
                        </span>
                      </div>
                      <div className="text-xl font-bold text-gray-900">
                        €{service.price}
                      </div>
                    </div>
                  </div>

                  <Link href={`/${tenant.tenantSlug}/book?service=${service.id}`}>
                    <div className="px-6 py-4 bg-gray-50 group-hover:bg-gray-100 transition-colors">
                      <span className="text-sm font-medium text-gray-700 flex items-center justify-center">
                        Jetzt buchen
                        <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </Link>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link href={`/${tenant.tenantSlug}/services`}>
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full px-8"
                >
                  Alle Services anzeigen
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Team Section - Modern Grid */}
      {activeStaff.length > 0 && (
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-blue-100 text-blue-700 border-0">
                <Users className="w-3.5 h-3.5 mr-2" />
                Unser Team
              </Badge>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Die Experten hinter Ihrem Look
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Lernen Sie unser talentiertes Team kennen – jeder ein Meister seines Fachs
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {activeStaff.map((member) => (
                <div key={member.id} className="group cursor-pointer">
                  <div className="relative mb-4 overflow-hidden rounded-2xl bg-gray-100 aspect-square">
                    {member.photo_url ? (
                      <img
                        src={member.photo_url}
                        alt={`${member.first_name} ${member.last_name}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                        <Users className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900">
                    {member.first_name} {member.last_name}
                  </h3>
                  {member.specializations && member.specializations.length > 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      {member.specializations[0]}
                    </p>
                  )}
                  {member.years_experience && (
                    <p className="text-xs text-gray-400 mt-1">
                      {member.years_experience}+ Jahre Erfahrung
                    </p>
                  )}
                </div>
              ))}
            </div>

            {activeStaff.length > 4 && (
              <div className="text-center mt-12">
                <Link href={`/${tenant.tenantSlug}/team`}>
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-full px-8"
                  >
                    Ganzes Team kennenlernen
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Location & Hours Section */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Location Info */}
            <div>
              <Badge className="mb-4 bg-gray-100 text-gray-700 border-0">
                <MapPin className="w-3.5 h-3.5 mr-2" />
                Standort & Zeiten
              </Badge>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Besuchen Sie uns
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Zentral gelegen und leicht erreichbar. Wir freuen uns auf Ihren Besuch!
              </p>

              <div className="space-y-6">
                {/* Address */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">Adresse</h3>
                    <p className="text-gray-600">
                      {tenant.address || 'Musterstraße 123'}<br />
                      {tenant.postal_code} {tenant.city || 'Berlin'}
                    </p>
                  </div>
                </div>

                {/* Phone */}
                {tenant.phone && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">Telefon</h3>
                      <a href={`tel:${tenant.phone}`} className="text-gray-600 hover:text-gray-900">
                        {tenant.phone}
                      </a>
                    </div>
                  </div>
                )}

                {/* Email */}
                {tenant.email && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">E-Mail</h3>
                      <a href={`mailto:${tenant.email}`} className="text-gray-600 hover:text-gray-900">
                        {tenant.email}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Opening Hours Card */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
              <div className="flex items-center gap-3 mb-6">
                <Clock className="w-6 h-6 text-gray-600" />
                <h3 className="text-xl font-semibold text-gray-900">Öffnungszeiten</h3>
              </div>

              <div className="space-y-3">
                {renderOpeningHours(tenant.opening_hours)}
              </div>

              <div className="mt-8 p-4 bg-green-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-green-700">
                    {getTodayStatus(tenant.opening_hours)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-r from-black to-gray-900">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Bereit für Ihre Verwandlung?
            </h2>
            <p className="text-xl text-gray-300 mb-10">
              Buchen Sie jetzt Ihren Termin und erleben Sie erstklassigen Service
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={`/${tenant.tenantSlug}/book`}>
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-white text-black hover:bg-gray-100 rounded-full px-8 py-6 text-base font-medium"
                >
                  <Calendar className="mr-2 h-5 w-5" />
                  Online Termin buchen
                </Button>
              </Link>
              <a href={`tel:${tenant.phone}`}>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-black rounded-full px-8 py-6 text-base font-medium"
                >
                  <Phone className="mr-2 h-5 w-5" />
                  Anrufen
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function renderOpeningHours(hours: any) {
  const defaultHours = {
    monday: [['09:00', '18:00']],
    tuesday: [['09:00', '18:00']],
    wednesday: [['09:00', '18:00']],
    thursday: [['09:00', '18:00']],
    friday: [['09:00', '18:00']],
    saturday: [['10:00', '14:00']],
    sunday: []
  }

  const weekdays = [
    { key: 'monday', label: 'Montag' },
    { key: 'tuesday', label: 'Dienstag' },
    { key: 'wednesday', label: 'Mittwoch' },
    { key: 'thursday', label: 'Donnerstag' },
    { key: 'friday', label: 'Freitag' },
    { key: 'saturday', label: 'Samstag' },
    { key: 'sunday', label: 'Sonntag' }
  ]

  const actualHours = hours || defaultHours
  const today = weekdays[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1].key

  return weekdays.map(({ key, label }) => {
    const dayHours = actualHours[key]
    const isToday = key === today

    // Check if closed (empty array or no data)
    if (!dayHours || dayHours.length === 0) {
      return (
        <div
          key={key}
          className={cn(
            "flex items-center justify-between py-2",
            isToday && "font-medium"
          )}
        >
          <span className={cn("text-gray-600", isToday && "text-gray-900")}>
            {label}
          </span>
          <span className="text-gray-400">Geschlossen</span>
        </div>
      )
    }

    // Get the first time range
    const [openTime, closeTime] = dayHours[0]

    return (
      <div
        key={key}
        className={cn(
          "flex items-center justify-between py-2",
          isToday && "font-medium"
        )}
      >
        <span className={cn("text-gray-600", isToday && "text-gray-900")}>
          {label}
        </span>
        <span className={cn("text-gray-700 tabular-nums", isToday && "text-gray-900")}>
          {openTime} - {closeTime}
        </span>
      </div>
    )
  })
}

function getTodayStatus(openingHours: any) {
  const now = new Date()
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const today = days[now.getDay()]

  // Parse the new format: array of time ranges [["09:00", "18:00"]]
  const todayHours = openingHours?.[today]

  // Check if closed (empty array or no data)
  if (!todayHours || todayHours.length === 0) {
    return 'Heute geschlossen'
  }

  // Get the first time range
  const [openTime, closeTime] = todayHours[0] || ['09:00', '18:00']

  const currentTime = now.getHours() * 60 + now.getMinutes()
  const [openHour, openMin] = openTime.split(':').map(Number)
  const [closeHour, closeMin] = closeTime.split(':').map(Number)
  const openTimeMinutes = openHour * 60 + openMin
  const closeTimeMinutes = closeHour * 60 + closeMin

  if (currentTime < openTimeMinutes) {
    return `Öffnet heute um ${openTime}`
  } else if (currentTime < closeTimeMinutes) {
    return `Geöffnet bis ${closeTime}`
  } else {
    return 'Heute geschlossen'
  }
}