import type { Plan } from '@/payload-types'

/** `USD 27.50` / `IDR 220.000` — the two conventions the design uses side by side. */
export const formatPrice = (amount: number, currency: string): string => {
  if (currency === 'IDR') {
    return `IDR ${new Intl.NumberFormat('id-ID').format(amount)}`
  }
  return `USD ${amount.toFixed(2)}`
}

export const planPrice = (plan: Plan): string => formatPrice(plan.price, plan.currency)

/**
 * What Midtrans will actually charge for a plan, in whole rupiah. Dollar plans
 * are converted at the fixed rate in Payment settings; null when no usable rate
 * is set, which stops checkout rather than charging a wrong amount.
 */
export const idrCharge = (plan: Pick<Plan, 'price' | 'currency'>, usdToIdr?: number | null) => {
  if (plan.currency === 'IDR') return Math.round(plan.price)
  if (!usdToIdr || usdToIdr <= 0) return null
  return Math.round(plan.price * usdToIdr)
}

/** `Charged as IDR 135.000` under a dollar price; nothing for rupiah plans. */
export const planChargeNote = (plan: Plan, usdToIdr?: number | null): string | null => {
  if (plan.currency === 'IDR') return null
  const amount = idrCharge(plan, usdToIdr)
  return amount ? `Charged as ${formatPrice(amount, 'IDR')}` : null
}

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
