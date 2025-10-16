import { headers } from 'next/headers'
import { createSupabaseServer } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, Euro, Calendar } from 'lucide-react'
import Link from 'next/link'

async function getTenantServices() {
  const headersList = await headers()
  const tenantId = headersList.get('x-tenant-id')

  if (!tenantId) {
    return null
  }

  const supabase = await createSupabaseServer()

  // Get services grouped by category
  const { data: services } = await supabase
    .from('services')
    .select(`
      *,
      service_categories (
        id,
        name,
        display_order
      )
    `)
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  return services
}

export default async function ServicesPage() {
  const services = await getTenantServices()

  if (!services) {
    notFound()
  }

  // Group services by category
  const servicesByCategory = services.reduce((acc, service) => {
    const categoryName = service.service_categories?.[0]?.name || 'Weitere Leistungen'
    if (!acc[categoryName]) {
      acc[categoryName] = []
    }
    acc[categoryName].push(service)
    return acc
  }, {} as Record<string, any[]>)

  // Sort categories
  const sortedCategories = Object.keys(servicesByCategory).sort((a, b) => {
    if (a === 'Weitere Leistungen') return 1
    if (b === 'Weitere Leistungen') return -1
    return a.localeCompare(b)
  })

  return (
    <>
      {/* Header */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Unsere Leistungen
            </h1>
            <p className="text-lg text-gray-600">
              Entdecken Sie unser umfangreiches Angebot an professionellen Behandlungen
            </p>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {sortedCategories.map((category) => (
            <div key={category} className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {category}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {servicesByCategory[category].map((service: any) => (
                  <Card key={service.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {service.description && (
                        <p className="text-gray-600 mb-4 text-sm">
                          {service.description}
                        </p>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span>{service.duration_minutes} Minuten</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <Euro className="h-4 w-4" />
                          <span>{(service.price / 100).toFixed(2)} €</span>
                        </div>
                      </div>

                      <div className="mt-4">
                        <Link href={`/book?service=${service.id}`}>
                          <Button className="w-full" size="sm">
                            <Calendar className="mr-2 h-4 w-4" />
                            Termin buchen
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}

          {services.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600">
                Aktuell sind keine Leistungen verfügbar.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Haben Sie Fragen zu unseren Leistungen?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Wir beraten Sie gerne persönlich oder telefonisch
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/contact">
              <Button variant="outline">
                Kontakt aufnehmen
              </Button>
            </Link>
            <Link href="/book">
              <Button>
                <Calendar className="mr-2 h-5 w-5" />
                Direkt buchen
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}