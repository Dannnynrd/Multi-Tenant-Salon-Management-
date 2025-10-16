'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { AlertCircle, Plus } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ServiceCategory {
  id: string
  name: string
  display_order: number
  tenant_id: string
}

interface Service {
  id: string
  name: string
  description: string | null
  duration: number
  price: number
  category_id: string | null
  is_active: boolean
  tenant_id: string
}

interface ServiceFormModalProps {
  isOpen: boolean
  onClose: () => void
  service: Service | null
  tenantId: string
  onSuccess: () => void
  categories: ServiceCategory[]
}

export default function ServiceFormModal({
  isOpen,
  onClose,
  service,
  tenantId,
  onSuccess,
  categories
}: ServiceFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showNewCategory, setShowNewCategory] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState(30)
  const [price, setPrice] = useState(0)
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isActive, setIsActive] = useState(true)

  const supabase = createSupabaseClient()

  // Initialize form when service changes
  useEffect(() => {
    if (service) {
      setName(service.name)
      setDescription(service.description || '')
      setDuration(service.duration)
      setPrice(service.price)
      setCategoryId(service.category_id)
      setIsActive(service.is_active)
    } else {
      // Reset form for new service
      setName('')
      setDescription('')
      setDuration(30)
      setPrice(0)
      setCategoryId(null)
      setIsActive(true)
    }
  }, [service])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      let finalCategoryId = categoryId

      // Create new category if needed
      if (showNewCategory && newCategoryName) {
        const { data: newCategory, error: categoryError } = await supabase
          .from('service_categories')
          .insert({
            name: newCategoryName,
            tenant_id: tenantId,
            display_order: categories.length
          })
          .select()
          .single()

        if (categoryError) throw categoryError
        finalCategoryId = newCategory.id
      }

      const serviceData = {
        name,
        description: description || null,
        duration,
        price,
        category_id: finalCategoryId,
        is_active: isActive,
        tenant_id: tenantId
      }

      let result
      if (service) {
        // Update existing service
        result = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', service.id)
          .select()
          .single()
      } else {
        // Create new service
        result = await supabase
          .from('services')
          .insert(serviceData)
          .select()
          .single()
      }

      if (result.error) {
        throw result.error
      }

      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Fehler beim Speichern')
    } finally {
      setLoading(false)
    }
  }

  const durationOptions = [
    { value: 15, label: '15 Minuten' },
    { value: 30, label: '30 Minuten' },
    { value: 45, label: '45 Minuten' },
    { value: 60, label: '1 Stunde' },
    { value: 90, label: '1,5 Stunden' },
    { value: 120, label: '2 Stunden' },
    { value: 150, label: '2,5 Stunden' },
    { value: 180, label: '3 Stunden' },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {service ? 'Service bearbeiten' : 'Neuer Service'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-2">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-800 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Name */}
          <div className="space-y-1">
            <Label htmlFor="name">Service-Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="z.B. Herrenhaarschnitt"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optionale Beschreibung des Services"
              rows={2}
            />
          </div>

          {/* Duration and Price */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="duration">Dauer *</Label>
              <Select
                value={duration.toString()}
                onValueChange={(value) => setDuration(parseInt(value))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Dauer wählen" />
                </SelectTrigger>
                <SelectContent>
                  {durationOptions.map(option => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="price">Preis (€) *</Label>
              <Input
                id="price"
                type="number"
                step="0.50"
                min="0"
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value))}
                required
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-1">
            <Label>Kategorie</Label>
            {!showNewCategory ? (
              <div className="flex gap-2">
                <Select
                  value={categoryId || 'none'}
                  onValueChange={(value) => setCategoryId(value === 'none' ? null : value)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Kategorie wählen">
                      {!categoryId ? 'Keine Kategorie' : categories.find(c => c.id === categoryId)?.name}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      Keine Kategorie
                    </SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowNewCategory(true)}
                  title="Neue Kategorie hinzufügen"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Neue Kategorie eingeben"
                  autoFocus
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowNewCategory(false)
                    setNewCategoryName('')
                  }}
                >
                  Abbrechen
                </Button>
              </div>
            )}
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <Label htmlFor="is-active" className="text-sm font-medium">
                Service aktiv
              </Label>
              <p className="text-sm text-gray-500">
                Inaktive Services können nicht gebucht werden
              </p>
            </div>
            <Switch
              id="is-active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
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
              {loading ? 'Speichere...' : service ? 'Speichern' : 'Service erstellen'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}