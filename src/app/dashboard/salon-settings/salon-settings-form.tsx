'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  Image,
  Save,
  Upload,
  Instagram,
  Facebook,
  Loader2,
  Check,
  X,
  Plus
} from 'lucide-react'
import { toast } from 'sonner'

const formSchema = z.object({
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen lang sein'),
  description: z.string().max(500, 'Maximal 500 Zeichen').optional(),
  address: z.string().optional(),
  postal_code: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Ungültige E-Mail-Adresse').optional().or(z.literal('')),
  slug: z.string().min(3, 'Mindestens 3 Zeichen').regex(/^[a-z0-9-]+$/, 'Nur Kleinbuchstaben, Zahlen und Bindestriche erlaubt'),
  logo_url: z.string().optional(),
  images: z.array(z.string()).optional(),
  opening_hours: z.object({
    monday: z.array(z.array(z.string())),
    tuesday: z.array(z.array(z.string())),
    wednesday: z.array(z.array(z.string())),
    thursday: z.array(z.array(z.string())),
    friday: z.array(z.array(z.string())),
    saturday: z.array(z.array(z.string())),
    sunday: z.array(z.array(z.string()))
  }),
  social_media: z.object({
    instagram: z.string().optional(),
    facebook: z.string().optional()
  }).optional()
})

type FormData = z.infer<typeof formSchema>

interface Props {
  initialData: any
  tenantId: string
}

