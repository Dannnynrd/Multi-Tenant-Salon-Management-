'use client'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CalendarDays, List, Grid3x3 } from 'lucide-react'

interface ViewSwitcherProps {
  value: 'month' | 'week' | 'day'
  onChange: (value: 'month' | 'week' | 'day') => void
  className?: string
}

export function ViewSwitcher({ value, onChange, className }: ViewSwitcherProps) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as 'month' | 'week' | 'day')} className={className}>
      <TabsList className="h-9 bg-gray-100 p-1">
        <TabsTrigger value="day" className="gap-1.5 px-3 data-[state=active]:bg-white">
          <List className="h-3.5 w-3.5" />
          Tag
        </TabsTrigger>
        <TabsTrigger value="week" className="gap-1.5 px-3 data-[state=active]:bg-white">
          <CalendarDays className="h-3.5 w-3.5" />
          Woche
        </TabsTrigger>
        <TabsTrigger value="month" className="gap-1.5 px-3 data-[state=active]:bg-white">
          <Grid3x3 className="h-3.5 w-3.5" />
          Monat
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}