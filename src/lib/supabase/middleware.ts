import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes check
  const protectedPaths = ['/dashboard']
  const isProtectedPath = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )

  if (!user && isProtectedPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/sign-in'
    return NextResponse.redirect(url)
  }

  // Set tenant cookie if user is logged in and doesn't have one
  if (user && (request.nextUrl.pathname.startsWith('/dashboard') ||
               request.nextUrl.pathname.startsWith('/pricing'))) {

    const tenantCookie = request.cookies.get('current-tenant')

    if (!tenantCookie?.value) {
      // Get user's first tenant
      const { data: membership } = await supabase
        .from('tenant_members')
        .select('tenant_id')
        .eq('user_id', user.id)
        .limit(1)
        .single()

      if (membership?.tenant_id) {
        // Set tenant cookie
        supabaseResponse.cookies.set({
          name: 'current-tenant',
          value: membership.tenant_id,
          httpOnly: false,
          path: '/',
          maxAge: 60 * 60 * 24 * 30, // 30 days
        })
      } else if (!request.nextUrl.pathname.startsWith('/onboarding')) {
        // Redirect to onboarding if no tenant
        const url = request.nextUrl.clone()
        url.pathname = '/onboarding'
        return NextResponse.redirect(url)
      }
    }

    // Check tenant access for dashboard routes (except billing)
    if (request.nextUrl.pathname.startsWith('/dashboard') &&
        !request.nextUrl.pathname.startsWith('/dashboard/billing')) {

      const tenantId = tenantCookie?.value || supabaseResponse.cookies.get('current-tenant')?.value

      if (tenantId) {
        // Use service role to check access (bypass RLS)
        const adminSupabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          {
            cookies: {
              getAll() {
                return request.cookies.getAll()
              },
              setAll() {
                // Service role doesn't need to set cookies
              },
            },
          }
        )

        // Check if tenant has access
        const { data: hasAccess } = await adminSupabase
          .rpc('tenant_has_access', { p_tenant_id: tenantId })

        if (!hasAccess) {
          // Redirect to billing if no access
          const url = request.nextUrl.clone()
          url.pathname = '/dashboard/billing'
          url.searchParams.set('upgrade', 'required')
          return NextResponse.redirect(url)
        }
      }
    }
  }

  return supabaseResponse
}