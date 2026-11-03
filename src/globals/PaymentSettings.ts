import type { GlobalConfig } from 'payload'

import { anyone, isAdmin } from '@/access'
import { revalidateGlobalAfterChange } from '@/hooks/revalidate'

/**
 * Checkout settings that apply across plans.
 *
 * Midtrans settles in rupiah only, so a plan priced in dollars is shown in
 * dollars and charged at `price × usdToIdr`, rounded to the whole rupiah. The
 * rate is fixed here rather than fetched live, so a reader is never charged an
 * amount that moved between the plan page and the payment page.
 */
export const PaymentSettings: GlobalConfig = {
  slug: 'payment-settings',
  label: 'Payment settings',
  admin: {
    group: 'Members',
    description:
      'Plans priced in USD are shown in dollars and charged in rupiah through Midtrans, at the rate below.',
  },
  access: {
    read: anyone,
    update: isAdmin,
  },
  hooks: {
    // The rupiah amount is printed under every dollar price.
    afterChange: [revalidateGlobalAfterChange('plans', ['/encyclopedia', '/'])],
  },
  fields: [
    {
      name: 'usdToIdr',
      type: 'number',
      label: 'Rupiah per US dollar',
      required: true,
      defaultValue: 18000,
      min: 1,
      admin: {
        description:
          'e.g. 18000 charges a USD 7.50 plan as IDR 135.000. A change applies to payments started after it; payment pages already open keep their amount.',
      },
    },
  ],
}
