'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function setCurrentTenantCookie(tenantId: string) {
  const cookieStore = await cookies()
  cookieStore.set('current-tenant', tenantId, {
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  })
  revalidatePath('/dashboard')
}