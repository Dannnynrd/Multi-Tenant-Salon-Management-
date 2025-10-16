import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PremiumSalonExperience from '@/components/site/premium-salon-experience'

// Mock Data für Demo
const mockTenant = {
  id: '123',
  name: 'Elite Hair Studio',
  tenantSlug: 'elite-hair',
  city: 'Berlin',
  address: 'Kurfürstendamm 195',
  postal_code: '10707',
  phone: '+49 30 123 456 78',
  email: 'info@elite-hair.de',
  website: 'www.elite-hair.de',
  instagram: '@elitehairstudio',
  facebook: 'EliteHairStudio',
  opening_hours: {
    monday: [['09:00', '20:00']],
    tuesday: [['09:00', '20:00']],
    wednesday: [['09:00', '20:00']],
    thursday: [['09:00', '21:00']],
    friday: [['09:00', '21:00']],
    saturday: [['09:00', '18:00']],
    sunday: [['11:00', '17:00']]
  },
  stats: {
    totalCustomers: 5420,
    avgRating: 4.9,
    totalReviews: 842,
    yearsInBusiness: 12,
    monthlyAppointments: 320,
    teamMembers: 15,
    happyCustomers: 98,
    awards: 5
  },
  awards: [
    'Best Salon Berlin 2024',
    'Excellence in Hair Color 2023',
    'Customer Choice Award 2023',
    'Sustainability Award 2022',
    'Innovation in Beauty 2022'
  ],
  partners: [
    'LOréal Professionnel',
    'Kérastase',
    'Olaplex',
    'Dyson Professional',
    'GHD',
    'Redken'
  ]
}

const mockServices = [
  {
    id: '1',
    name: 'Signature Cut & Style',
    description_short: 'Präzisionshaarschnitt mit professionellem Styling und Beratung',
    description: 'Unser Signature-Service beginnt mit einer ausführlichen Beratung, gefolgt von einem maßgeschneiderten Haarschnitt und professionellem Styling.',
    duration: 60,
    price: '89',
    category: 'Schnitt & Styling',
    popular: true,
    image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&q=80'
  },
  {
    id: '2',
    name: 'Balayage & Highlights',
    description_short: 'Handgemalte Highlights für natürliche, sonnengeküsste Effekte',
    description: 'Kreieren Sie dimension und Tiefe mit unserer maßgeschneiderten Balayage-Technik.',
    duration: 180,
    price: '220',
    category: 'Farbe',
    popular: true,
    image: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=800&q=80'
  },
  {
    id: '3',
    name: 'Keratin Treatment',
    description_short: 'Brasilianische Keratin-Behandlung für seidig glattes Haar',
    description: 'Verwandeln Sie krauses Haar in glattes, glänzendes Haar mit unserer Premium Keratin-Behandlung.',
    duration: 150,
    price: '280',
    category: 'Behandlung',
    new: true,
    image: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800&q=80'
  },
  {
    id: '4',
    name: 'Bridal Package',
    description_short: 'Komplettes Styling-Paket für Ihren besonderen Tag',
    description: 'Von der Beratung bis zum perfekten Hochzeitstag-Look - wir begleiten Sie.',
    duration: 240,
    price: '450',
    category: 'Special',
    exclusive: true,
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80'
  },
  {
    id: '5',
    name: 'Men\'s Executive',
    description_short: 'Premium Herrenhaarschnitt mit Hot Towel Service',
    description: 'Der ultimative Herrenhaarschnitt mit Verwöhn-Extras.',
    duration: 45,
    price: '65',
    category: 'Herren',
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&q=80'
  },
  {
    id: '6',
    name: 'Olaplex Repair',
    description_short: 'Intensive Reparatur-Behandlung für geschädigtes Haar',
    description: 'Reparieren und stärken Sie Ihr Haar auf molekularer Ebene.',
    duration: 90,
    price: '120',
    category: 'Behandlung',
    image: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=800&q=80'
  }
]

const mockStaff = [
  {
    id: '1',
    first_name: 'Sophie',
    last_name: 'Martinez',
    role: 'Creative Director',
    specializations: ['Balayage Expert', 'Color Correction'],
    years_experience: 15,
    bio: 'Mit über 15 Jahren Erfahrung und Ausbildungen in Paris und London.',
    photo_url: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=400&q=80',
    instagram: '@sophie_hair',
    rating: 4.9,
    reviews: 234
  },
  {
    id: '2',
    first_name: 'Alexander',
    last_name: 'Weber',
    role: 'Master Stylist',
    specializations: ['Precision Cutting', 'Men\'s Styling'],
    years_experience: 12,
    bio: 'Spezialist für moderne Schnitte und Bart-Design.',
    photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    instagram: '@alex_cuts',
    rating: 4.8,
    reviews: 189
  },
  {
    id: '3',
    first_name: 'Nina',
    last_name: 'Schmidt',
    role: 'Color Specialist',
    specializations: ['Creative Color', 'Blonde Expert'],
    years_experience: 10,
    bio: 'Zertifizierte L\'Oréal Professionnel Color Expert.',
    photo_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80',
    instagram: '@nina_colors',
    rating: 5.0,
    reviews: 156
  },
  {
    id: '4',
    first_name: 'Marco',
    last_name: 'Rossi',
    role: 'Senior Stylist',
    specializations: ['Bridal Styling', 'Extensions'],
    years_experience: 8,
    bio: 'Ihr Experte für besondere Anlässe und Haarverlängerungen.',
    photo_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80',
    instagram: '@marco_style',
    rating: 4.9,
    reviews: 142
  }
]

