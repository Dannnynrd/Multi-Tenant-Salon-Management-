'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  User,
  Mail,
  Phone,
  Camera,
  Save,
  Loader2,
  Bell,
  Lock,
  Shield,
  LogOut,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import { createSupabaseClient } from '@/lib/supabase/client'

const formSchema = z.object({
  first_name: z.string().min(1, 'Vorname ist erforderlich'),
  last_name: z.string().min(1, 'Nachname ist erforderlich'),
  email: z.string().email('Ungültige E-Mail-Adresse').optional(),
  phone: z.string().optional(),
  bio: z.string().max(500).optional(),
  avatar_url: z.string().optional(),
  notification_preferences: z.object({
    email: z.boolean(),
    sms: z.boolean(),
    appointment_reminder: z.boolean(),
    appointment_changes: z.boolean()
  })
})

type FormData = z.infer<typeof formSchema>

interface ProfileSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode?: 'dialog' | 'sheet'
}

export default function ProfileSettingsDialog({
  open,
  onOpenChange,
  mode = 'sheet'
}: ProfileSettingsDialogProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [profileData, setProfileData] = useState<any>(null)
  const [userEmail, setUserEmail] = useState('')
  const [userRole, setUserRole] = useState<string>('')
  const [activeTab, setActiveTab] = useState('profile')

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      bio: '',
      avatar_url: '',
      notification_preferences: {
        email: true,
        sms: false,
        appointment_reminder: true,
        appointment_changes: true
      }
    }
  })

  useEffect(() => {
    if (open) {
      fetchProfile()
    }
  }, [open])

  const fetchProfile = async () => {
    try {
      const supabase = createSupabaseClient()

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email || '')
      }

      // Get staff profile
      const response = await fetch('/api/settings/profile')
      if (response.ok) {
        const data = await response.json()
        setProfileData(data)

        // Set user role
        if (data.role) {
          setUserRole(data.role === 'admin' ? 'Administrator' : 'Mitarbeiter')
        }

        // Update form with fetched data
        form.reset({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          email: data.email || userEmail || '',
          phone: data.phone || '',
          bio: data.bio || '',
          avatar_url: data.avatar_url || '',
          notification_preferences: data.notification_preferences || {
            email: true,
            sms: false,
            appointment_reminder: true,
            appointment_changes: true
          }
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Fehler beim Laden des Profils')
    }
  }

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/settings/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) throw new Error('Fehler beim Speichern')

      toast.success('Profil erfolgreich aktualisiert')
      router.refresh()
      onOpenChange(false)
    } catch (error) {
      toast.error('Fehler beim Speichern des Profils')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingAvatar(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'avatar')

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) throw new Error('Upload fehlgeschlagen')

      const { url } = await response.json()
      form.setValue('avatar_url', url)
      toast.success('Profilbild erfolgreich hochgeladen')
    } catch (error) {
      toast.error('Fehler beim Hochladen des Profilbilds')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handlePasswordReset = async () => {
    try {
      const supabase = createSupabaseClient()
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error

      toast.success('Password-Reset E-Mail wurde gesendet')
    } catch (error) {
      toast.error('Fehler beim Senden der Password-Reset E-Mail')
    }
  }

  const handleSignOut = async () => {
    try {
      const response = await fetch('/api/auth/signout', {
        method: 'POST'
      })

      if (response.ok) {
        router.push('/auth/login')
      }
    } catch (error) {
      toast.error('Fehler beim Abmelden')
    }
  }


  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const content = (
    <div className="w-full p-6">
      <div className="border rounded-lg">
        {/* User Info Header */}
        <div className="p-6 flex items-center justify-between border-b">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={form.watch('avatar_url')} />
            <AvatarFallback>
              {form.watch('first_name') && form.watch('last_name')
                ? getInitials(form.watch('first_name'), form.watch('last_name'))
                : <User className="h-5 w-5" />}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium">
              {form.watch('first_name') || 'Vorname'} {form.watch('last_name') || 'Nachname'}
            </h3>
            <p className="text-sm text-muted-foreground">{userEmail}</p>
          </div>
        </div>
        {userRole && (
          <Badge
            className={userRole === 'Administrator'
              ? 'bg-blue-100 text-blue-700 border-blue-200'
              : 'bg-gray-100 text-gray-600 border-gray-200'}
          >
            {userRole}
          </Badge>
        )}
        </div>

        <div className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger
                value="profile"
                className={activeTab === 'profile' ? 'text-blue-600 font-medium' : 'text-gray-600'}
              >
                Profil
              </TabsTrigger>
              <TabsTrigger
                value="notifications"
                className={activeTab === 'notifications' ? 'text-blue-600 font-medium' : 'text-gray-600'}
              >
                Benachrichtigungen
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className={activeTab === 'security' ? 'text-blue-600 font-medium' : 'text-gray-600'}
              >
                Sicherheit
              </TabsTrigger>
          </TabsList>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <TabsContent value="profile" className="space-y-4">
                {/* Avatar Section */}
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <Avatar className="h-20 w-20">
                <AvatarImage src={form.watch('avatar_url')} />
                <AvatarFallback>
                  {form.watch('first_name') && form.watch('last_name')
                    ? getInitials(form.watch('first_name'), form.watch('last_name'))
                    : <User className="h-8 w-8" />}
                </AvatarFallback>
                  </Avatar>
                  <div>
                    <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                      id="avatar-upload"
                    />
                    <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploadingAvatar}
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                >
                  {uploadingAvatar ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="mr-2 h-4 w-4" />
                  )}
                      Foto ändern
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG oder PNG, max. 2MB
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Name Fields */}
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="first_name"
                render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vorname</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="last_name"
                render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nachname</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Email */}
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
                        <Input type="email" placeholder="email@beispiel.de" {...field} />
                      </FormControl>
                      <FormDescription>
                        Ihre E-Mail-Adresse für Benachrichtigungen
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Phone */}
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
                      <FormDescription>
                        Für interne Kommunikation
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Bio */}
                <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                      <FormLabel>Über mich</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Erzählen Sie etwas über sich..."
                          className="resize-none"
                          rows={4}
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
              </TabsContent>

              <TabsContent value="notifications" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Benachrichtigungseinstellungen
                </h3>
                <p className="text-sm text-muted-foreground">
                  Wählen Sie, wie Sie benachrichtigt werden möchten
                </p>
              </div>

              <Separator />

              <FormField
                control={form.control}
                name="notification_preferences.email"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>E-Mail Benachrichtigungen</FormLabel>
                      <FormDescription>
                        Wichtige Updates per E-Mail erhalten
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notification_preferences.sms"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>SMS Benachrichtigungen</FormLabel>
                      <FormDescription>
                        Dringende Nachrichten per SMS
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notification_preferences.appointment_reminder"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>Termin-Erinnerungen</FormLabel>
                      <FormDescription>
                        Erinnerungen für anstehende Termine
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notification_preferences.appointment_changes"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>Termin-Änderungen</FormLabel>
                      <FormDescription>
                        Bei Änderungen oder Stornierungen
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
                </div>
              </TabsContent>

              <TabsContent value="security" className="space-y-4">
                <div className="space-y-4">
                  <div>
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Sicherheitseinstellungen
                </h3>
                <p className="text-sm text-muted-foreground">
                  Verwalten Sie Ihre Sicherheitsoptionen
                </p>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="font-medium flex items-center gap-2">
                          <RefreshCw className="h-4 w-4" />
                          Daten synchronisieren
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Profildaten zwischen allen Tabellen synchronisieren
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="font-medium flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          Passwort
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Ändern Sie Ihr Passwort
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handlePasswordReset}
                      >
                        Passwort ändern
                      </Button>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="font-medium flex items-center gap-2">
                          <LogOut className="h-4 w-4" />
                          Abmelden
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Von allen Geräten abmelden
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSignOut}
                        className="text-red-600 hover:text-red-700"
                      >
                        Abmelden
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
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
        </Tabs>
        </div>
      </div>
    </div>
  )

  if (mode === 'dialog') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Profil-Einstellungen</DialogTitle>
            <DialogDescription>
              Verwalten Sie Ihre persönlichen Einstellungen
            </DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>Profil-Einstellungen</SheetTitle>
          <SheetDescription>
            Verwalten Sie Ihre persönlichen Einstellungen
          </SheetDescription>
        </SheetHeader>
        {content}
      </SheetContent>
    </Sheet>
  )
}