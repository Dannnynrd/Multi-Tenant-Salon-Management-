import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

export async function POST() {
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Error signing out:', error)
  }

  // Get referer to redirect back to the same tenant page if possible
  const headersList = await headers()
  const referer = headersList.get('referer')

  // Extract tenant slug from referer if it exists
  let redirectUrl = '/'
  if (referer) {
    const url = new URL(referer)
    const pathParts = url.pathname.split('/')

    // If we're on a tenant page, redirect to tenant home
    if (pathParts[1] && !['dashboard', 'auth', 'api'].includes(pathParts[1])) {
      redirectUrl = `/${pathParts[1]}`
    }
  }

  return NextResponse.redirect(new URL(redirectUrl, process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'))
}

export async function GET() {
  // Support GET for simple link-based signout
  return POST()
}