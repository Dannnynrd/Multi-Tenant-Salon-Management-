import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ReactNode } from 'react'
import { checkIfAdminOrStaff } from '@/lib/tenant-auth'
import { getCustomerSession } from '@/lib/customer-auth'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  User,
  LogOut,
  LayoutDashboard,
  Calendar,
  Home,
  Menu,
  X,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  Clock,
  Settings,
  UserCircle,
  Shield
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface SiteLayoutProps {
  children: ReactNode
}

async function getTenantData() {
  const headersList = await headers()
  const tenantId = headersList.get('x-tenant-id')
  const tenantSlug = headersList.get('x-tenant-slug')

  if (!tenantId || !tenantSlug) {
    return null
  }

  const supabase = await createClient()

  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single()

  return { ...tenant, tenantId, tenantSlug }
}

async function getUserInfo(tenantId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { isLoggedIn: false, isAdmin: false, isStaff: false, isCustomer: false, user: null }
  }

  const { isAdmin, isStaff } = await checkIfAdminOrStaff(tenantId)
  const customerSession = await getCustomerSession()

  return {
    isLoggedIn: true,
    isAdmin,
    isStaff,
    isCustomer: !!customerSession && !isAdmin && !isStaff,
    user: {
      email: user.email,
      name: customerSession?.name || user.email?.split('@')[0] || 'User'
    }
  }
}

