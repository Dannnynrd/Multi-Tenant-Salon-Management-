'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { DataTable } from '@/components/ui/data-table'
import { SearchBar } from '@/components/ui/search-bar'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Users, Plus, Phone, Mail, Calendar, MoreHorizontal,
  Filter, Download, Upload, ChevronDown, Lock
} from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import CustomerFormModal from './customer-form-modal'

interface Customer {
  id: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  created_at: string
  updated_at: string
  appointment_count: number
  status?: string
  notes?: string
}

interface CustomerListProps {
  customers: Customer[]
  hasAdvancedCRM: boolean
  tenantId: string
}

export default function CustomerList({ customers, hasAdvancedCRM, tenantId }: CustomerListProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  // Filter customers based on search
  const filteredCustomers = useMemo(() => {
    if (!searchQuery) return customers

    const query = searchQuery.toLowerCase()
    return customers.filter(customer =>
      customer.first_name?.toLowerCase().includes(query) ||
      customer.last_name?.toLowerCase().includes(query) ||
      customer.email?.toLowerCase().includes(query) ||
      customer.phone?.includes(query)
    )
  }, [customers, searchQuery])

  const columns: ColumnDef<Customer>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => {
        const customer = row.original
        return (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-sm font-medium text-gray-700">
                {customer.first_name?.[0]}{customer.last_name?.[0]}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {customer.first_name} {customer.last_name}
              </p>
              {customer.email && (
                <p className="text-xs text-gray-500">{customer.email}</p>
              )}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'phone',
      header: 'Telefon',
      cell: ({ row }) => {
        const phone = row.original.phone
        return phone ? (
          <div className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-sm">{phone}</span>
          </div>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        )
      },
    },
    {
      accessorKey: 'appointments',
      header: 'Termine',
      cell: ({ row }) => {
        const count = row.original.appointment_count
        return (
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-sm font-medium">{count}</span>
          </div>
        )
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Kunde seit',
      cell: ({ row }) => {
        return (
          <span className="text-sm text-gray-600">
            {format(new Date(row.original.created_at), 'dd.MM.yyyy', { locale: de })}
          </span>
        )
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const customer = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => router.push(`/dashboard/customers/${customer.id}`)}
              >
                Details anzeigen
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedCustomer(customer)
                  setShowCreateModal(true)
                }}
              >
                Bearbeiten
              </DropdownMenuItem>
              {hasAdvancedCRM && (
                <DropdownMenuItem>
                  Notiz hinzufügen
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const handleRowClick = (customer: Customer) => {
    router.push(`/dashboard/customers/${customer.id}`)
  }

  return (
    <>
      <Card>
        {/* Toolbar */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between gap-4">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Kunden suchen..."
              className="max-w-md"
            />

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={!hasAdvancedCRM}
              >
                {!hasAdvancedCRM && <Lock className="h-3.5 w-3.5" />}
                <Upload className="h-4 w-4" />
                Import
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={!hasAdvancedCRM}
              >
                {!hasAdvancedCRM && <Lock className="h-3.5 w-3.5" />}
                <Download className="h-4 w-4" />
                Export
              </Button>

              <Button
                onClick={() => {
                  setSelectedCustomer(null)
                  setShowCreateModal(true)
                }}
                size="sm"
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Neuer Kunde
              </Button>
            </div>
          </div>

          {!hasAdvancedCRM && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Lock className="h-4 w-4 text-amber-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-amber-800 font-medium">Professional Features</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Upgrade auf Professional für erweiterte CRM-Funktionen wie Notizen, Import/Export und detaillierte Kundenhistorie.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => router.push('/dashboard/billing')}
                >
                  Upgrade
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="p-6">
          {filteredCustomers.length === 0 ? (
            <EmptyState
              icon={Users}
              title={searchQuery ? "Keine Kunden gefunden" : "Noch keine Kunden"}
              description={searchQuery ? "Versuchen Sie eine andere Suche" : "Fügen Sie Ihren ersten Kunden hinzu"}
              action={!searchQuery ? {
                label: "Neuer Kunde",
                onClick: () => {
                  setSelectedCustomer(null)
                  setShowCreateModal(true)
                }
              } : undefined}
            />
          ) : (
            <DataTable
              columns={columns}
              data={filteredCustomers}
              onRowClick={handleRowClick}
            />
          )}
        </div>
      </Card>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <CustomerFormModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false)
            setSelectedCustomer(null)
          }}
          customer={selectedCustomer}
          tenantId={tenantId}
          onSuccess={() => {
            router.refresh()
            setShowCreateModal(false)
            setSelectedCustomer(null)
          }}
        />
      )}
    </>
  )
}