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
import { Plus, GripVertical, Edit2, Trash2, Save, X } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface ServiceCategory {
  id: string
  name: string
  display_order: number
  tenant_id: string
}

interface CategoryManagerModalProps {
  isOpen: boolean
  onClose: () => void
  categories: ServiceCategory[]
  tenantId: string
  onUpdate: (categories: ServiceCategory[]) => void
}

function SortableCategoryItem({
  category,
  onEdit,
  onDelete,
  isEditing,
  editingName,
  onEditingNameChange,
  onSaveEdit,
  onCancelEdit
}: {
  category: ServiceCategory
  onEdit: (category: ServiceCategory) => void
  onDelete: (id: string) => void
  isEditing: boolean
  editingName: string
  onEditingNameChange: (name: string) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: category.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white border rounded-lg p-3 mb-2 hover:shadow-sm transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div
            {...attributes}
            {...listeners}
            className="cursor-move text-gray-400 hover:text-gray-600"
          >
            <GripVertical className="h-4 w-4" />
          </div>
          {isEditing ? (
            <div className="flex items-center gap-2 flex-1">
              <Input
                value={editingName}
                onChange={(e) => onEditingNameChange(e.target.value)}
                className="h-8"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onSaveEdit()
                  } else if (e.key === 'Escape') {
                    onCancelEdit()
                  }
                }}
              />
              <Button
                onClick={onSaveEdit}
                size="sm"
                className="h-8"
              >
                <Save className="h-3 w-3" />
              </Button>
              <Button
                onClick={onCancelEdit}
                variant="outline"
                size="sm"
                className="h-8"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <span className="text-sm font-medium">{category.name}</span>
          )}
        </div>
        {!isEditing && (
          <div className="flex items-center gap-1">
            <Button
              onClick={() => onEdit(category)}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              onClick={() => onDelete(category.id)}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CategoryManagerModal({
  isOpen,
  onClose,
  categories: initialCategories,
  tenantId,
  onUpdate
}: CategoryManagerModalProps) {
  const [categories, setCategories] = useState(initialCategories)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const supabase = createSupabaseClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = categories.findIndex((c) => c.id === active.id)
      const newIndex = categories.findIndex((c) => c.id === over.id)

      const newCategories = arrayMove(categories, oldIndex, newIndex)

      // Update display order
      const updates = newCategories.map((category, index) => ({
        ...category,
        display_order: index
      }))

      setCategories(updates)

      // Update database
      for (const category of updates) {
        await supabase
          .from('service_categories')
          .update({ display_order: category.display_order })
          .eq('id', category.id)
      }

      onUpdate(updates)
    }
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('service_categories')
        .insert({
          name: newCategoryName,
          tenant_id: tenantId,
          display_order: categories.length
        })
        .select()
        .single()

      if (error) throw error

      const updatedCategories = [...categories, data]
      setCategories(updatedCategories)
      onUpdate(updatedCategories)
      setNewCategoryName('')
    } catch (err) {
      console.error('Error adding category:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEditCategory = (category: ServiceCategory) => {
    setEditingId(category.id)
    setEditingName(category.name)
  }

  const handleSaveEdit = async () => {
    if (!editingName.trim() || !editingId) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('service_categories')
        .update({ name: editingName })
        .eq('id', editingId)

      if (error) throw error

      const updatedCategories = categories.map(c =>
        c.id === editingId ? { ...c, name: editingName } : c
      )
      setCategories(updatedCategories)
      onUpdate(updatedCategories)
      setEditingId(null)
      setEditingName('')
    } catch (err) {
      console.error('Error updating category:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingName('')
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Sind Sie sicher, dass Sie diese Kategorie löschen möchten? Services in dieser Kategorie werden zu "Ohne Kategorie".')) {
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('service_categories')
        .delete()
        .eq('id', id)

      if (error) throw error

      const updatedCategories = categories.filter(c => c.id !== id)
      setCategories(updatedCategories)
      onUpdate(updatedCategories)
    } catch (err) {
      console.error('Error deleting category:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Kategorien verwalten</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add new category */}
          <div className="space-y-2">
            <Label>Neue Kategorie</Label>
            <div className="flex gap-2">
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Kategoriename eingeben"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddCategory()
                  }
                }}
              />
              <Button
                onClick={handleAddCategory}
                disabled={loading || !newCategoryName.trim()}
              >
                <Plus className="h-4 w-4 mr-1" />
                Hinzufügen
              </Button>
            </div>
          </div>

          {/* Categories list */}
          <div className="space-y-2">
            <Label>Kategorien (Ziehen zum Sortieren)</Label>
            {categories.length > 0 ? (
              <div className="max-h-[400px] overflow-y-auto pr-2">
                {mounted ? (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={categories.map(c => c.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {categories.map((category) => (
                        <SortableCategoryItem
                          key={category.id}
                          category={category}
                          onEdit={handleEditCategory}
                          onDelete={handleDeleteCategory}
                          isEditing={editingId === category.id}
                          editingName={editingName}
                          onEditingNameChange={setEditingName}
                          onSaveEdit={handleSaveEdit}
                          onCancelEdit={handleCancelEdit}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                ) : (
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <div key={category.id} className="bg-white border rounded-lg p-3">
                        <span className="text-sm font-medium">{category.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 border rounded-lg">
                Noch keine Kategorien vorhanden
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Schließen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}