export default async function SiteLayout({ children }: SiteLayoutProps) {
  const tenant = await getTenantData()

  if (!tenant) {
    notFound()
  }

  const userInfo = await getUserInfo(tenant.tenantId)

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header - Apple Style */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Logo/Name */}
            <div className="flex items-center space-x-10">
              <Link
                href={`/${tenant.tenantSlug}`}
                className="text-lg font-semibold text-gray-900 hover:opacity-80 transition-opacity"
              >
                {tenant.name}
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center space-x-1">
                <Link
                  href={`/${tenant.tenantSlug}`}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100/60 transition-all"
                >
                  Start
                </Link>
                <Link
                  href={`/${tenant.tenantSlug}/services`}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100/60 transition-all"
                >
                  Leistungen
                </Link>
                <Link
                  href={`/${tenant.tenantSlug}/team`}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100/60 transition-all"
                >
                  Team
                </Link>
                <Link
                  href={`/${tenant.tenantSlug}/contact`}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100/60 transition-all"
                >
                  Kontakt
                </Link>
              </nav>
            </div>

            {/* Right Side - Auth & CTA */}
            <div className="flex items-center space-x-3">
              {userInfo.isLoggedIn ? (
                <>
                  {/* User Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full transition-all",
                          userInfo.isAdmin && "bg-purple-50 hover:bg-purple-100 text-purple-700",
                          userInfo.isStaff && "bg-blue-50 hover:bg-blue-100 text-blue-700",
                          userInfo.isCustomer && "bg-gray-100 hover:bg-gray-200 text-gray-700"
                        )}
                      >
                        {userInfo.isAdmin ? (
                          <Shield className="h-4 w-4" />
                        ) : userInfo.isStaff ? (
                          <UserCircle className="h-4 w-4" />
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                        <span className="text-sm font-medium">{userInfo.user?.name}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-56 mt-2 bg-white/95 backdrop-blur-xl border-gray-200/50 shadow-xl rounded-xl"
                    >
                      <DropdownMenuLabel className="flex items-center gap-2">
                        {userInfo.isAdmin ? (
                          <>
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                              <Shield className="h-4 w-4 text-purple-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">Administrator</p>
                              <p className="text-xs text-gray-500">{userInfo.user?.email}</p>
                            </div>
                          </>
                        ) : userInfo.isStaff ? (
                          <>
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <UserCircle className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">Mitarbeiter</p>
                              <p className="text-xs text-gray-500">{userInfo.user?.email}</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <User className="h-4 w-4 text-gray-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">Mein Konto</p>
                              <p className="text-xs text-gray-500">{userInfo.user?.email}</p>
                            </div>
                          </>
                        )}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="my-2" />

                      {userInfo.isCustomer && (
                        <>
                          <Link href={`/${tenant.tenantSlug}/portal/dashboard`}>
                            <DropdownMenuItem className="cursor-pointer">
                              <Home className="mr-2 h-4 w-4" />
                              Kundenportal
                            </DropdownMenuItem>
                          </Link>
                          <Link href={`/${tenant.tenantSlug}/portal/termine`}>
                            <DropdownMenuItem className="cursor-pointer">
                              <Calendar className="mr-2 h-4 w-4" />
                              Meine Termine
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuSeparator className="my-2" />
                        </>
                      )}

                      {(userInfo.isAdmin || userInfo.isStaff) && (
                        <>
                          <Link href="/dashboard">
                            <DropdownMenuItem className="cursor-pointer">
                              <LayoutDashboard className="mr-2 h-4 w-4" />
                              Dashboard
                            </DropdownMenuItem>
                          </Link>
                          <Link href="/dashboard/calendar">
                            <DropdownMenuItem className="cursor-pointer">
                              <Calendar className="mr-2 h-4 w-4" />
                              Kalender
                            </DropdownMenuItem>
                          </Link>
                          {userInfo.isAdmin && (
                            <Link href="/dashboard/settings">
                              <DropdownMenuItem className="cursor-pointer">
                                <Settings className="mr-2 h-4 w-4" />
                                Einstellungen
                              </DropdownMenuItem>
                            </Link>
                          )}
                          <DropdownMenuSeparator className="my-2" />
                        </>
                      )}

                      <form action="/api/auth/signout" method="POST">
                        <DropdownMenuItem asChild>
                          <button type="submit" className="w-full text-left cursor-pointer text-red-600 hover:text-red-700">
                            <LogOut className="mr-2 h-4 w-4" />
                            Abmelden
                          </button>
                        </DropdownMenuItem>
                      </form>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Book Appointment Button - different for each user type */}
                  {!userInfo.isAdmin && !userInfo.isStaff && (
                    <Link href={`/${tenant.tenantSlug}/book`}>
                      <Button
                        size="sm"
                        className="bg-black hover:bg-gray-800 text-white rounded-full px-5 py-1.5 text-sm font-medium transition-all"
                      >
                        Termin buchen
                      </Button>
                    </Link>
                  )}

                  {/* Admin/Staff notice on booking */}
                  {(userInfo.isAdmin || userInfo.isStaff) && (
                    <Link href={`/${tenant.tenantSlug}/book`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full px-5 py-1.5 text-sm font-medium border-gray-300/60 hover:bg-gray-100/60 transition-all"
                      >
                        Buchung (Vorschau)
                      </Button>
                    </Link>
                  )}
                </>
              ) : (
                <>
                  {/* Not logged in */}
                  <Link
                    href="/portal/login"
                    className="hidden md:inline-flex px-4 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Anmelden
                  </Link>
                  <Link href={`/${tenant.tenantSlug}/book`}>
                    <Button
                      size="sm"
                      className="bg-black hover:bg-gray-800 text-white rounded-full px-5 py-1.5 text-sm font-medium transition-all"
                    >
                      Termin buchen
                    </Button>
                  </Link>
                </>
              )}

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden rounded-full hover:bg-gray-100/60"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* About */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">{tenant.name}</h3>
              <p className="text-sm text-gray-600">
                Ihr Salon für Schönheit und Wohlbefinden.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Schnellzugriff</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href={`/${tenant.tenantSlug}/services`} className="text-gray-600 hover:text-gray-900">
                    Unsere Leistungen
                  </Link>
                </li>
                <li>
                  <Link href={`/${tenant.tenantSlug}/book`} className="text-gray-600 hover:text-gray-900">
                    Termin buchen
                  </Link>
                </li>
                {!userInfo.isLoggedIn && (
                  <li>
                    <Link href="/portal/login" className="text-gray-600 hover:text-gray-900">
                      Kundenportal
                    </Link>
                  </li>
                )}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Kontakt</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                {tenant.phone && (
                  <li>
                    <a href={`tel:${tenant.phone}`} className="hover:text-gray-900">
                      {tenant.phone}
                    </a>
                  </li>
                )}
                {tenant.email && (
                  <li>
                    <a href={`mailto:${tenant.email}`} className="hover:text-gray-900">
                      {tenant.email}
                    </a>
                  </li>
                )}
                {tenant.address && <li>{tenant.address}</li>}
              </ul>
            </div>

            {/* Hours */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Öffnungszeiten</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                {renderOpeningHours(tenant.opening_hours)}
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-600">
              <p>© {new Date().getFullYear()} {tenant.name}. Alle Rechte vorbehalten.</p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <Link href={`/${tenant.tenantSlug}/legal/imprint`} className="hover:text-gray-900">
                  Impressum
                </Link>
                <Link href={`/${tenant.tenantSlug}/legal/privacy`} className="hover:text-gray-900">
                  Datenschutz
                </Link>
                <Link href={`/${tenant.tenantSlug}/legal/terms`} className="hover:text-gray-900">
                  AGB
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function renderOpeningHours(hours: any) {
  const defaultHours = {
    monday: { open: '09:00', close: '18:00', closed: false },
    tuesday: { open: '09:00', close: '18:00', closed: false },
    wednesday: { open: '09:00', close: '18:00', closed: false },
    thursday: { open: '09:00', close: '18:00', closed: false },
    friday: { open: '09:00', close: '18:00', closed: false },
    saturday: { open: '10:00', close: '14:00', closed: false },
    sunday: { closed: true }
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

  return weekdays.map(({ key, label }) => {
    const dayHours = actualHours[key]
    if (!dayHours || dayHours.closed) {
      return (
        <li key={key}>
          <span className="font-medium">{label}:</span> Geschlossen
        </li>
      )
    }
    return (
      <li key={key}>
        <span className="font-medium">{label}:</span> {dayHours.open} - {dayHours.close}
      </li>
    )
  })
}