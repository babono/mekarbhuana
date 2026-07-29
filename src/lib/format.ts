import type { Plan } from '@/payload-types'

/** `USD 27.50` / `IDR 220.000` — the two conventions the design uses side by side. */
export const formatPrice = (amount: number, currency: string): string => {
  if (currency === 'IDR') {
    return `IDR ${new Intl.NumberFormat('id-ID').format(amount)}`
  }
  return `USD ${amount.toFixed(2)}`
}

export const planPrice = (plan: Plan): string => formatPrice(plan.price, plan.currency)

export const planComparePrice = (plan: Plan): string | null =>
  plan.compareAtPrice ? formatPrice(plan.compareAtPrice, plan.currency) : null

export const formatDate = (value?: string | null): string => {
  if (!value) return ''
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export const formatPromoEnd = (value?: string | null): string | null => {
  if (!value) return null
  return `Until ${formatDate(value)}`
}