const testimonials = [
  {
    id: '1',
    name: 'Anna Müller',
    role: 'Stammkundin seit 5 Jahren',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80',
    rating: 5,
    text: 'Das beste Salon-Erlebnis in Berlin! Sophie ist eine wahre Künstlerin und versteht genau, was ich möchte. Die Atmosphäre ist luxuriös und entspannend zugleich.',
    service: 'Balayage & Cut',
    verified: true
  },
  {
    id: '2',
    name: 'Michael Chen',
    role: 'Business Professional',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80',
    rating: 5,
    text: 'Als vielbeschäftigter Unternehmer schätze ich Effizienz und Qualität. Hier bekomme ich beides. Online-Buchung ist ein Traum und das Ergebnis ist immer perfekt.',
    service: 'Men\'s Executive',
    verified: true
  },
  {
    id: '3',
    name: 'Lisa Wagner',
    role: 'Fashion Blogger',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80',
    rating: 5,
    text: 'Ich vertraue niemand anderem mit meinen Haaren! Die Farben halten ewig und sehen immer natürlich aus. Plus, der Instagram-würdige Salon ist ein Bonus!',
    service: 'Creative Color',
    verified: true
  }
]

const beforeAfterImages = [
  {
    id: '1',
    before: 'https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?w=600&q=80',
    after: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=600&q=80',
    service: 'Blonde Transformation',
    stylist: 'Nina Schmidt'
  },
  {
    id: '2',
    before: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80',
    after: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&q=80',
    service: 'Men\'s Makeover',
    stylist: 'Alexander Weber'
  },
  {
    id: '3',
    before: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&q=80',
    after: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&q=80',
    service: 'Balayage Magic',
    stylist: 'Sophie Martinez'
  }
]

async function getTenantData() {
  const headersList = await headers()
  const tenantId = headersList.get('x-tenant-id')
  const tenantSlug = headersList.get('x-tenant-slug')

  // For demo purposes, return mock data if no tenant headers
  if (!tenantId || !tenantSlug) {
    return {
      tenant: mockTenant,
      services: mockServices,
      staff: mockStaff,
      testimonials,
      beforeAfterImages
    }
  }

  const supabase = await createClient()

  // Get tenant data
  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single()

  // Get services with categories
  const { data: services } = await supabase
    .from('services')
    .select(`
      *,
      service_categories (
        name
      )
    `)
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .limit(6)

  // Get staff
  const { data: staff } = await supabase
    .from('staff')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .eq('can_book_appointments', true)
    .order('display_order', { ascending: true })
    .limit(4)

  // Merge with mock data for demo
  const enrichedTenant = {
    ...mockTenant,
    ...tenant,
    tenantSlug
  }

  const enrichedServices = services?.length > 0 ? services.map((s: any) => ({
    ...s,
    image: mockServices.find(ms => ms.id === s.id)?.image || mockServices[0].image,
    popular: Math.random() > 0.5,
    new: Math.random() > 0.8,
    exclusive: Math.random() > 0.9
  })) : mockServices

  const enrichedStaff = staff?.length > 0 ? staff.map((s: any) => ({
    ...s,
    photo_url: mockStaff.find(ms => ms.id === s.id)?.photo_url || mockStaff[0].photo_url,
    role: mockStaff.find(ms => ms.id === s.id)?.role || 'Stylist',
    rating: 4.5 + Math.random() * 0.5,
    reviews: Math.floor(100 + Math.random() * 200),
    bio: mockStaff.find(ms => ms.id === s.id)?.bio || 'Erfahrener Stylist mit Leidenschaft für Perfektion.'
  })) : mockStaff

  return {
    tenant: enrichedTenant,
    services: enrichedServices,
    staff: enrichedStaff,
    testimonials,
    beforeAfterImages
  }
}

export default async function EnhancedSalonPage() {
  const data = await getTenantData()

  if (!data.tenant) {
    notFound()
  }

  return (
    <PremiumSalonExperience
      tenant={data.tenant}
      activeServices={data.services}
      activeStaff={data.staff}
      testimonials={data.testimonials}
      beforeAfterImages={data.beforeAfterImages}
    />
  )
}