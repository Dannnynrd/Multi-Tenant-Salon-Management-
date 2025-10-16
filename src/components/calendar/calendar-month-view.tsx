'use client'

import { format, isSameMonth, isSameDay, isToday, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface Appointment {
  id: string
  start_time: string
  end_time: string
  status: string
  customer?: {
    first_name: string
    last_name: string
  }
  staff?: {
    id: string
    name: string
  }
  service?: {
    name: string
  }
}

interface CalendarMonthViewProps {
  days: Date[]
  appointments: Appointment[]
  currentMonth: Date
  onDayClick: (date: Date) => void
  staffColors?: Map<string, string>
  className?: string
}

export function CalendarMonthView({
  days,
  appointments,
  currentMonth,
  onDayClick,
  staffColors = new Map(),
  className
}: CalendarMonthViewProps) {
  const getAppointmentsForDay = (date: Date) => {
    return appointments.filter(apt =>
      isSameDay(parseISO(apt.start_time), date)
    ).sort((a, b) => a.start_time.localeCompare(b.start_time))
  }

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'confirmed':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'cancelled':
        return 'bg-gray-50 text-gray-400 border-gray-200 line-through'
      case 'completed':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      default:
        return 'bg-gray-50 text-gray-600 border-gray-200'
    }
  }

  return (
    <div className={cn("bg-white rounded-lg border border-gray-200 overflow-hidden", className)}>
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
        {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => (
          <div
            key={day}
            className="py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7">
        {days.map((day, idx) => {
          const dayAppointments = getAppointmentsForDay(day)
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const isCurrentDay = isToday(day)

          return (
            <div
              key={`${format(day, 'yyyy-MM-dd')}-${idx}`}
              className={cn(
                "relative min-h-[120px] p-2 border-b border-r border-gray-200",
                "cursor-pointer transition-colors hover:bg-gray-50",
                !isCurrentMonth && "bg-gray-50/50",
                isCurrentDay && "bg-blue-50/50",
                (idx + 1) % 7 === 0 && "border-r-0"
              )}
              onClick={() => onDayClick(day)}
            >
              {/* Day Header */}
              <div className="flex items-start justify-between mb-1">
                <span className={cn(
                  "text-sm font-medium",
                  !isCurrentMonth && "text-gray-400",
                  isCurrentDay && "text-blue-600 font-semibold"
                )}>
                  {format(day, 'd')}
                </span>
                {dayAppointments.length > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                    {dayAppointments.length}
                  </Badge>
                )}
              </div>

              {/* Appointments */}
              <div className="space-y-1">
                {dayAppointments.slice(0, 3).map((apt) => {
                  const staffColor = apt.staff?.id ? staffColors.get(apt.staff.id) : 'bg-gray-400'

                  return (
                    <div
                      key={apt.id}
                      className={cn(
                        "group px-1.5 py-1 rounded text-[11px] border",
                        "truncate transition-opacity hover:opacity-80",
                        getStatusStyle(apt.status)
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-1">
                        {staffColor && (
                          <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", staffColor)} />
                        )}
                        <span className="font-medium">
                          {format(parseISO(apt.start_time), 'HH:mm')}
                        </span>
                        <span className="truncate">
                          {apt.customer?.first_name} {apt.customer?.last_name?.charAt(0)}.
                        </span>
                      </div>
                    </div>
                  )
                })}

                {dayAppointments.length > 3 && (
                  <div className="text-[10px] text-gray-500 px-1">
                    +{dayAppointments.length - 3} weitere
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}