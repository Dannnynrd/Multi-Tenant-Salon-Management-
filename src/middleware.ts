import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'
import { Database } from '@/types/database.types'

// Domains that should not be treated as tenant subdomains
const RESERVED_SUBDOMAINS = [
  'www',
  'app',
  'api',
  'admin',
  'dashboard',
  'auth',
  'billing',
  'support',
  'help',
  'docs',
  'blog',
  'staging',
  'dev',
  'test'
]

// Get the main domain from environment or use localhost for development
const MAIN_DOMAIN = process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'localhost:3000'

export async function middleware(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl

  // First, update the Supabase session
  const response = await updateSession(request)

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') && !pathname.includes('localhost') // static files
  ) {
    return response
  }

  // Log for debugging
  console.log('Middleware - pathname:', pathname, 'hostname:', hostname)

  // Extract subdomain from hostname
  let subdomain: string | null = null

  if (hostname.includes('.') && !hostname.includes('localhost')) {
    // Production: Extract subdomain from full domain
    const parts = hostname.split('.')
    if (parts.length >= 2) {
      const potentialSubdomain = parts[0]

      // Check if it's not the main domain (www or root)
      if (potentialSubdomain && !RESERVED_SUBDOMAINS.includes(potentialSubdomain.toLowerCase())) {
        subdomain = potentialSubdomain.toLowerCase()
      }
    }
  } else if (hostname === 'localhost' || hostname.includes('localhost:')) {
    // Development: Get subdomain from the first path segment
    // For testing: localhost:3000/salon-slug/*
    const parts = pathname.split('/')
    if (parts[1] && !RESERVED_SUBDOMAINS.includes(parts[1]) &&
        !parts[1].startsWith('_') &&
        !parts[1].includes('.') &&
        parts[1] !== 'api' &&
        parts[1] !== 'dashboard' &&
        parts[1] !== 'auth' &&
        parts[1] !== 'pricing' &&
        parts[1] !== 'features') {
      subdomain = parts[1]

      // Rewrite the URL to remove the tenant slug prefix
      const newPath = '/' + parts.slice(2).join('/')
      const url = request.nextUrl.clone()
      url.pathname = newPath || '/'

      // Continue with tenant resolution
      return handleTenantRouting(request, response, subdomain, newPath || '/')
    }
  }

  // If we have a subdomain, verify it exists and set tenant context
  if (subdomain) {
    return handleTenantRouting(request, response, subdomain, pathname)
  }

  // For dashboard and auth paths on main domain (no subdomain)
  if (!subdomain) {
    if (
      pathname.startsWith('/dashboard') ||
      pathname.startsWith('/auth') ||
      pathname.startsWith('/api') ||
      pathname === '/' ||
      pathname.startsWith('/pricing') ||
      pathname.startsWith('/features')
    ) {
      return response
    }
  }

  return response
}

async function handleTenantRouting(
  request: NextRequest,
  response: NextResponse,
  subdomain: string,
  pathname: string
): Promise<NextResponse> {
  try {
    console.log('handleTenantRouting - subdomain:', subdomain, 'pathname:', pathname)

    // Create a Supabase client for tenant lookup using ANON key
    // Uses secure functions only - no direct table access
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return []  // No cookies needed for public tenant lookup
          },
          setAll() {
            // No-op for public access
          },
        },
      }
    )

    // Use secure function to fetch tenant by slug
    let tenant = null
    let error = null

    try {
      // First try the new secure function
      const { data: tenantData, error: rpcError } = await supabase
        .rpc('get_public_tenant', { p_slug: subdomain })

      if (!rpcError && tenantData && tenantData.length > 0) {
        tenant = tenantData[0]
        // Add status field for compatibility
        tenant.status = 'active'
      } else if (rpcError?.message?.includes('does not exist') || rpcError?.code === 'PGRST202') {
        // Try verify_tenant_slug as a simpler check
        const { data: isValid } = await supabase
          .rpc('verify_tenant_slug', { p_slug: subdomain })

        if (isValid === true) {
          // If slug is valid, fetch minimal tenant info
          tenant = {
            id: subdomain, // Use slug as temporary ID
            slug: subdomain,
            name: subdomain,
            status: 'active'
          }
        }
        error = rpcError
      } else {
        error = rpcError
      }
    } catch (e) {
      console.error('Error in tenant lookup:', e)
      error = e
    }

    console.log('Tenant lookup result:', { tenant, error })

    if (tenant) {
      // Set tenant context in headers for downstream use
      response.headers.set('x-tenant-id', tenant.id)
      response.headers.set('x-tenant-slug', tenant.slug)
      response.headers.set('x-tenant-name', tenant.name)

      // Public API routes
      if (pathname.startsWith('/api/public')) {
        // Rewrite to /api/site routes
        const url = request.nextUrl.clone()
        url.pathname = pathname.replace('/api/public', '/api/site')
        const apiResponse = NextResponse.rewrite(url)

        // Copy all headers including tenant headers
        response.headers.forEach((value, key) => {
          apiResponse.headers.set(key, value)
        })

        return apiResponse
      }

      // Public website paths (no auth required)
      if (
        pathname === '/' ||
        pathname.startsWith('/services') ||
        pathname.startsWith('/book') ||
        pathname.startsWith('/team') ||
        pathname.startsWith('/about') ||
        pathname.startsWith('/contact') ||
        pathname.startsWith('/legal')
      ) {
        // Rewrite to public tenant pages
        const url = request.nextUrl.clone()
        url.pathname = `/site${pathname}`
        const rewriteResponse = NextResponse.rewrite(url)

        // Copy all headers including tenant headers
        response.headers.forEach((value, key) => {
          rewriteResponse.headers.set(key, value)
        })

        return rewriteResponse
      }

      // Customer portal paths (auth required)
      if (pathname.startsWith('/portal')) {
        const url = request.nextUrl.clone()
        url.pathname = `/customer${pathname}`
        const rewriteResponse = NextResponse.rewrite(url)

        // Copy all headers including tenant headers
        response.headers.forEach((value, key) => {
          rewriteResponse.headers.set(key, value)
        })

        return rewriteResponse
      }
    } else {
      // Tenant not found or inactive - show not found page
      if (pathname !== '/not-found') {
        const url = request.nextUrl.clone()
        url.pathname = '/not-found'
        return NextResponse.rewrite(url)
      }
    }
  } catch (error) {
    console.error('Error resolving tenant:', error)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}