import { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface InfoItem {
  label: string
  value: string | number | null | undefined
  icon?: LucideIcon
}

interface InfoCardProps {
  title: string
  items: InfoItem[]
  className?: string
}

export function InfoCard({ title, items, className }: InfoCardProps) {
  return (
    <Card className={cn("p-6", className)}>
      <h3 className="font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="flex items-start gap-3">
            {item.icon && (
              <item.icon className="h-4 w-4 text-gray-400 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 mb-0.5">{item.label}</p>
              <p className="text-sm text-gray-900 font-medium truncate">
                {item.value || '-'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}