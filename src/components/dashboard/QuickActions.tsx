'use client'

import { Button } from '@/components/ui/button'
import { Calendar, Users, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function QuickActionButton({ href, children }: { href: string; children: React.ReactNode }) {
  const router = useRouter()
  return (
    <Button onClick={() => router.push(href)}>
      {children}
    </Button>
  )
}

export function QuickActionOutlineButton({
  href,
  icon: Icon,
  label
}: {
  href: string;
  icon: React.ElementType;
  label: string
}) {
  const router = useRouter()
  return (
    <Button
      variant="outline"
      className="h-20 flex-col gap-2"
      onClick={() => router.push(href)}
    >
      <Icon className="h-5 w-5" />
      <span className="text-xs">{label}</span>
    </Button>
  )
}

export function NewAppointmentButton() {
  const router = useRouter()
  return (
    <Button onClick={() => router.push('/dashboard/appointments/new')}>
      <Plus className="h-4 w-4 mr-2" />
      Neuer Termin
    </Button>
  )
}

export function QuickActionsGrid() {
  const router = useRouter()
  return (
    <div className="grid grid-cols-2 gap-3">
      <QuickActionOutlineButton
        href="/dashboard/appointments/new"
        icon={Calendar}
        label="Neuer Termin"
      />
      <QuickActionOutlineButton
        href="/dashboard/customers/new"
        icon={Users}
        label="Neuer Kunde"
      />
      <QuickActionOutlineButton
        href="/dashboard/calendar"
        icon={Calendar}
        label="Kalender"
      />
      <QuickActionOutlineButton
        href="/dashboard/services"
        icon={Plus}
        label="Service anlegen"
      />
    </div>
  )
}