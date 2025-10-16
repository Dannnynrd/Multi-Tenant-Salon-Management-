'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle } from 'lucide-react'
import { createCustomer, updateCustomer } from './actions'

interface Customer {
  id: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
}

interface CustomerFormModalProps {
  isOpen: boolean
  onClose: () => void
  customer: Customer | null
  tenantId: string
  onSuccess: () => void
}

export default function CustomerFormModal({
  isOpen,
  onClose,
  customer,
  tenantId,
  onSuccess
}: CustomerFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [firstName, setFirstName] = useState(customer?.first_name || '')
  const [lastName, setLastName] = useState(customer?.last_name || '')
  const [email, setEmail] = useState(customer?.email || '')
  const [phone, setPhone] = useState(customer?.phone || '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Create form data
      const formData = new FormData()
      formData.append('first_name', firstName)
      formData.append('last_name', lastName)
      formData.append('email', email || '')
      formData.append('phone', phone || '')
      formData.append('tenant_id', tenantId)

      let result
      if (customer) {
        // Update existing customer
        formData.append('id', customer.id)
        result = await updateCustomer(formData)
      } else {
        // Create new customer
        result = await createCustomer(formData)
      }

      if (result.error) {
        throw new Error(result.error)
      }

      onSuccess()
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
          <DialogTitle>
            {customer ? 'Kunde bearbeiten' : 'Neuer Kunde'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-800 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">Vorname *</Label>
              <Input
                id="first_name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                placeholder="Max"
              />
            </div>

            <div>
              <Label htmlFor="last_name">Nachname *</Label>
              <Input
                id="last_name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                placeholder="Mustermann"
              />
            </div>
          </div>

          {/* Contact Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="max@example.com"
              />
            </div>

            <div>
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

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Speichere...' : customer ? 'Speichern' : 'Kunde erstellen'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}