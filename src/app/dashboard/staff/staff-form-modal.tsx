'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { AlertCircle, Shield, UserCog, Info, Sparkles } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

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
  user_id?: string | null
}

interface StaffFormModalProps {
  isOpen: boolean
  onClose: () => void
  staff: Staff | null
  tenantId: string
  onSuccess: () => void
  currentUserId?: string | null
  isOwner?: boolean
}

const roles = [
  { value: 'admin', label: 'Admin' },
  { value: 'mitarbeiter', label: 'Mitarbeiter' },
]

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

// Only one role for MVP - removed role selector

export default function StaffFormModal({
  isOpen,
  onClose,
  staff,
  tenantId,
  onSuccess,
  currentUserId,
  isOwner = false
}: StaffFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [upgradeRequired, setUpgradeRequired] = useState(false)
  const [errorDetails, setErrorDetails] = useState<any>(null)

  // Check if editing self
  const isEditingSelf = staff?.user_id && staff.user_id === currentUserId
  const isOwnerEditingSelf = isOwner && isEditingSelf

  // Form state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [color, setColor] = useState('#3B82F6')
  const [role, setRole] = useState('mitarbeiter')
  const [isActive, setIsActive] = useState(true)
  const [canBookAppointments, setCanBookAppointments] = useState(true)

  const supabase = createSupabaseClient()
  const router = useRouter()

  // Initialize form when staff changes
  useEffect(() => {
    if (staff) {
      setFirstName(staff.first_name)
      setLastName(staff.last_name)
      setEmail(staff.email || '')
      setPhone(staff.phone || '')
      setColor(staff.color)
      setRole(staff.role || 'mitarbeiter')
      setIsActive(staff.is_active)
      setCanBookAppointments(staff.can_book_appointments)
    } else {
      // Reset form for new staff
      setFirstName('')
      setLastName('')
      setEmail('')
      setPhone('')
      setColor('#3B82F6')
      setRole('mitarbeiter')
      setIsActive(true)
      setCanBookAppointments(true)
    }
  }, [staff])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const staffData = {
        first_name: firstName,
        last_name: lastName,
        email: email || null,
        phone: phone || null,
        role: role,
        color,
        is_active: isOwnerEditingSelf ? true : isActive, // Owner always stays active
        can_book_appointments: canBookAppointments,
        invite: !staff && !!email // Invite mode for new staff with email (as boolean)
      }

      let response
      if (staff) {
        // Update existing staff via API
        response = await fetch('/api/staff', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...staffData, id: staff.id })
        })
      } else {
        // Create new staff via API
        response = await fetch('/api/staff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(staffData)
        })
      }

      if (!response.ok) {
        const errorData = await response.json()

        // Check if it's a staff limit error
        if (errorData.error === 'Staff limit reached' && errorData.details) {
          setUpgradeRequired(true)
          setErrorDetails(errorData.details)
          setError(errorData.details.message || 'Mitarbeiterlimit erreicht')
          return
        }

        throw new Error(errorData.error || 'Fehler beim Speichern')
      }

      const data = await response.json()

      // Show success message for invite
      if (!staff && email && data.invite_details) {
        // In production, only show that email was sent
        // For development, show the credentials
        if (process.env.NODE_ENV === 'development') {
          alert(
            `Einladung erstellt für ${email}\n\n` +
            `Temporäres Passwort: ${data.invite_details.temporary_password}\n\n` +
            `Hinweis: In der Produktion wird dies per E-Mail versendet.\n` +
            `Der Mitarbeiter sollte das Passwort beim ersten Login ändern.`
          )
        } else {
          alert(`Einladung wurde an ${email} gesendet! Der Mitarbeiter erhält eine E-Mail mit den Zugangsdaten.`)
        }
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Fehler beim Speichern')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {staff ? (
              <>
                <UserCog className="h-5 w-5 text-blue-600" />
                Mitarbeiter-Profil bearbeiten
              </>
            ) : (
              <>
                <UserCog className="h-5 w-5 text-blue-600" />
                Neuer Mitarbeiter
              </>
            )}
          </DialogTitle>
          {staff && (
            <DialogDescription>
              {isEditingSelf
                ? `Als ${isOwner ? 'Inhaber' : 'Mitarbeiter'} können Sie nur bestimmte Felder Ihres Profils bearbeiten.`
                : 'Bearbeiten Sie die Daten und Einstellungen des Mitarbeiters.'
              }
            </DialogDescription>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {error && (
            <div className={cn(
              "p-3 rounded-lg",
              upgradeRequired ? "bg-amber-50 border border-amber-200" : "bg-red-50"
            )}>
              <div className="flex items-start gap-2">
                {upgradeRequired ? (
                  <Sparkles className="h-4 w-4 text-amber-600 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-800 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={cn(
                    "text-sm font-medium",
                    upgradeRequired ? "text-amber-800" : "text-red-800"
                  )}>
                    {error}
                  </p>
                  {upgradeRequired && errorDetails && (
                    <div className="mt-2 space-y-2">
                      <p className="text-xs text-amber-700">
                        Aktuell: {errorDetails.current} von {errorDetails.limit} Mitarbeitern
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => router.push('/dashboard/billing?upgrade=true')}
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        Plan upgraden
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Read-only section for self-editing */}
          {isEditingSelf && (
            <div className="space-y-3">
              {/* Role Display */}
              {isOwnerEditingSelf && (
                <div className="space-y-2">
                  <Label>Rolle</Label>
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                    <Badge className="bg-blue-100 text-blue-700">Admin</Badge>
                    <span className="text-sm text-gray-600">Als Inhaber sind Sie automatisch Admin</span>
                  </div>
                </div>
              )}

              {/* Name Fields - Read-only for self */}
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

              {/* Contact Fields - Read-only for self */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>E-Mail</Label>
                  <Input
                    value={email}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefon</Label>
                  <Input
                    value={phone}
                    onChange={(e) => !isOwnerEditingSelf && setPhone(e.target.value)}
                    disabled={isOwnerEditingSelf}
                    className={cn(isOwnerEditingSelf && "bg-gray-50")}
                    placeholder="+49 123 456789"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Editable fields for new staff or non-self editing */}
          {!isEditingSelf && (
            <div className="space-y-3">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Vorname *</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    placeholder="Max"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nachname *</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    placeholder="Mustermann"
                  />
                </div>
              </div>

              {/* Contact Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-Mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="max@beispiel.de"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+49 123 456789"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Editable Settings Section */}
          <div className="border-t pt-4">
            <div className="space-y-3">
              {/* Role and Color - Role disabled for owner editing self */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Rolle</Label>
                  {isOwnerEditingSelf ? (
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md h-10">
                      <Badge className="bg-blue-100 text-blue-700">Admin</Badge>
                    </div>
                  ) : (
                    <Select
                      value={role}
                      onValueChange={setRole}
                      disabled={isEditingSelf}
                    >
                      <SelectTrigger className={cn("w-full", isEditingSelf && "bg-gray-50")}>
                        <SelectValue placeholder="Wähle eine Rolle" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map(r => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

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
              </div>

              {/* Switch Settings */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <Label htmlFor="can-book" className="text-sm font-medium">
                    Kann Termine annehmen
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">
                    Deaktivieren, wenn {isEditingSelf ? "Sie" : "der Mitarbeiter"} keine Termine annehmen {isEditingSelf ? "möchten" : "soll"}
                  </p>
                </div>
                <Switch
                  id="can-book"
                  checked={canBookAppointments}
                  onCheckedChange={setCanBookAppointments}
                />
              </div>

              {!isEditingSelf && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Label htmlFor="is-active" className="text-sm font-medium">
                      Aktiv
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">
                      Inaktive Mitarbeiter können sich nicht einloggen
                    </p>
                  </div>
                  <Switch
                    id="is-active"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Info Box - Always show and update based on selected role */}
          <div className={cn(
            "border rounded-lg p-3",
            !staff ? (
              role === 'admin' ? "bg-purple-50 border-purple-200" : "bg-green-50 border-green-200"
            ) :
            isEditingSelf && isOwner ? "bg-blue-50 border-blue-200" :
            isEditingSelf ? "bg-amber-50 border-amber-200" :
            role === 'admin' ? "bg-purple-50 border-purple-200" :
            "bg-gray-50 border-gray-200"
          )}>
            <p className={cn(
              "text-sm font-medium",
              !staff ? (
                role === 'admin' ? "text-purple-700" : "text-green-700"
              ) :
              isEditingSelf && isOwner ? "text-blue-700" :
              isEditingSelf ? "text-amber-700" :
              role === 'admin' ? "text-purple-700" :
              "text-gray-700"
            )}>
              <Info className="inline-block h-4 w-4 mr-1" />
              {!staff ? (
                role === 'admin' ? "Admin-Berechtigungen:" : "Mitarbeiter-Berechtigungen:"
              ) :
               isEditingSelf && isOwner ? "Ihre Rechte als Inhaber:" :
               isEditingSelf ? "Ihre Möglichkeiten:" :
               role === 'admin' ? "Admin-Berechtigungen:" :
               "Mitarbeiter-Einstellungen:"}
            </p>
            <ul className={cn(
              "text-xs mt-1 ml-5 space-y-1",
              !staff ? (
                role === 'admin' ? "text-purple-600" : "text-green-600"
              ) :
              isEditingSelf && isOwner ? "text-blue-600" :
              isEditingSelf ? "text-amber-600" :
              role === 'admin' ? "text-purple-600" :
              "text-gray-600"
            )}>
              {!staff ? (
                role === 'admin' ? (
                  <>
                    <li>• Kann andere Mitarbeiter hinzufügen und bearbeiten</li>
                    <li>• Hat Zugriff auf alle Verwaltungsfunktionen</li>
                    <li>• Kann Salon-Einstellungen ändern</li>
                    <li>• Kann Termine für alle Mitarbeiter verwalten</li>
                    <li>• Vollständiger Zugriff auf Berichte und Statistiken</li>
                  </>
                ) : (
                  <>
                    <li>• Kann eigene Termine annehmen und verwalten</li>
                    <li>• Hat Zugriff auf eigene Kundendaten</li>
                    <li>• Kann eigene Verfügbarkeit einsehen</li>
                    <li>• Kalenderfarbe wird für Terminzuordnung verwendet</li>
                    <li>• Kontaktdaten sind für Kunden sichtbar</li>
                  </>
                )
              ) : isEditingSelf && isOwner ? (
                <>
                  <li>• Sie haben volle Admin-Rechte und können nicht herabgestuft werden</li>
                  <li>• Ihr Account bleibt immer aktiv</li>
                  <li>• Sie können wählen, ob Sie Termine annehmen möchten</li>
                  <li>• Sie können alle Mitarbeiter und Einstellungen verwalten</li>
                </>
              ) : isEditingSelf ? (
                <>
                  <li>• Sie können Ihre Verfügbarkeit für Termine selbst steuern</li>
                  <li>• Ihre Kalenderfarbe kann jederzeit angepasst werden</li>
                  <li>• Persönliche Daten werden von Admins verwaltet</li>
                  <li>• Bei Fragen wenden Sie sich an einen Admin</li>
                </>
              ) : role === 'admin' ? (
                <>
                  <li>• Kann andere Mitarbeiter hinzufügen und bearbeiten</li>
                  <li>• Hat Zugriff auf alle Verwaltungsfunktionen</li>
                  <li>• Kann Salon-Einstellungen ändern</li>
                  <li>• Kann Termine für alle Mitarbeiter verwalten</li>
                  <li>• Vollständiger Zugriff auf Berichte und Statistiken</li>
                </>
              ) : (
                <>
                  <li>• Kann eigene Termine annehmen und verwalten</li>
                  <li>• Verfügbarkeit kann vom Admin gesteuert werden</li>
                  <li>• Kalenderfarbe hilft bei der Terminzuordnung</li>
                  <li>• Kontaktdaten sind für Kunden sichtbar</li>
                  <li>• Hat Zugriff auf eigene Kundendaten</li>
                </>
              )}
            </ul>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading} className="min-w-[120px]">
              {loading ? 'Wird gespeichert...' :
               isEditingSelf ? 'Änderungen speichern' :
               staff ? 'Speichern' : 'Mitarbeiter erstellen'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}