# Tenant Access Control System

## Übersicht

Das System sperrt automatisch Tenants, deren Abonnement abgelaufen ist oder die keine Zahlung geleistet haben. Gesperrte Tenants können:
- ✅ Sich einloggen und Billing-Seite sehen
- ✅ Ihr Abonnement reaktivieren
- ❌ KEINE Termine erstellen/bearbeiten
- ❌ KEINE Kunden/Mitarbeiter verwalten
- ❌ KEINE Services anbieten
- ❌ Ihre öffentliche Buchungsseite ist offline

## Automatische Sperrung erfolgt bei:

1. **Trial abgelaufen** - Nach 30 Tagen Testphase
2. **Zahlung fehlgeschlagen** - Nach 7 Tagen Grace Period
3. **Abo gekündigt** - Sofort nach Ablauf der bezahlten Periode
4. **Kein Abo nach Signup** - Nach 3 Tagen ohne Abo-Abschluss

## Automatische Entsperrung erfolgt bei:

1. **Zahlung erfolgreich** - Sofort nach Stripe-Webhook
2. **Neues Abo abgeschlossen** - Sofort nach Checkout
3. **Trial gestartet** - Bei neuem Trial-Abo

## Implementation

### 1. Database Setup

Führe das SQL-Script aus:
```bash
# In Supabase SQL Editor ausführen:
supabase/tenant-locking-system.sql
```

### 2. Frontend Protection (Client Components)

```tsx
// In einer geschützten Seite (z.B. Appointments)
import { TenantAccessGuard } from '@/hooks/use-tenant-access'

export default function AppointmentsPage() {
  const tenantId = cookies().get('current-tenant')?.value

  return (
    <TenantAccessGuard tenantId={tenantId}>
      {/* Dieser Content wird nur angezeigt wenn Tenant aktiv ist */}
      <AppointmentCalendar />
    </TenantAccessGuard>
  )
}
```

### 3. Hook für custom Logic

```tsx
import { useTenantAccess } from '@/hooks/use-tenant-access'

function MyComponent() {
  const tenantId = useTenantCookie()
  const { hasAccess, isLocked, inGracePeriod, graceUntil } = useTenantAccess(tenantId)

  if (!hasAccess) {
    return <UpgradePrompt />
  }

  if (inGracePeriod) {
    return (
      <WarningBanner>
        Zahlung ausstehend! Zugriff bis {graceUntil}
      </WarningBanner>
    )
  }

  return <FullAccessContent />
}
```

### 4. API Route Protection

```ts
// In API Routes (z.B. /api/appointments/create)
import { requireTenantAccess } from '@/lib/tenant-access'

export async function POST(request: Request) {
  const { tenantId, data } = await request.json()

  // Check tenant access
  const accessError = await requireTenantAccess(tenantId)
  if (accessError) return accessError

  // Tenant has access, proceed with creation
  const appointment = await createAppointment(data)
  return NextResponse.json(appointment)
}
```

### 5. Server Actions Protection

```ts
// In Server Actions
import { serverCheckTenantAccess } from '@/lib/tenant-access'

export async function createAppointmentAction(data: FormData) {
  const tenantId = cookies().get('current-tenant')?.value

  // This will throw if no access
  await serverCheckTenantAccess(tenantId!)

  // Proceed with action
  const appointment = await db.appointments.create({
    ...
  })
}
```

### 6. Middleware for entire routes

```ts
// In middleware.ts
import { checkTenantAccess } from '@/lib/tenant-access'

export async function middleware(request: NextRequest) {
  // Protected routes that require active subscription
  const protectedPaths = [
    '/dashboard/appointments',
    '/dashboard/customers',
    '/dashboard/staff',
    '/dashboard/services'
  ]

  const isProtected = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )

  if (isProtected) {
    const tenantId = request.cookies.get('current-tenant')?.value
    if (tenantId) {
      const { hasAccess } = await checkTenantAccess(tenantId)
      if (!hasAccess) {
        return NextResponse.redirect(new URL('/dashboard/billing', request.url))
      }
    }
  }

  return NextResponse.next()
}
```

## Public Booking Page

Die öffentliche Buchungsseite (`/book/[slug]`) sollte auch prüfen:

```tsx
// app/book/[slug]/page.tsx
export default async function PublicBookingPage({ params }: { params: { slug: string } }) {
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, name')
    .eq('slug', params.slug)
    .single()

  if (!tenant) {
    return <NotFound />
  }

  // Check if tenant has active subscription
  const { data: hasAccess } = await supabase
    .rpc('tenant_has_access', { p_tenant_id: tenant.id })

  if (!hasAccess) {
    return (
      <div className="text-center py-20">
        <h1>Dieser Salon ist vorübergehend nicht verfügbar</h1>
        <p>Bitte versuchen Sie es später erneut.</p>
      </div>
    )
  }

  return <BookingWidget tenantId={tenant.id} />
}
```

## Grace Period Handling

Bei Zahlungsfehlern wird automatisch eine 7-tägige Kulanzfrist gesetzt:

```sql
-- Manuell Grace Period setzen (z.B. für Support)
SELECT set_tenant_grace_period('tenant-id-here', 14); -- 14 Tage
```

## Monitoring

```sql
-- Alle gesperrten Tenants anzeigen
SELECT
  id,
  name,
  locked_at,
  locked_reason,
  grace_until
FROM tenants
WHERE locked_at IS NOT NULL
ORDER BY locked_at DESC;

-- Tenants in Grace Period
SELECT
  id,
  name,
  grace_until,
  grace_until - NOW() as time_remaining
FROM tenants
WHERE grace_until IS NOT NULL
  AND grace_until > NOW()
ORDER BY grace_until;

-- Check Cron Job Logs
SELECT *
FROM ops_events
WHERE kind = 'cron.lock_expired_tenants'
ORDER BY created_at DESC
LIMIT 10;
```

## Testing

```sql
-- Test: Lock a tenant manually
SELECT lock_tenant('tenant-id-here', 'Test lock');

-- Test: Unlock a tenant manually
SELECT unlock_tenant('tenant-id-here');

-- Test: Check if tenant has access
SELECT tenant_has_access('tenant-id-here');
```

## Important Notes

1. **Service Workers**: Hintergrund-Jobs (Webhooks, Cron) nutzen `service_role` und umgehen RLS
2. **Real-time Updates**: Frontend reagiert automatisch auf Lock/Unlock via Supabase Realtime
3. **Booking Prevention**: Öffentliche Buchungsseite wird automatisch deaktiviert
4. **Immediate Effect**: Sperrung wirkt sofort auf alle aktiven Sessions
5. **Reactivation**: Bei Zahlung sofortige automatische Entsperrung