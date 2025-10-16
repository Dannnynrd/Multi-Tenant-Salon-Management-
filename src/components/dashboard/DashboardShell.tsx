'use client'

import { ReactNode, useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { GlobalHeader } from './GlobalHeader'
import { MainSidebar } from './MainSidebar'
import { SubscriptionBanner } from './SubscriptionBanner'

interface DashboardShellProps {
  children: ReactNode
  tenantId: string
  tenantName: string
  userEmail: string
  subscription?: {
    status: string
    plan: string
    trialEnd?: string
  }
}

export function DashboardShell({
  children,
  tenantId,
  tenantName,
  userEmail,
  subscription
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false) // Mobile starts closed
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
      if (window.innerWidth < 1024) {
        setSidebarOpen(false)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Check subscription status for banner
  const showBanner = subscription?.status === 'past_due' ||
                    subscription?.status === 'trialing' ||
                    subscription?.status === 'canceled' ||
                    !subscription

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Global Header - Always 56px */}
      <GlobalHeader
        tenantId={tenantId}
        tenantName={tenantName}
        userEmail={userEmail}
        subscription={subscription}
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
      />

      {/* Subscription Warning Banner */}
      {showBanner && (
        <SubscriptionBanner
          status={subscription?.status}
          trialEnd={subscription?.trialEnd}
          plan={subscription?.plan}
        />
      )}

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <MainSidebar
          open={sidebarOpen}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
          subscription={subscription}
          isMobile={isMobile}
          onMobileClose={() => setSidebarOpen(false)}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-auto bg-white">
          {children}
        </main>
      </div>
    </div>
  )
}