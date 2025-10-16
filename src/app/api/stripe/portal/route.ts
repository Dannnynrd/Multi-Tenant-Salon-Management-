import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createCustomerPortalSession } from '@/lib/stripe/server'

export async function POST() {
  try {
    const cookieStore = await cookies()
    const tenantId = cookieStore.get('current-tenant')?.value

    if (!tenantId) {
      return NextResponse.json(
        { error: 'No tenant selected' },
        { status: 400 }
      )
    }

    const session = await createCustomerPortalSession({
      tenantId,
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Portal error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}