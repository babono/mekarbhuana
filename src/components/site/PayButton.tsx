'use client'

import { useFormStatus } from 'react-dom'

import { checkoutAction } from '@/app/(frontend)/actions'

function Submit({ label, className }: { label: string; className: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? 'Opening secure payment…' : label}
    </button>
  )
}

/** Sends a signed-in reader to Midtrans for a plan, or to finish an open order. */
export function PayButton({
  planId,
  subscriptionId,
  label = 'Continue to payment',
  className = 'btn btn-crimson block w-full',
}: {
  planId?: string
  subscriptionId?: string
  label?: string
  className?: string
}) {
  return (
    <form action={checkoutAction}>
      {planId && <input type="hidden" name="plan" value={planId} />}
      {subscriptionId && <input type="hidden" name="subscription" value={subscriptionId} />}
      <Submit label={label} className={className} />
    </form>
  )
}
