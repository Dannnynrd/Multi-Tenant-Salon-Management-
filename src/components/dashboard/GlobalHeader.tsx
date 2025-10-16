'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Menu, Search, Plus, Bell, HelpCircle,
  ChevronDown, Calendar, Users, Scissors,
  UserPlus, Sparkles, LogOut, Settings,
  Keyboard, CreditCard, Clock, User
} from 'lucide-react'
import ProfileSettingsDialog from '@/components/profile-settings-dialog'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuShortcut
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'

interface GlobalHeaderProps {
  tenantId: string
  tenantName: string
  userEmail: string
  subscription?: {
    status: string
    plan: string
    trialEnd?: string
  }
  onMenuClick: () => void
  sidebarOpen: boolean
}

export function GlobalHeader({
  tenantId,
  tenantName,
  userEmail,
  subscription,
  onMenuClick,
  sidebarOpen
}: GlobalHeaderProps) {
  const router = useRouter()
  const [searchOpen, setSearchOpen] = useState(false)
  const [notificationCount] = useState(0)
  const [profileDialogOpen, setProfileDialogOpen] = useState(false)

  // Calculate trial days remaining
  const trialDaysLeft = subscription?.trialEnd
    ? Math.max(0, Math.ceil((new Date(subscription.trialEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0

  // Get plan badge color
  const getPlanColor = () => {
    switch (subscription?.plan) {
      case 'premium': return 'bg-purple-100 text-purple-800'
      case 'professional': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <>
      <header className="h-14 border-b bg-white px-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Logo & Tenant Switcher */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2 py-1.5 h-auto hover:bg-gray-50">
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">
                        {tenantName || 'Mein Salon'}
                      </span>
                      {subscription?.plan === 'premium' && (
                        <Badge className="h-4 px-1.5 text-[10px] bg-purple-100 text-purple-700">PRO</Badge>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-500">Workspace</span>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72" sideOffset={5} style={{ transform: 'translateZ(0)' }}>
                {subscription?.plan === 'premium' ? (
                  <>
                    <DropdownMenuLabel className="pb-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">Deine Salons</span>
                        <Badge className="h-4 px-1.5 text-[10px] bg-purple-100 text-purple-700">Premium</Badge>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="py-1">
                      <DropdownMenuItem className="py-2">
                        <div className="flex-1">
                          <div className="text-sm font-medium">{tenantName}</div>
                          <div className="text-xs text-gray-500">Aktueller Salon</div>
                        </div>
                      </DropdownMenuItem>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-xs text-gray-600" onClick={() => router.push('/dashboard/salon-settings')}>
                      <Settings className="mr-2 h-3 w-3" />
                      Salon-Einstellungen
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-xs text-gray-600">
                      <Plus className="mr-2 h-3 w-3" />
                      Neuen Salon hinzufügen
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuLabel className="pb-2">
                      <span className="text-xs font-medium">Salon-Verwaltung</span>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="py-1">
                      <DropdownMenuItem className="py-2" disabled>
                        <div className="flex-1">
                          <div className="text-sm font-medium">{tenantName}</div>
                          <div className="text-xs text-gray-500">Aktueller Salon</div>
                        </div>
                      </DropdownMenuItem>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-xs text-gray-600" onClick={() => router.push('/dashboard/salon-settings')}>
                      <Settings className="mr-2 h-3 w-3" />
                      Salon-Einstellungen
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-xs"
                      onClick={() => router.push('/dashboard/billing?upgrade=premium')}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center">
                          <Sparkles className="mr-2 h-3 w-3 text-purple-600" />
                          <span>Mehrere Salons verwalten</span>
                        </div>
                        <Badge className="h-4 px-1.5 text-[10px]" variant="secondary">Premium</Badge>
                      </div>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Center - Global Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <Button
            variant="outline"
            className="w-full justify-start text-muted-foreground"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="mr-2 h-4 w-4" />
            <span>Suchen...</span>
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Quick Create */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Neu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push('/dashboard/appointments/new')}>
                <Calendar className="mr-2 h-4 w-4" />
                Neuer Termin
                <DropdownMenuShortcut>N T</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/dashboard/customers/new')}>
                <UserPlus className="mr-2 h-4 w-4" />
                Neuer Kunde
                <DropdownMenuShortcut>N K</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/dashboard/services/new')}>
                <Scissors className="mr-2 h-4 w-4" />
                Neuer Service
                <DropdownMenuShortcut>N S</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/dashboard/staff/new')}>
                <Users className="mr-2 h-4 w-4" />
                Neuer Mitarbeiter
                <DropdownMenuShortcut>N M</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
                {notificationCount}
              </span>
            )}
          </Button>

          {/* Help */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <HelpCircle className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Sparkles className="mr-2 h-4 w-4" />
                Tour starten
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Keyboard className="mr-2 h-4 w-4" />
                Tastenkürzel
                <DropdownMenuShortcut>?</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Dokumentation</DropdownMenuItem>
              <DropdownMenuItem>Support kontaktieren</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Trial Status */}
          {subscription?.status === 'trialing' && trialDaysLeft > 0 && (
            <div className="hidden sm:flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/dashboard/billing')}
                className={cn(
                  "h-8 px-3 text-xs font-medium border",
                  trialDaysLeft <= 3
                    ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                    : trialDaysLeft <= 7
                    ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                    : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                )}
              >
                <Clock className="h-3.5 w-3.5 mr-1.5" />
                {trialDaysLeft === 1
                  ? `Letzter Tag`
                  : trialDaysLeft <= 3
                  ? `Nur noch ${trialDaysLeft} Tage`
                  : `${trialDaysLeft} Tage Testphase`
                }
              </Button>
            </div>
          )}

          <Badge className={cn("hidden sm:flex", getPlanColor())}>
            {subscription?.plan === 'premium' ? 'Premium' :
             subscription?.plan === 'professional' ? 'Professional' : 'Starter'}
          </Badge>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2 py-1.5 h-auto hover:bg-gray-50">
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-medium text-gray-700 leading-none">
                    {userEmail.split('@')[0]}
                  </div>
                  <div className="text-[10px] text-gray-500 leading-none mt-0.5">Account</div>
                </div>
                <Avatar className="h-7 w-7 ring-2 ring-gray-100">
                  <AvatarImage src={`https://avatar.vercel.sh/${userEmail}`} />
                  <AvatarFallback className="text-xs bg-gradient-to-br from-gray-100 to-gray-200">
                    {userEmail?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56" sideOffset={5} style={{ transform: 'translateZ(0)' }}>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-xs font-medium leading-none">{userEmail}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {tenantName}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-xs" onClick={() => setProfileDialogOpen(true)}>
                <User className="mr-2 h-3 w-3" />
                Profil-Einstellungen
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs" onClick={() => router.push('/dashboard/billing')}>
                <CreditCard className="mr-2 h-3 w-3" />
                Abrechnung & Plan
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-xs" onClick={() => router.push('/auth/logout')}>
                <LogOut className="mr-2 h-3 w-3" />
                Abmelden
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Global Search Dialog */}
      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput placeholder="Suche nach Kunden, Terminen, Services..." />
        <CommandList>
          <CommandEmpty>Keine Ergebnisse gefunden.</CommandEmpty>
          <CommandGroup heading="Aktionen">
            <CommandItem onSelect={() => { setSearchOpen(false); router.push('/dashboard/appointments/new') }}>
              <Calendar className="mr-2 h-4 w-4" />
              Neuer Termin
            </CommandItem>
            <CommandItem onSelect={() => { setSearchOpen(false); router.push('/dashboard/customers/new') }}>
              <UserPlus className="mr-2 h-4 w-4" />
              Neuer Kunde
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Navigation">
            <CommandItem onSelect={() => { setSearchOpen(false); router.push('/dashboard') }}>
              Home
            </CommandItem>
            <CommandItem onSelect={() => { setSearchOpen(false); router.push('/dashboard/calendar') }}>
              Kalender
            </CommandItem>
            <CommandItem onSelect={() => { setSearchOpen(false); router.push('/dashboard/customers') }}>
              Kunden
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      {/* Profile Settings Dialog */}
      <ProfileSettingsDialog
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
        mode="sheet"
      />
    </>
  )
}