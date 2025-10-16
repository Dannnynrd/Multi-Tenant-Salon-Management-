'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Edit, Trash, Clock, Euro } from 'lucide-react'

interface Service {
  id: string
  name: string
  description: string | null
  duration: number
  price: number
  category: string | null
  is_active: boolean
  created_at: string
}

interface ServicesListProps {
  services: Service[]
}

export default function ServicesList({ services: initialServices }: ServicesListProps) {
  const [services, setServices] = useState(initialServices)
  const router = useRouter()
  const supabase = createSupabaseClient()

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

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}min` : ''}`
    }
    return `${mins}min`
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  if (services.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">Noch keine Services vorhanden</p>
        <Button onClick={() => router.push('/dashboard/services/new')}>
          Ersten Service hinzufügen
        </Button>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Kategorie</TableHead>
          <TableHead>Dauer</TableHead>
          <TableHead>Preis</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {services.map((service) => (
          <TableRow key={service.id}>
            <TableCell>
              <div>
                <p className="font-medium">{service.name}</p>
                {service.description && (
                  <p className="text-sm text-gray-500">{service.description}</p>
                )}
              </div>
            </TableCell>
            <TableCell>
              {service.category ? (
                <Badge variant="secondary">{service.category}</Badge>
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-gray-400" />
                {formatDuration(service.duration)}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <Euro className="h-4 w-4 text-gray-400" />
                {formatPrice(service.price)}
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={service.is_active ? 'default' : 'secondary'}>
                {service.is_active ? 'Aktiv' : 'Inaktiv'}
              </Badge>
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => router.push(`/dashboard/services/${service.id}/edit`)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Bearbeiten
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDelete(service.id)}
                    className="text-red-600"
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Löschen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}