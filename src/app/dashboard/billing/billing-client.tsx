'use client'

import { useState } from 'react'
import { CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Feature {
  feature_key: string
  feature_name: string
  category?: string
}

interface ExpandableFeaturesProps {
  features: Feature[]
  initialCount?: number
  className?: string
}

export function ExpandableFeatures({ features, initialCount = 5, className }: ExpandableFeaturesProps) {
  const [expanded, setExpanded] = useState(false)
  const displayedFeatures = expanded ? features : features.slice(0, initialCount)
  const remainingCount = features.length - initialCount

  if (features.length <= initialCount) {
    return (
      <div className={cn("space-y-2", className)}>
        {features.map((feature) => (
          <div key={feature.feature_key} className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
            <span className="text-gray-700">{feature.feature_name}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={cn("space-y-2", className)}>
      {displayedFeatures.map((feature) => (
        <div key={feature.feature_key} className="flex items-center gap-2 text-sm">
          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
          <span className="text-gray-700">{feature.feature_name}</span>
        </div>
      ))}
      {remainingCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-1 pl-6 text-xs text-gray-500 hover:text-gray-700"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3 w-3 mr-1" />
              Weniger anzeigen
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3 mr-1" />
              +{remainingCount} weitere Features
            </>
          )}
        </Button>
      )}
    </div>
  )
}

interface PlanFeatureListProps {
  features: string[]
  expanded: boolean
  onToggle: () => void
  initialCount?: number
}

export function PlanFeatureList({ features, expanded, onToggle, initialCount = 3 }: PlanFeatureListProps) {
  const displayedFeatures = expanded ? features : features.slice(0, initialCount)
  const remainingCount = features.length - initialCount

  return (
    <div className="space-y-2">
      <ul className="space-y-2 text-sm">
        {displayedFeatures.map((feature, idx) => (
          <li key={idx} className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>
      {remainingCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-0 text-xs text-gray-500 hover:text-gray-700"
          onClick={onToggle}
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3 w-3 mr-1" />
              Weniger anzeigen
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3 mr-1" />
              +{remainingCount} weitere Features
            </>
          )}
        </Button>
      )}
    </div>
  )
}

export function ExpandablePlans({ children }: { children: React.ReactNode }) {
  const [expandedPlans, setExpandedPlans] = useState<Record<string, boolean>>({})

  const togglePlan = (planKey: string) => {
    setExpandedPlans(prev => ({
      ...prev,
      [planKey]: !prev[planKey]
    }))
  }

  return (
    <>
      {children}
    </>
  )
}