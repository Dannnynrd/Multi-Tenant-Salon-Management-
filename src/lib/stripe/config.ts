import { loadStripe } from '@stripe/stripe-js'

export const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
)

// Stripe configuration
export const STRIPE_CONFIG = {
  // Trial period in days (used when creating subscriptions)
  TRIAL_DAYS: 30,

  // Supported payment methods
  PAYMENT_METHODS: ['card'] as const,

  // Locale for Stripe elements
  LOCALE: 'de' as const,

  // Billing portal configuration
  PORTAL_CONFIG: {
    features: {
      customer_update: {
        enabled: true,
        allowed_updates: ['email', 'name', 'address', 'phone']
      },
      invoice_history: {
        enabled: true
      },
      payment_method_update: {
        enabled: true
      },
      subscription_cancel: {
        enabled: true,
        mode: 'at_period_end'
      },
      subscription_pause: {
        enabled: false
      }
    }
  }
}

// Helper to format price for display
export function formatPrice(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}