export default function SalonSettingsForm({ initialData, tenantId }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'general')
  const [isLoading, setIsLoading] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)

  // Parse settings JSON if it exists
  const parsedSettings = initialData.settings ?
    (typeof initialData.settings === 'string' ? JSON.parse(initialData.settings) : initialData.settings) : {}

  // Parse opening_hours if it's a string
  const parsedOpeningHours = initialData.opening_hours ?
    (typeof initialData.opening_hours === 'string' ? JSON.parse(initialData.opening_hours) : initialData.opening_hours) : null

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData.name || '',
      description: parsedSettings.description || '',
      address: parsedSettings.address || '',
      postal_code: parsedSettings.postal_code || '',
      city: parsedSettings.city || '',
      phone: parsedSettings.phone || initialData.phone || '',
      email: parsedSettings.email || initialData.email || '',
      slug: initialData.slug || '',
      logo_url: initialData.logo_url || '',
      images: parsedSettings.images || [],
      opening_hours: parsedOpeningHours || {
        monday: [['09:00', '18:00']],
        tuesday: [['09:00', '18:00']],
        wednesday: [['09:00', '18:00']],
        thursday: [['09:00', '18:00']],
        friday: [['09:00', '18:00']],
        saturday: [['10:00', '14:00']],
        sunday: []
      },
      social_media: parsedSettings.social_media || {
        instagram: '',
        facebook: ''
      }
    }
  })

  async function onSubmit(data: FormData) {
    setIsLoading(true)
    try {
      const response = await fetch('/api/settings/salon', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantId,
          settings: data
        })
      })

      if (!response.ok) throw new Error('Fehler beim Speichern')

      toast.success('Einstellungen erfolgreich gespeichert')
      router.refresh()
    } catch (error) {
      toast.error('Fehler beim Speichern der Einstellungen')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingLogo(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'logo')

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) throw new Error('Upload fehlgeschlagen')

      const { url } = await response.json()
      form.setValue('logo_url', url)
      toast.success('Logo erfolgreich hochgeladen')
    } catch (error) {
      toast.error('Fehler beim Hochladen des Logos')
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const currentImages = form.getValues('images') || []
    if (currentImages.length + files.length > 3) {
      toast.error('Maximal 3 Bilder erlaubt')
      return
    }

    setUploadingImages(true)
    try {
      const uploads = await Promise.all(
        files.map(async (file) => {
          const formData = new FormData()
          formData.append('file', file)
          formData.append('type', 'gallery')

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
          })

          if (!response.ok) throw new Error('Upload fehlgeschlagen')
          const { url } = await response.json()
          return url
        })
      )

      form.setValue('images', [...currentImages, ...uploads])
      toast.success(`${uploads.length} Bild(er) hochgeladen`)
    } catch (error) {
      toast.error('Fehler beim Hochladen der Bilder')
    } finally {
      setUploadingImages(false)
    }
  }

  const removeImage = (index: number) => {
    const images = form.getValues('images') || []
    form.setValue('images', images.filter((_, i) => i !== index))
  }

  const weekdays = [
    { key: 'monday', label: 'Montag' },
    { key: 'tuesday', label: 'Dienstag' },
    { key: 'wednesday', label: 'Mittwoch' },
    { key: 'thursday', label: 'Donnerstag' },
    { key: 'friday', label: 'Freitag' },
    { key: 'saturday', label: 'Samstag' },
    { key: 'sunday', label: 'Sonntag' }
  ]

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
            <TabsTrigger
              value="general"
              className={activeTab === 'general' ? 'text-blue-600 font-medium' : 'text-gray-600'}
            >
              Allgemein
            </TabsTrigger>
            <TabsTrigger
              value="contact"
              className={activeTab === 'contact' ? 'text-blue-600 font-medium' : 'text-gray-600'}
            >
              Kontakt
            </TabsTrigger>
            <TabsTrigger
              value="hours"
              className={activeTab === 'hours' ? 'text-blue-600 font-medium' : 'text-gray-600'}
            >
              Öffnungszeiten
            </TabsTrigger>
            <TabsTrigger
              value="media"
              className={activeTab === 'media' ? 'text-blue-600 font-medium' : 'text-gray-600'}
            >
              Medien
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Allgemeine Informationen
                </CardTitle>
                <CardDescription>
                  Grundlegende Informationen über Ihren Salon
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salon Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Mein Salon" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Beschreibung</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Beschreiben Sie Ihren Salon..."
                          className="min-h-[100px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Maximal 500 Zeichen • {field.value?.length || 0}/500
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Ihre Buchungsseite
                      </FormLabel>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="px-3 py-2 bg-gray-50 rounded-l-md border border-r-0">
                            <span className="text-sm text-gray-600">localhost:3000/</span>
                          </div>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="mein-salon"
                              className="rounded-l-none"
                            />
                          </FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`http://localhost:3000/${field.value}`, '_blank')}
                          >
                            Öffnen
                          </Button>
                        </div>
                        <FormDescription>
                          Ihre individuelle URL für die Buchungsseite • Nur Kleinbuchstaben, Zahlen und Bindestriche
                        </FormDescription>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Kontakt & Adresse
                </CardTitle>
                <CardDescription>
                  Kontaktinformationen und Standort Ihres Salons
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Telefon
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="+49 123 456789" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          E-Mail
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="info@meinsalon.de" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Straße & Hausnummer</FormLabel>
                      <FormControl>
                        <Input placeholder="Musterstraße 123" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="postal_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PLZ</FormLabel>
                        <FormControl>
                          <Input placeholder="12345" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stadt</FormLabel>
                        <FormControl>
                          <Input placeholder="Berlin" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-medium">Social Media</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="social_media.instagram"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Instagram className="h-4 w-4" />
                            Instagram
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="@meinsalon" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="social_media.facebook"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Facebook className="h-4 w-4" />
                            Facebook
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="facebook.com/meinsalon" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hours" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Öffnungszeiten
                </CardTitle>
                <CardDescription>
                  Legen Sie Ihre Öffnungszeiten für jeden Wochentag fest
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {weekdays.map(({ key, label }) => {
                    const dayKey = key as keyof FormData['opening_hours']
                    const dayHours = form.watch(`opening_hours.${dayKey}`) || []
                    const isClosed = dayHours.length === 0

                    return (
                      <div key={key} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{label}</span>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={!isClosed}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  form.setValue(`opening_hours.${dayKey}`, [['09:00', '18:00']])
                                } else {
                                  form.setValue(`opening_hours.${dayKey}`, [])
                                }
                              }}
                            />
                            <span className="text-sm text-gray-600">
                              {isClosed ? 'Geschlossen' : 'Geöffnet'}
                            </span>
                          </div>
                        </div>

                        {!isClosed && (
                          <div className="ml-4 space-y-2">
                            {dayHours.map((timeBlock, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <Input
                                  type="time"
                                  value={timeBlock[0]}
                                  onChange={(e) => {
                                    const newHours = [...dayHours]
                                    newHours[index][0] = e.target.value
                                    form.setValue(`opening_hours.${dayKey}`, newHours)
                                  }}
                                  className="w-32"
                                />
                                <span className="text-sm">bis</span>
                                <Input
                                  type="time"
                                  value={timeBlock[1]}
                                  onChange={(e) => {
                                    const newHours = [...dayHours]
                                    newHours[index][1] = e.target.value
                                    form.setValue(`opening_hours.${dayKey}`, newHours)
                                  }}
                                  className="w-32"
                                />
                                {dayHours.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const newHours = dayHours.filter((_, i) => i !== index)
                                      form.setValue(`opening_hours.${dayKey}`, newHours)
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            ))}

                            {dayHours.length < 2 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const lastEnd = dayHours[dayHours.length - 1]?.[1] || '12:00'
                                  const newHours = [...dayHours, [lastEnd, '20:00']]
                                  form.setValue(`opening_hours.${dayKey}`, newHours)
                                }}
                                className="text-xs"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Zeitblock hinzufügen
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                  <p className="text-xs text-gray-500 mt-4">
                    MVP: Maximal 2 Zeitblöcke pro Tag. Feiertage und Ausnahmen in der Pro-Version.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="media" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Logo & Bilder
                </CardTitle>
                <CardDescription>
                  Laden Sie Ihr Logo und Bilder Ihres Salons hoch
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Logo</h3>
                  <div className="flex items-center gap-4">
                    {form.watch('logo_url') ? (
                      <div className="relative w-32 h-32">
                        <img
                          src={form.watch('logo_url')}
                          alt="Logo"
                          className="w-full h-full object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => form.setValue('logo_url', '')}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center bg-gray-50">
                        <Upload className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        id="logo-upload"
                      />
                      <label htmlFor="logo-upload">
                        <Button
                          type="button"
                          variant="outline"
                          disabled={uploadingLogo}
                          onClick={() => document.getElementById('logo-upload')?.click()}
                        >
                          {uploadingLogo ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Wird hochgeladen...
                            </>
                          ) : (
                            <>
                              <Upload className="mr-2 h-4 w-4" />
                              Logo hochladen
                            </>
                          )}
                        </Button>
                      </label>
                      <p className="text-sm text-muted-foreground mt-2">
                        PNG, JPG bis zu 2MB
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Salon Bilder</h3>
                    <Badge variant="secondary">
                      {form.watch('images')?.length || 0}/3
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    {form.watch('images')?.map((url, index) => (
                      <div key={index} className="relative aspect-square">
                        <img
                          src={url}
                          alt={`Bild ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}

                    {(form.watch('images')?.length || 0) < 3 && (
                      <div className="aspect-square border-2 border-dashed rounded-lg flex items-center justify-center bg-gray-50">
                        <div className="text-center">
                          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageUpload}
                            className="hidden"
                            id="images-upload"
                          />
                          <label htmlFor="images-upload">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={uploadingImages}
                              onClick={() => document.getElementById('images-upload')?.click()}
                            >
                              {uploadingImages ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                'Bilder hinzufügen'
                              )}
                            </Button>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Laden Sie bis zu 3 Bilder Ihres Salons hoch
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard')}
          >
            Abbrechen
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Wird gespeichert...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Speichern
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}