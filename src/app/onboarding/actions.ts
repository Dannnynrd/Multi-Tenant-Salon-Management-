'use server'

import { cookies } from 'next/headers'

export async function setTenantCookie(tenantId: string) {
  const cookieStore = await cookies()
  cookieStore.set('current-tenant', tenantId, {
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  })
}