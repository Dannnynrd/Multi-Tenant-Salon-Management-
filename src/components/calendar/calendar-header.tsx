'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronLeft, ChevronRight, Search, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface CalendarHeaderProps {
  currentDate: Date
  viewType: 'month' | 'week' | 'day'
  onNavigatePrevious: () => void
  onNavigateNext: () => void
  onNavigateToday: () => void
  onSearchChange?: (value: string) => void
  searchValue?: string
  className?: string
}

export function CalendarHeader({
  currentDate,
  viewType,
  onNavigatePrevious,
  onNavigateNext,
  onNavigateToday,
  onSearchChange,
  searchValue,
  className
}: CalendarHeaderProps) {
  const getTitle = () => {
    switch (viewType) {
      case 'month':
        return format(currentDate, 'MMMM yyyy', { locale: de })
      case 'week':
        return `KW ${format(currentDate, 'w', { locale: de })} - ${format(currentDate, 'yyyy', { locale: de })}`
      case 'day':
        return format(currentDate, 'EEEE, d. MMMM yyyy', { locale: de })
    }
  }

  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={onNavigatePrevious}
          className="h-9 w-9 border-gray-200 hover:bg-gray-50"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          onClick={onNavigateToday}
          className="h-9 px-4 border-gray-200 hover:bg-gray-50 font-medium"
        >
          Heute
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={onNavigateNext}
          className="h-9 w-9 border-gray-200 hover:bg-gray-50"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        <div className="ml-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-gray-500" />
          <h2 className="text-xl font-semibold text-gray-900">
            {getTitle()}
          </h2>
        </div>
      </div>

      {onSearchChange && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="search"
            placeholder="Termine suchen..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-4 h-9 w-64 border-gray-200 focus:border-blue-500"
          />
        </div>
      )}
    </div>
  )
}