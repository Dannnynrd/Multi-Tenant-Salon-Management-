'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit2, Trash2, Mail, Phone, User, Calendar, AlertTriangle, Sparkles } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import StaffFormModal from './staff-form-modal'
import { cn } from '@/lib/utils'

interface Staff {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  role: string
  color: string
  is_active: boolean
  can_book_appointments: boolean
  tenant_id: string
  created_at: string
  user_id?: string | null
}

interface StaffManagerProps {
  initialStaff: Staff[]
  tenantId: string
}

function StaffCard({ staff, onEdit, onDelete }: {
  staff: Staff
  onEdit: (staff: Staff) => void
  onDelete: (id: string) => void
}) {
  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold"
            style={{ backgroundColor: staff.color }}
          >
            {staff.first_name[0]}{staff.last_name[0]}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {staff.first_name} {staff.last_name}
            </h3>
            <p className="text-sm text-gray-500 capitalize">{staff.role}</p>
          </div>
        </div>
        <Badge variant={staff.is_active ? 'default' : 'secondary'}>
          {staff.is_active ? 'Aktiv' : 'Inaktiv'}
        </Badge>
      </div>

      <div className="space-y-2 mb-4">
        {staff.email && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="h-4 w-4" />
            <span>{staff.email}</span>
          </div>
        )}
        {staff.phone && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="h-4 w-4" />
            <span>{staff.phone}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          <span>
            {staff.can_book_appointments
              ? 'Kann Termine annehmen'
              : 'Keine Terminbuchung'}
          </span>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          onClick={() => onEdit(staff)}
          variant="ghost"
          size="sm"
        >
          <Edit2 className="h-4 w-4 mr-1" />
          Bearbeiten
        </Button>
        <Button
          onClick={() => onDelete(staff.id)}
          variant="ghost"
          size="sm"
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Löschen
        </Button>
      </div>
    </Card>
  )
}

export default function StaffManager({
  initialStaff,
  tenantId
}: StaffManagerProps) {
  const [staff, setStaff] = useState(initialStaff)
  const [showStaffModal, setShowStaffModal] = useState(false)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [staffLimit, setStaffLimit] = useState<number | null>(null)
  const [planName, setPlanName] = useState<string>('Starter')
  const router = useRouter()
  const supabase = createSupabaseClient()

  // Get current user, check if owner, and get subscription info
  useEffect(() => {
    async function checkUserStatus() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)

        // Check if user is owner
        const { data: membership } = await supabase
          .from('tenant_members')
          .select('role')
          .eq('tenant_id', tenantId)
          .eq('user_id', user.id)
          .single()

        if (membership?.role === 'admin' || membership?.role === 'OWNER') {
          setIsOwner(true)
        }
      }

      // Get subscription info for staff limits
      const { data: subscription } = await supabase
        .from('active_subscriptions')
        .select('tier_name, max_staff, quantity')
        .eq('tenant_id', tenantId)
        .eq('has_access', true)
        .single()

      if (subscription) {
        // Calculate effective limit
        const effectiveLimit = (subscription.quantity || 1) * subscription.max_staff
        setStaffLimit(effectiveLimit)
        setPlanName(subscription.tier_name || 'Starter')
      } else {
        // Default to starter limits if no subscription found
        setStaffLimit(2)
        setPlanName('Starter')
      }
    }
    checkUserStatus()
  }, [supabase, tenantId])

  const handleDelete = async (id: string) => {
    if (!confirm('Sind Sie sicher, dass Sie diesen Mitarbeiter löschen möchten?')) {
      return
    }

    const { error } = await supabase
      .from('staff')
      .delete()
      .eq('id', id)

    if (!error) {
      setStaff(staff.filter(s => s.id !== id))
    } else {
      console.error('Error deleting staff:', error)
    }
  }

  const handleEdit = (staffMember: Staff) => {
    setEditingStaff(staffMember)
    setShowStaffModal(true)
  }

  const handleStaffSaved = async () => {
    setShowStaffModal(false)
    setEditingStaff(null)

    // Refresh staff data
    const { data: freshStaff } = await supabase
      .from('staff')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (freshStaff) {
      setStaff(freshStaff)
    }

    router.refresh()
  }

  const activeStaff = staff.filter(s => s.is_active)
  const inactiveStaff = staff.filter(s => !s.is_active)

  // Check if at or near limit
  const isAtLimit = staffLimit !== null && staffLimit !== -1 && activeStaff.length >= staffLimit
  const isNearLimit = staffLimit !== null && staffLimit !== -1 && activeStaff.length >= (staffLimit - 1)

  return (
    <>
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              {activeStaff.length} Aktiv
            </Badge>
            <Badge variant="outline" className="text-sm">
              {inactiveStaff.length} Inaktiv
            </Badge>
            {staffLimit !== null && staffLimit !== -1 && (
              <Badge
                variant={isAtLimit ? "destructive" : isNearLimit ? "secondary" : "outline"}
                className={cn(
                  "text-sm",
                  isAtLimit && "bg-red-100 text-red-700 border-red-200",
                  isNearLimit && !isAtLimit && "bg-amber-100 text-amber-700 border-amber-200"
                )}
              >
                {isAtLimit && <AlertTriangle className="h-3 w-3 mr-1" />}
                {activeStaff.length} / {staffLimit} Limit
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isAtLimit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/dashboard/billing?upgrade=true')}
                className="text-xs"
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Upgrade {planName}
              </Button>
            )}
            <Button
              onClick={() => setShowStaffModal(true)}
              disabled={isAtLimit}
              variant={isAtLimit ? "secondary" : "default"}
            >
              <Plus className="h-4 w-4 mr-2" />
              Neuer Mitarbeiter
            </Button>
          </div>
        </div>

        {/* Show limit warning */}
        {isAtLimit && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-amber-900">
                  Mitarbeiterlimit erreicht
                </h4>
                <p className="text-sm text-amber-700 mt-1">
                  Sie haben das Maximum von {staffLimit} aktiven Mitarbeitern für Ihren {planName} Plan erreicht.
                  Upgraden Sie Ihren Plan, um weitere Mitarbeiter hinzuzufügen.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/dashboard/billing?upgrade=true')}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Plan upgraden
              </Button>
            </div>
          </div>
        )}

        {/* Staff Grid */}
        {staff.length > 0 ? (
          <>
            {activeStaff.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4">Aktive Mitarbeiter</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeStaff.map((staffMember) => (
                    <StaffCard
                      key={staffMember.id}
                      staff={staffMember}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            )}

            {inactiveStaff.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4 text-gray-600">Inaktive Mitarbeiter</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-75">
                  {inactiveStaff.map((staffMember) => (
                    <StaffCard
                      key={staffMember.id}
                      staff={staffMember}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <Card className="p-12">
            <div className="text-center">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Keine Mitarbeiter vorhanden</h3>
              <p className="text-gray-500 mb-6">
                Fügen Sie Ihre Mitarbeiter hinzu, um Termine zuweisen zu können
              </p>
              <Button onClick={() => setShowStaffModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Ersten Mitarbeiter hinzufügen
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Staff Modal */}
      {showStaffModal && (
        <StaffFormModal
          isOpen={showStaffModal}
          onClose={() => {
            setShowStaffModal(false)
            setEditingStaff(null)
          }}
          staff={editingStaff}
          tenantId={tenantId}
          onSuccess={handleStaffSaved}
          currentUserId={currentUserId}
          isOwner={isOwner}
        />
      )}
    </>
  )
}