'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'

// Page Header with Breadcrumbs
interface PageHeaderProps {
  title: string
  description?: string
  breadcrumbs?: Array<{ label: string; href?: string }>
  actions?: ReactNode
  tabs?: ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  tabs,
  className
}: PageHeaderProps) {
  return (
    <div className={cn("bg-white border-b", className)}>
      <div className="px-6 py-4">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center">
                {index > 0 && <ChevronRight className="h-4 w-4 mx-2" />}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="hover:text-gray-900 transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-gray-900 font-medium">{crumb.label}</span>
                )}
              </div>
            ))}
          </nav>
        )}

        {/* Title Row */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
            {description && (
              <p className="mt-1 text-sm text-gray-600">{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      {tabs && (
        <div className="px-6 border-t">
          {tabs}
        </div>
      )}
    </div>
  )
}

// Page Container
interface PageContainerProps {
  children: ReactNode
  className?: string
  noPadding?: boolean
}

export function PageContainer({ children, className, noPadding }: PageContainerProps) {
  return (
    <div className={cn(
      "flex-1",
      !noPadding && "p-6",
      className
    )}>
      {children}
    </div>
  )
}

// Empty State Component
interface EmptyStateProps {
  icon?: React.ElementType
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 px-4 text-center",
      className
    )}>
      {Icon && (
        <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
          <Icon className="h-full w-full" />
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-600 max-w-sm mb-4">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// Stats Card Component
interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon?: React.ElementType
  trend?: {
    value: number
    label: string
  }
  className?: string
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className
}: StatsCardProps) {
  return (
    <div className={cn("bg-white rounded-lg border p-6", className)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
          {description && (
            <p className="mt-1 text-sm text-gray-600">{description}</p>
          )}
          {trend && (
            <div className="mt-2 flex items-center text-sm">
              <span className={cn(
                "font-medium",
                trend.value > 0 ? "text-green-600" : "text-red-600"
              )}>
                {trend.value > 0 ? '+' : ''}{trend.value}%
              </span>
              <span className="ml-2 text-gray-600">{trend.label}</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="h-12 w-12 text-gray-400">
            <Icon className="h-full w-full" />
          </div>
        )}
      </div>
    </div>
  )
}

// Section Header for organizing content
interface SectionHeaderProps {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function SectionHeader({
  title,
  description,
  action,
  className
}: SectionHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between mb-4", className)}>
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {description && (
          <p className="text-sm text-gray-600">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

// Content Card Wrapper
interface ContentCardProps {
  children: ReactNode
  className?: string
  noPadding?: boolean
}

export function ContentCard({ children, className, noPadding }: ContentCardProps) {
  return (
    <div className={cn(
      "bg-white rounded-lg border",
      !noPadding && "p-6",
      className
    )}>
      {children}
    </div>
  )
}