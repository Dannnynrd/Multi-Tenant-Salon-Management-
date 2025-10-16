'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TeamMember {
  id: string
  name: string
  email: string
  avatar_url?: string
  color?: string
}

interface TeamFilterProps {
  members: TeamMember[]
  selectedMembers: string[]
  onMemberToggle: (memberId: string) => void
  onSelectAll?: () => void
  onDeselectAll?: () => void
  className?: string
}

export function TeamFilter({
  members,
  selectedMembers,
  onMemberToggle,
  onSelectAll,
  onDeselectAll,
  className
}: TeamFilterProps) {
  const allSelected = members.every(m => selectedMembers.includes(m.id))
  const someSelected = selectedMembers.length > 0 && !allSelected

  return (
    <Card className={cn(
      "p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200",
      className
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Team Filter</h3>
          {selectedMembers.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {selectedMembers.length} ausgewählt
            </Badge>
          )}
        </div>

        <div className="flex gap-1">
          {onSelectAll && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSelectAll}
              className="h-7 px-2 text-xs hover:bg-blue-100"
              disabled={allSelected}
            >
              Alle
            </Button>
          )}
          {onDeselectAll && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDeselectAll}
              className="h-7 px-2 text-xs hover:bg-blue-100"
              disabled={selectedMembers.length === 0}
            >
              Keine
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {members.map((member) => {
          const isSelected = selectedMembers.includes(member.id)
          const memberColor = member.color || 'bg-gray-400'

          return (
            <Button
              key={member.id}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => onMemberToggle(member.id)}
              className={cn(
                "h-9 justify-start gap-2 transition-all",
                isSelected
                  ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                  : "bg-white hover:bg-gray-50 border-gray-200"
              )}
            >
              <div className={cn(
                "w-2 h-2 rounded-full flex-shrink-0",
                memberColor
              )} />
              <span className="truncate">{member.name}</span>
              {isSelected && (
                <Check className="h-3 w-3 ml-auto flex-shrink-0" />
              )}
            </Button>
          )
        })}
      </div>

      {members.length === 0 && (
        <div className="text-center py-4 text-sm text-gray-500">
          Keine Teammitglieder verfügbar
        </div>
      )}
    </Card>
  )
}