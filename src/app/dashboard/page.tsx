'use client'

import {
  Calendar, Users, Euro, TrendingUp, Clock, CheckCircle2, Plus,
  ArrowUpRight, Activity, BarChart3, UserPlus, CalendarCheck
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'

// Mock data for demonstration
const mockData = {
  todayAppointments: 8,
  activeCustomers: 142,
  todayRevenue: 420,
  monthRevenue: 8420,
  appointments: [
    { id: 1, time: '09:00', customer: 'Maria Schmidt', service: 'Haarschnitt & Föhnen', staff: 'Anna', status: 'confirmed' },
    { id: 2, time: '10:00', customer: 'Thomas Weber', service: 'Herrenhaarschnitt', staff: 'Marco', status: 'confirmed' },
    { id: 3, time: '11:30', customer: 'Julia Fischer', service: 'Färben & Schnitt', staff: 'Anna', status: 'pending' },
    { id: 4, time: '14:00', customer: 'Michael Bauer', service: 'Bart trimmen', staff: 'Marco', status: 'confirmed' },
  ],
  topServices: [
    { name: 'Haarschnitt & Föhnen', bookings: 45, revenue: 2250 },
    { name: 'Färben', bookings: 28, revenue: 2800 },
    { name: 'Herrenhaarschnitt', bookings: 38, revenue: 1140 },
    { name: 'Balayage', bookings: 12, revenue: 1800 },
  ],
  onboardingTasks: [
    { id: 1, label: 'Salon-Profil vervollständigen', href: '/dashboard/salon-settings', done: true },
    { id: 2, label: 'Services anlegen', href: '/dashboard/services', done: true },
    { id: 3, label: 'Mitarbeiter hinzufügen', href: '/dashboard/staff', done: false },
    { id: 4, label: 'Ersten Termin erstellen', href: '/dashboard/appointments/new', done: false },
  ]
}

export default function DashboardPage() {
  const incompleteTasks = mockData.onboardingTasks.filter(task => !task.done)
  const completionRate = Math.round((mockData.onboardingTasks.filter(t => t.done).length / mockData.onboardingTasks.length) * 100)

  // Get current date
  const today = new Date()
  const dateString = today.toLocaleDateString('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  })

  return (
    <div className="min-h-screen bg-white">
      <DashboardHeader
        title="Dashboard"
        subtitle={`Willkommen zurück! Heute ist ${dateString}`}
        action={
          <Link href="/dashboard/appointments/new">
            <Button variant="default" size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Neuer Termin</span>
            </Button>
          </Link>
        }
      />

      <div className="max-w-7xl mx-auto px-8 py-6">
        {/* Onboarding Progress - Clean Card */}
        {incompleteTasks.length > 0 && (
          <Card className="mb-8 border-blue-100 bg-gradient-to-br from-blue-50/50 to-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">Fast geschafft!</CardTitle>
                  <CardDescription>
                    Noch {incompleteTasks.length} {incompleteTasks.length === 1 ? 'Schritt' : 'Schritte'} zur vollständigen Einrichtung
                  </CardDescription>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-blue-600">{completionRate}%</span>
                  <p className="text-xs text-gray-500">Abgeschlossen</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Progress value={completionRate} className="mb-4 h-2" />
              <div className="grid grid-cols-2 gap-2">
                {mockData.onboardingTasks.map((task) => (
                  <Link
                    key={task.id}
                    href={task.href}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border transition-all",
                      task.done
                        ? "bg-gray-50 border-gray-200 opacity-60"
                        : "bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm"
                    )}
                  >
                    {task.done ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                    )}
                    <span className={cn("text-sm", task.done && "line-through text-gray-500")}>
                      {task.label}
                    </span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Key Metrics - Clean Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-gray-100 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Heutige Termine</CardTitle>
              <Calendar className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{mockData.todayAppointments}</div>
              <div className="flex items-center gap-1 mt-1">
                <ArrowUpRight className="h-3 w-3 text-green-600" />
                <span className="text-xs text-green-600 font-medium">+25%</span>
                <span className="text-xs text-gray-500">vs. gestern</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-100 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Aktive Kunden</CardTitle>
              <Users className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{mockData.activeCustomers}</div>
              <div className="flex items-center gap-1 mt-1">
                <ArrowUpRight className="h-3 w-3 text-green-600" />
                <span className="text-xs text-green-600 font-medium">+12</span>
                <span className="text-xs text-gray-500">diesen Monat</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-100 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Umsatz heute</CardTitle>
              <Euro className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">€{mockData.todayRevenue}</div>
              <div className="flex items-center gap-1 mt-1">
                <ArrowUpRight className="h-3 w-3 text-green-600" />
                <span className="text-xs text-green-600 font-medium">+15%</span>
                <span className="text-xs text-gray-500">vs. letzter Mo</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-100 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Monatsumsatz</CardTitle>
              <TrendingUp className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">€{mockData.monthRevenue.toLocaleString('de-DE')}</div>
              <div className="flex items-center gap-1 mt-1">
                <ArrowUpRight className="h-3 w-3 text-green-600" />
                <span className="text-xs text-green-600 font-medium">+22%</span>
                <span className="text-xs text-gray-500">vs. letzter Monat</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Schedule */}
          <Card className="border-gray-100">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">Heutige Termine</CardTitle>
                  <CardDescription>Ihre anstehenden Termine für heute</CardDescription>
                </div>
                <Link href="/dashboard/calendar">
                  <Button variant="ghost" size="sm">
                    Alle anzeigen
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockData.appointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="flex-shrink-0">
                      <div className="text-sm font-semibold text-gray-900">{appointment.time}</div>
                      <div className="text-xs text-gray-500">{appointment.staff}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-gray-900 truncate">
                          {appointment.customer}
                        </span>
                        {appointment.status === 'confirmed' ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-700 border-0">
                            Bestätigt
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-0">
                            Ausstehend
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate">{appointment.service}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Services */}
          <Card className="border-gray-100">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">Top Services</CardTitle>
                  <CardDescription>Meistgebuchte Services diesen Monat</CardDescription>
                </div>
                <Link href="/dashboard/services">
                  <Button variant="ghost" size="sm">
                    Alle Services
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockData.topServices.map((service, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{service.name}</span>
                      <span className="text-sm font-semibold text-gray-900">
                        €{service.revenue.toLocaleString('de-DE')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={(service.bookings / mockData.topServices[0].bookings) * 100}
                        className="flex-1 h-2"
                      />
                      <span className="text-xs text-gray-500 w-12 text-right">
                        {service.bookings}x
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-6 border-gray-100">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Schnellzugriff</CardTitle>
            <CardDescription>Häufig genutzte Aktionen</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Link href="/dashboard/appointments/new">
                <Button variant="outline" className="w-full h-20 flex-col gap-2 hover:bg-blue-50 hover:border-blue-300">
                  <CalendarCheck className="h-5 w-5 text-blue-600" />
                  <span className="text-xs">Neuer Termin</span>
                </Button>
              </Link>
              <Link href="/dashboard/customers/new">
                <Button variant="outline" className="w-full h-20 flex-col gap-2 hover:bg-blue-50 hover:border-blue-300">
                  <UserPlus className="h-5 w-5 text-blue-600" />
                  <span className="text-xs">Neuer Kunde</span>
                </Button>
              </Link>
              <Link href="/dashboard/calendar">
                <Button variant="outline" className="w-full h-20 flex-col gap-2 hover:bg-blue-50 hover:border-blue-300">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <span className="text-xs">Kalender</span>
                </Button>
              </Link>
              <Link href="/dashboard/analytics">
                <Button variant="outline" className="w-full h-20 flex-col gap-2 hover:bg-blue-50 hover:border-blue-300">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <span className="text-xs">Analytics</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}