import type { CollectionConfig, PayloadRequest } from 'payload'

import type { Plan, Subscription } from '@/payload-types'

import { asUser, isAdmin } from '@/access'

const relId = (value: unknown): string | null => {
  if (!value) return null
  if (typeof value === 'string') return value
  if (typeof value === 'object' && 'id' in (value as Record<string, unknown>)) {
    return String((value as { id: string | number }).id)
  }
  return null
}

const addMonths = (from: Date, months: number): Date => {
  const out = new Date(from)
  out.setMonth(out.getMonth() + months)
  return out
}

/**
 * Recompute a reader's membership window from all of their subscriptions and
 * write it onto the user document, where access control reads it.
 *
 * Deriving this rather than setting it inline keeps the two in step no matter how
 * the change arrived — admin edit, activation, expiry, or a deleted row.
 */
export const syncMembership = async (userId: string, req: PayloadRequest): Promise<void> => {
  const { docs } = await req.payload.find({
    collection: 'subscriptions',
    where: { user: { equals: userId } },
    depth: 0,
    limit: 200,
    pagination: false,
    req,
  })

  const now = Date.now()
  const live = (docs as Subscription[]).filter(
    (sub) =>
      sub.status === 'active' && sub.expiresAt && new Date(sub.expiresAt).getTime() > now,
  )

  // The furthest-out active subscription defines the window; stacked terms extend it.
  const furthest = live.reduce<Subscription | null>((best, sub) => {
    if (!best) return sub
    return new Date(sub.expiresAt!).getTime() > new Date(best.expiresAt!).getTime() ? sub : best
  }, null)

  // "Expired" means a window closed, not merely that a row exists — someone whose
  // only subscription is still awaiting payment has never had access to lose.
  const hasLapsed = (docs as Subscription[]).some(
    (sub) =>
      sub.status === 'expired' ||
      (sub.status !== 'pending' && sub.expiresAt && new Date(sub.expiresAt).getTime() <= now),
  )

  await req.payload.update({
    collection: 'users',
    id: userId,
    data: furthest
      ? {
          membershipStatus: 'active',
          membershipExpiresAt: furthest.expiresAt,
          membershipEdition: furthest.edition,
        }
      : {
          membershipStatus: hasLapsed ? 'expired' : 'none',
          membershipExpiresAt: null,
        },
    req,
    context: { skipMembershipSync: true },
  })
}

export const Subscriptions: CollectionConfig = {
  slug: 'subscriptions',
  labels: { singular: 'Subscription', plural: 'Subscriptions' },
  admin: {
    useAsTitle: 'reference',
    defaultColumns: ['reference', 'user', 'plan', 'status', 'expiresAt'],
    group: 'Members',
    description:
      'One row per purchase. Set the status to Active to open a reader’s access; dates fill in from the plan.',
  },
  access: {
    // Readers may see their own history; only staff may create or change one.
    read: ({ req }) => {
      const user = asUser(req.user)
      if (!user) return false
      if (user.roles?.includes('admin')) return true
      return { user: { equals: user.id } }
    },
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
    },
    {
      name: 'plan',
      type: 'relationship',
      relationTo: 'plans',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending payment', value: 'pending' },
        { label: 'Active', value: 'active' },
        { label: 'Expired', value: 'expired' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      index: true,
      admin: {
        description:
          'While payments are handled off-site, set this to Active once the transfer clears.',
      },
    },
    {
      name: 'startsAt',
      type: 'date',
      admin: {
        date: { pickerAppearance: 'dayOnly' },
        description: 'Filled in automatically when the subscription is first activated.',
      },
    },
    {
      name: 'expiresAt',
      type: 'date',
      index: true,
      admin: {
        date: { pickerAppearance: 'dayOnly' },
        description: 'Derived from the plan length. Override to grant a courtesy extension.',
      },
    },
    {
      name: 'edition',
      type: 'select',
      options: [
        { label: 'English', value: 'en' },
        { label: 'Bahasa Indonesia', value: 'id' },
      ],
      admin: { readOnly: true, description: 'Copied from the plan.' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'amount',
          type: 'number',
          admin: { width: '50%', description: 'What was actually paid, at the price of the day.' },
        },
        {
          name: 'currency',
          type: 'select',
          options: [
            { label: 'USD', value: 'USD' },
            { label: 'IDR', value: 'IDR' },
          ],
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'reference',
      type: 'text',
      admin: {
        description: 'Bank reference or receipt number, so a payment can be traced back.',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: { description: 'Internal only — never shown to the reader.' },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, originalDoc, req, operation }) => {
        const planId = relId(data.plan ?? originalDoc?.plan)
        if (!planId) return data

        const plan = (await req.payload.findByID({
          collection: 'plans',
          id: planId,
          depth: 0,
          req,
        })) as Plan

        // Snapshot the plan onto the subscription: prices and editions change, but a
        // record of what someone bought should not.
        data.edition = plan.edition
        if (operation === 'create') {
          if (data.amount == null) data.amount = plan.price
          if (!data.currency) data.currency = plan.currency
        }

        const becomingActive = data.status === 'active' && originalDoc?.status !== 'active'
        if (becomingActive || (data.status === 'active' && !data.expiresAt)) {
          const startsAt = data.startsAt ? new Date(data.startsAt) : new Date()
          data.startsAt = startsAt
          if (!data.expiresAt) {
            data.expiresAt = addMonths(startsAt, plan.durationMonths)
          }
        }

        return data
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, req, context }) => {
        if (context.skipMembershipSync) return

        const userId = relId(doc.user)
        if (userId) await syncMembership(userId, req)

        // A subscription moved to another reader leaves the previous one to re-derive.
        const previousUserId = relId(previousDoc?.user)
        if (previousUserId && previousUserId !== userId) {
          await syncMembership(previousUserId, req)
        }
      },
    ],
    afterDelete: [
      async ({ doc, req }) => {
        const userId = relId(doc.user)
        if (userId) await syncMembership(userId, req)
      },
    ],
  },
  timestamps: true,
}
