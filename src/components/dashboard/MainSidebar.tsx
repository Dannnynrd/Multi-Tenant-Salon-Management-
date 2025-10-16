'use client'

import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Home,
  Calendar,
  Clock,
  Users,
  Scissors,
  UserPlus,
  Wallet,
  CreditCard,
  BarChart,
  FileText,
  Mail,
  Package,
  Settings,
  ChevronLeft,
  ChevronRight,
  Lock
} from 'lucide-react'

interface MainSidebarProps {
  open: boolean
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
  subscription?: {
    status: string
    plan: string
    trialEnd?: string
  }
  className?: string
  isMobile?: boolean
  onMobileClose?: () => void
}

type NavItem = {
  label: string
  href: string
  icon: React.ElementType
  badge?: string | number
  premium?: boolean
  pro?: boolean
}

type NavGroup = {
  label?: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    label: 'Hauptmenü',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: Home },
      { label: 'Kalender', href: '/dashboard/calendar', icon: Calendar },
      { label: 'Kunden', href: '/dashboard/customers', icon: Users },
      { label: 'Services', href: '/dashboard/services', icon: Scissors },
      { label: 'Mitarbeiter', href: '/dashboard/staff', icon: UserPlus },
    ]
  },
  {
    label: 'Geschäft',
    items: [
      { label: 'Abrechnung', href: '/dashboard/billing', icon: Wallet },
      { label: 'Kassensystem', href: '/dashboard/pos', icon: CreditCard, premium: true },
      { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart, pro: true },
      { label: 'Berichte', href: '/dashboard/reports', icon: FileText, pro: true },
    ]
  },
  {
    label: 'Verwaltung',
    items: [
      { label: 'Marketing', href: '/dashboard/marketing', icon: Mail, pro: true },
      { label: 'Inventar', href: '/dashboard/inventory', icon: Package, premium: true },
      { label: 'Einstellungen', href: '/dashboard/salon-settings', icon: Settings },
    ]
  }
]

export function MainSidebar({
  open,
  collapsed,
  onCollapsedChange,
  subscription,
  className,
  isMobile = false,
  onMobileClose
}: MainSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const userPlan = subscription?.plan || 'starter'
  const isPro = userPlan === 'professional' || userPlan === 'premium'
  const isPremium = userPlan === 'premium'

  const canAccess = (item: NavItem) => {
    if (item.premium) return isPremium
    if (item.pro) return isPro
    return true
  }

  const handleItemClick = (item: NavItem) => {
    if (!canAccess(item)) {
      const plan = item.premium ? 'premium' : 'professional'
      router.push(`/dashboard/billing?upgrade=${plan}`)
      return
    }

    router.push(item.href)
    if (isMobile && onMobileClose) {
      onMobileClose()
    }
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white">
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {navGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1">
              {group.label && (
                <div className={cn(
                  "px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider",
                  collapsed && !isMobile && "text-center"
                )}>
                  {collapsed && !isMobile ? "•" : group.label}
                </div>
              )}

              {group.items.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                const locked = !canAccess(item)

                return (
                  <button
                    key={item.href}
                    onClick={() => handleItemClick(item)}
                    style={{ cursor: locked ? 'not-allowed' : 'pointer' }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 text-xs rounded-md transition-colors",
                      active
                        ? "text-blue-600"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
                      locked && "opacity-50",
                      collapsed && !isMobile && "justify-center px-2"
                    )}
                  >
                    <Icon className={cn(
                      "h-4 w-4 flex-shrink-0",
                      active && "text-blue-600"
                    )} />

                    {(!collapsed || isMobile) && (
                      <>
                        <span className="flex-1 text-left">
                          {item.label}
                        </span>

                        {item.badge && (
                          <span className="px-1.5 py-0.5 text-xs bg-red-500 text-white rounded">
                            {item.badge}
                          </span>
                        )}

                        {locked && (
                          <Lock className="h-3 w-3" />
                        )}
                      </>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Collapse Toggle - Desktop only */}
      {!isMobile && (
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => onCollapsedChange(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            style={{ cursor: 'pointer' }}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span>Minimieren</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )

  // Mobile Drawer
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onMobileClose}>
        <SheetContent side="left" className="p-0 w-80">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Menu</h2>
          </div>
          <SidebarContent />
        </SheetContent>
      </Sheet>
    )
  }

  // Desktop Sidebar
  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col border-r border-gray-200 transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      <SidebarContent />
    </aside>
  )
}