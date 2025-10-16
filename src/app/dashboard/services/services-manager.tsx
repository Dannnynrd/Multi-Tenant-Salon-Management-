'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, GripVertical, Edit2, Trash2, Clock, Euro, Settings } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { createSupabaseClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import ServiceFormModal from './service-form-modal'
import CategoryManagerModal from './category-manager-modal'
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

interface Service {
  id: string
  name: string
  description: string | null
  duration: number
  price: number
  category_id: string | null
  service_categories?: {
    id: string
    name: string
  } | null
  is_active: boolean
  display_order?: number
  created_at: string
  tenant_id: string
}

interface ServicesManagerProps {
  initialServices: Service[]
  initialCategories: ServiceCategory[]
  tenantId: string
}

function SortableServiceItem({ service, onEdit, onDelete }: {
  service: Service
  onEdit: (service: Service) => void
  onDelete: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: service.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}min` : ''}`
    }
    return `${mins}min`
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white border rounded-lg p-4 mb-2 hover:shadow-sm transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            {...attributes}
            {...listeners}
            className="cursor-move text-gray-400 hover:text-gray-600"
          >
            <GripVertical className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium text-gray-900">{service.name}</h4>
                {service.description && (
                  <p className="text-sm text-gray-500 mt-1">{service.description}</p>
                )}
                <div className="flex items-center gap-4 mt-2">
                  <span className="flex items-center gap-1 text-sm text-gray-600">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDuration(service.duration)}
                  </span>
                  <span className="flex items-center gap-1 text-sm font-medium">
                    <Euro className="h-3.5 w-3.5" />
                    {service.price.toFixed(2)}
                  </span>
                  <Badge variant={service.is_active ? 'default' : 'secondary'}>
                    {service.is_active ? 'Aktiv' : 'Inaktiv'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => onEdit(service)}
            variant="ghost"
            size="sm"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => onDelete(service.id)}
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function ServicesManager({
  initialServices,
  initialCategories,
  tenantId
}: ServicesManagerProps) {
  const [services, setServices] = useState(initialServices)
  const [categories, setCategories] = useState(initialCategories)
  const [selectedCategory, setSelectedCategory] = useState('Alle')
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
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

  const filteredServices = selectedCategory === 'Alle'
    ? services
    : selectedCategory === 'Ohne Kategorie'
    ? services.filter(s => !s.category_id)
    : services.filter(s => s.service_categories?.id === selectedCategory)

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = filteredServices.findIndex((s) => s.id === active.id)
      const newIndex = filteredServices.findIndex((s) => s.id === over.id)

      const newServices = arrayMove(filteredServices, oldIndex, newIndex)

      // Update display order for all affected services
      const updates = newServices.map((service, index) => ({
        ...service,
        display_order: index
      }))

      // Update local state immediately
      if (selectedCategory === 'Alle') {
        setServices(updates)
      } else if (selectedCategory === 'Ohne Kategorie') {
        // Merge with categorized services
        const categorizedServices = services.filter(s => s.category_id)
        setServices([...categorizedServices, ...updates])
      } else {
        // Merge with other categories
        const otherServices = services.filter(s => s.service_categories?.id !== selectedCategory)
        setServices([...otherServices, ...updates])
      }

      // Update database
      for (const service of updates) {
        await supabase
          .from('services')
          .update({ display_order: service.display_order })
          .eq('id', service.id)
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Sind Sie sicher, dass Sie diesen Service löschen möchten?')) {
      return
    }

    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id)

    if (!error) {
      setServices(services.filter(s => s.id !== id))
    }
  }

  const handleEdit = (service: Service) => {
    setEditingService(service)
    setShowServiceModal(true)
  }

  const handleServiceSaved = () => {
    setShowServiceModal(false)
    setEditingService(null)
    router.refresh()
  }

  const handleCategoriesUpdated = (updatedCategories: ServiceCategory[]) => {
    setCategories(updatedCategories)
    router.refresh()
  }

  // Count services per category
  const getCategoryCount = (categoryId: string | null) => {
    if (categoryId === null) {
      return services.filter(s => !s.category_id).length
    }
    return services.filter(s => s.service_categories?.id === categoryId).length
  }

  return (
    <>
      <div className="space-y-6">
        {/* Category Tabs */}
        <Card>
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <div className="border-b px-6 py-4">
              <div className="flex justify-between items-center">
                <TabsList className="inline-flex items-center gap-2 h-auto p-0 bg-transparent rounded-none border-none">
                <TabsTrigger
                  value="Alle"
                  className="inline-flex items-center bg-white hover:bg-gray-50 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 border border-gray-200 data-[state=active]:border-blue-200 rounded-full px-3 py-1.5 text-sm font-medium transition-colors"
                >
                  Alle
                  <span className="ml-1.5 text-xs">
                    ({services.length})
                  </span>
                </TabsTrigger>

                {categories.length === 0 && services.some(s => !s.category_id) && (
                  <TabsTrigger
                    value="Ohne Kategorie"
                    className="inline-flex items-center bg-white hover:bg-gray-50 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 border border-gray-200 data-[state=active]:border-blue-200 rounded-full px-3 py-1.5 text-sm font-medium transition-colors"
                  >
                    Ohne Kategorie
                    <span className="ml-1.5 text-xs">
                      ({getCategoryCount(null)})
                    </span>
                  </TabsTrigger>
                )}

                {categories.map(category => (
                  <TabsTrigger
                    key={category.id}
                    value={category.id}
                    className="inline-flex items-center bg-white hover:bg-gray-50 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 border border-gray-200 data-[state=active]:border-blue-200 rounded-full px-3 py-1.5 text-sm font-medium transition-colors"
                  >
                    {category.name}
                    <span className="ml-1.5 text-xs">
                      ({getCategoryCount(category.id)})
                    </span>
                  </TabsTrigger>
                ))}
                </TabsList>
                <div className="flex gap-2">
                  <Button onClick={() => setShowCategoryModal(true)} variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Kategorien verwalten
                  </Button>
                  <Button onClick={() => setShowServiceModal(true)} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Neuer Service
                  </Button>
                </div>
              </div>
            </div>

            <TabsContent value={selectedCategory} className="p-6">
              {filteredServices.length > 0 ? (
                mounted ? (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={filteredServices.map(s => s.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {filteredServices.map((service) => (
                        <SortableServiceItem
                          key={service.id}
                          service={service}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                ) : (
                  <div className="space-y-2">
                    {filteredServices.map((service) => (
                      <div key={service.id} className="bg-white border rounded-lg p-4">
                        <h4 className="font-medium">{service.name}</h4>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">
                    {selectedCategory === 'Alle'
                      ? 'Noch keine Services vorhanden'
                      : selectedCategory === 'Ohne Kategorie'
                      ? 'Keine Services ohne Kategorie'
                      : `Keine Services in dieser Kategorie`}
                  </p>
                  <Button onClick={() => setShowServiceModal(true)} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Service hinzufügen
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      {/* Service Modal */}
      {showServiceModal && (
        <ServiceFormModal
          isOpen={showServiceModal}
          onClose={() => {
            setShowServiceModal(false)
            setEditingService(null)
          }}
          service={editingService}
          tenantId={tenantId}
          onSuccess={handleServiceSaved}
          categories={categories}
        />
      )}

      {/* Category Manager Modal */}
      {showCategoryModal && (
        <CategoryManagerModal
          isOpen={showCategoryModal}
          onClose={() => setShowCategoryModal(false)}
          categories={categories}
          tenantId={tenantId}
          onUpdate={handleCategoriesUpdated}
        />
      )}
    </>
  )
}