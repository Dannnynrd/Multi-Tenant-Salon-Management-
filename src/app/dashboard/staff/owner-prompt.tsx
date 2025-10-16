'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { UserPlus, Shield } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

interface OwnerPromptProps {
  tenantId: string
  userEmail: string
  userName: string | null
}

const colors = [
  { value: '#3B82F6', label: 'Blau' },
  { value: '#10B981', label: 'Grün' },
  { value: '#F59E0B', label: 'Orange' },
  { value: '#EF4444', label: 'Rot' },
  { value: '#8B5CF6', label: 'Lila' },
  { value: '#EC4899', label: 'Pink' },
  { value: '#14B8A6', label: 'Türkis' },
  { value: '#6366F1', label: 'Indigo' },
]

export default function OwnerPrompt({
  tenantId,
  userEmail,
  userName
}: OwnerPromptProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [loading, setLoading] = useState(false)
  const [color, setColor] = useState('#3B82F6')
  const [canBookAppointments, setCanBookAppointments] = useState(true)
  const router = useRouter()
  const supabase = createSupabaseClient()

  // Extract first and last name from userName or use defaults
  const firstName = userName?.split(' ')[0] || 'Inhaber'
  const lastName = userName?.split(' ').slice(1).join(' ') || 'Administrator'

  // Fetch user profile data on mount
  const [userPhone, setUserPhone] = useState('')

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Try to get phone from user metadata
        setUserPhone(user.user_metadata?.phone || '')
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)

    try {
      // Get current user to link the staff entry
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase
        .from('staff')
        .insert({
          tenant_id: tenantId,
          user_id: user?.id || null, // Link to auth user automatically
          first_name: firstName,
          last_name: lastName,
          email: userEmail,
          phone: userPhone || null,
          role: 'admin', // Always admin for owner
          color: color,
          is_active: true, // Owner must always be active
          can_book_appointments: canBookAppointments
        })

      if (error) throw error

      setIsOpen(false)
      router.refresh()
      window.location.reload() // Force full page reload to show the new staff member
    } catch (err) {
      console.error('Error creating owner staff:', err)
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[600px]" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Admin-Profil einrichten
          </DialogTitle>
          <DialogDescription>
            Als Inhaber müssen Sie sich als Admin-Mitarbeiter registrieren, um alle Funktionen nutzen zu können.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Read-only fields */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Rolle</Label>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                <Badge className="bg-blue-100 text-blue-700">Admin</Badge>
                <span className="text-sm text-gray-600">Als Inhaber sind Sie automatisch Admin</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vorname</Label>
                <Input
                  value={firstName}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div className="space-y-2">
                <Label>Nachname</Label>
                <Input
                  value={lastName}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>E-Mail</Label>
                <Input
                  value={userEmail}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div className="space-y-2">
                <Label>Telefon</Label>
                <Input
                  value={userPhone}
                  placeholder="Keine Angabe"
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </div>
          </div>

          {/* Editable fields */}
          <div className="border-t pt-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="color">Kalenderfarbe *</Label>
                <Select
                  value={color}
                  onValueChange={setColor}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        {colors.find(c => c.value === color)?.label}
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {colors.map(c => (
                      <SelectItem key={c.value} value={c.value}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: c.value }}
                          />
                          {c.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">Diese Farbe wird in Ihrem Kalender angezeigt</p>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <Label htmlFor="can-book" className="text-sm font-medium">
                    Kann Termine annehmen
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">
                    Deaktivieren, wenn Sie keine Termine annehmen möchten
                  </p>
                </div>
                <Switch
                  id="can-book"
                  checked={canBookAppointments}
                  onCheckedChange={setCanBookAppointments}
                />
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700">
              <strong>Hinweis:</strong> Als Admin können Sie:
            </p>
            <ul className="text-xs text-blue-600 mt-1 ml-4 space-y-1">
              <li>• Termine annehmen und verwalten</li>
              <li>• Mitarbeiter hinzufügen und bearbeiten</li>
              <li>• Salon-Einstellungen ändern</li>
              <li>• Alle administrativen Funktionen nutzen</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="min-w-[120px]"
          >
            {loading ? 'Wird erstellt...' : 'Als Admin registrieren'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}