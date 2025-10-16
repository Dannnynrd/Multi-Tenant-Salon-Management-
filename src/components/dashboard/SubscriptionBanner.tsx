'use client'

import { useRouter } from 'next/navigation'
import { AlertTriangle, Clock, CreditCard, Lock, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface SubscriptionBannerProps {
  status?: string
  trialEnd?: string
  plan?: string
}

export function SubscriptionBanner({ status, trialEnd, plan }: SubscriptionBannerProps) {
  const router = useRouter()
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  // Calculate trial days remaining
  const trialDaysLeft = trialEnd
    ? Math.max(0, Math.ceil((new Date(trialEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0

  // Determine banner type and content
  let bannerConfig = {
    type: 'info' as 'warning' | 'error' | 'info',
    icon: Clock,
    title: '',
    message: '',
    cta: 'Plan wählen',
    ctaAction: () => router.push('/dashboard/billing')
  }

  if (!status || !plan) {
    bannerConfig = {
      type: 'error',
      icon: Lock,
      title: 'Kein aktives Abonnement',
      message: 'Wählen Sie einen Plan, um auf alle Funktionen zuzugreifen.',
      cta: 'Plan wählen',
      ctaAction: () => router.push('/dashboard/billing')
    }
  } else if (status === 'past_due') {
    bannerConfig = {
      type: 'error',
      icon: AlertTriangle,
      title: 'Zahlung überfällig',
      message: 'Ihre letzte Zahlung ist fehlgeschlagen. Bitte aktualisieren Sie Ihre Zahlungsmethode.',
      cta: 'Zahlung aktualisieren',
      ctaAction: () => router.push('/dashboard/billing?action=update-payment')
    }
  } else if (status === 'canceled') {
    bannerConfig = {
      type: 'warning',
      icon: AlertTriangle,
      title: 'Abonnement gekündigt',
      message: 'Ihr Abonnement läuft am Ende der aktuellen Periode aus.',
      cta: 'Reaktivieren',
      ctaAction: () => router.push('/dashboard/billing?action=reactivate')
    }
  } else if (status === 'trialing' && trialDaysLeft <= 3) {
    bannerConfig = {
      type: 'warning',
      icon: Clock,
      title: `Testphase endet in ${trialDaysLeft} ${trialDaysLeft === 1 ? 'Tag' : 'Tagen'}`,
      message: 'Wählen Sie einen Plan, um den vollen Zugriff zu behalten.',
      cta: 'Plan wählen',
      ctaAction: () => router.push('/dashboard/billing')
    }
  } else if (status === 'trialing') {
    bannerConfig = {
      type: 'info',
      icon: Clock,
      title: `${trialDaysLeft} Tage Testphase verbleibend`,
      message: 'Erkunden Sie alle Funktionen während Ihrer kostenlosen Testphase.',
      cta: 'Plan anzeigen',
      ctaAction: () => router.push('/dashboard/billing')
    }
  } else {
    return null // No banner needed for active subscriptions
  }

  const bannerStyles = {
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  }

  const Icon = bannerConfig.icon

  return (
    <div className={cn(
      "px-4 py-3 border-b flex items-center justify-between",
      bannerStyles[bannerConfig.type]
    )}>
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 flex-shrink-0" />
        <div className="flex items-center gap-3">
          <span className="font-semibold text-sm">{bannerConfig.title}</span>
          <span className="text-sm opacity-90 hidden sm:block">•</span>
          <span className="text-sm opacity-90 hidden sm:block">{bannerConfig.message}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={bannerConfig.type === 'error' ? 'destructive' : 'default'}
          onClick={bannerConfig.ctaAction}
        >
          <CreditCard className="h-4 w-4 mr-2" />
          {bannerConfig.cta}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => setDismissed(true)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}