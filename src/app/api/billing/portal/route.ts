import { NextResponse } from 'next/server'
import { createCustomerPortalSession } from '@/lib/stripe/server'

export async function POST(request: Request) {
  try {
    // Handle both JSON and FormData
    const contentType = request.headers.get('content-type')
    let tenantId: string | null = null

    if (contentType?.includes('application/json')) {
      const body = await request.json()
      tenantId = body.tenantId
    } else {
      // Handle form data
      const formData = await request.formData()
      tenantId = formData.get('tenantId') as string
    }

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID required' },
        { status: 400 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const session = await createCustomerPortalSession({
      tenantId,
      returnUrl: `${appUrl}/dashboard/billing`,
    })

    // Redirect to Stripe Portal
    return NextResponse.redirect(session.url)
  } catch (error: any) {
    console.error('Portal session error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}