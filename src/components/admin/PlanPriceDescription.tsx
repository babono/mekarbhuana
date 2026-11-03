'use client'

import { FieldDescription, useFormFields } from '@payloadcms/ui'
import type { FieldDescriptionClientProps } from 'payload'
import { useEffect, useState } from 'react'

import { formatPrice, idrCharge } from '@/lib/format'

const rupiah = (amount: number) => new Intl.NumberFormat('id-ID').format(amount)

/**
 * The Plan price field's help text, worked out from the live rate in Payment
 * settings and the price being typed — so an editor sees exactly what Midtrans
 * will charge before saving, instead of a fixed example that goes stale when the
 * rate changes.
 */
export function PlanPriceDescription({ path }: FieldDescriptionClientProps) {
  const currency = useFormFields(([fields]) => fields.currency?.value) as string | undefined
  const price = useFormFields(([fields]) => fields.price?.value) as number | undefined
  const [rate, setRate] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/globals/payment-settings?depth=0', { credentials: 'include' })
      .then((response) => (response.ok ? response.json() : null))
      .then((settings: { usdToIdr?: number } | null) => {
        if (!cancelled) setRate(settings?.usdToIdr ?? null)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  let description: string
  if (currency === 'USD') {
    const rateText = rate
      ? `IDR ${rupiah(rate)} per USD (Members → Payment settings)`
      : 'the rate in Members → Payment settings'
    const charge = typeof price === 'number' ? idrCharge({ price, currency }, rate) : null
    description = charge
      ? `In US dollars. ${formatPrice(price!, 'USD')} is charged as ${formatPrice(charge, 'IDR')}, at ${rateText}.`
      : `In US dollars, e.g. 7.5 for USD 7.50. Charged in rupiah at ${rateText}.`
  } else {
    description = 'In rupiah, e.g. 40000 for IDR 40.000. Charged exactly as entered.'
  }

  return <FieldDescription path={path} description={description} />
}
