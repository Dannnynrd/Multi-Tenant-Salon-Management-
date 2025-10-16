'use client'

import { useState } from 'react'
import { CheckCircle2, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { redirectToStripePortal } from './actions'

interface Plan {
  key: string
  name: string
  price: number
  yearlyPrice?: number
  description: string
  features: string[]
  popular?: boolean
}

interface PlanCardsProps {
  plans: Plan[]
  currentPlanKey?: string
  tenantId: string
  hasStripeCustomer: boolean
}

export function PlanCards({ plans, currentPlanKey, tenantId, hasStripeCustomer }: PlanCardsProps) {
  const [expandedPlans, setExpandedPlans] = useState<Record<string, boolean>>({})

  const togglePlan = (planKey: string) => {
    setExpandedPlans(prev => ({
      ...prev,
      [planKey]: !prev[planKey]
    }))
  }

  const currentPlanIndex = plans.findIndex(p => p.key === currentPlanKey)

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {plans.map((plan, index) => {
        const isCurrentPlan = plan.key === currentPlanKey
        const isExpanded = expandedPlans[plan.key]
        const displayedFeatures = isExpanded ? plan.features : plan.features.slice(0, 3)
        const remainingCount = plan.features.length - 3

        return (
          <div
            key={plan.key}
            className={cn(
              "relative p-6 rounded-lg border transition-all",
              "border-gray-200 hover:border-gray-300 hover:shadow-sm",
              plan.popular && !isCurrentPlan && "scale-105 shadow-md"
            )}
          >
            {plan.popular && !isCurrentPlan && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
                Beliebt
              </Badge>
            )}

            {isCurrentPlan && (
              <Badge variant="secondary" className="absolute top-4 right-4 bg-blue-100 text-blue-700 border-0 text-xs">
                Aktueller Plan
              </Badge>
            )}

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
              </div>

              <div>
                <span className="text-2xl font-bold text-gray-900">€{plan.price}</span>
                <span className="text-gray-500">/Monat</span>
                {plan.yearlyPrice && (
                  <p className="text-xs text-gray-500 mt-1">
                    oder €{plan.yearlyPrice}/Jahr
                  </p>
                )}
              </div>

              <div>
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
                    className="h-auto p-0 mt-2 text-xs text-gray-500 hover:text-gray-700"
                    onClick={() => togglePlan(plan.key)}
                  >
                    {isExpanded ? (
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

              {!isCurrentPlan && hasStripeCustomer && (
                <form action={redirectToStripePortal} className="w-full">
                  <input type="hidden" name="tenantId" value={tenantId} />
                  <Button
                    type="submit"
                    variant={plan.popular ? "default" : "outline"}
                    className="w-full gap-2"
                    size="sm"
                  >
                    {currentPlanIndex >= 0 && currentPlanIndex < index
                      ? 'Upgrade'
                      : 'Downgrade'
                    }
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </form>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}