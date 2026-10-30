import type { CollectionConfig, PayloadRequest } from 'payload'

import type { Plan, Subscription } from '@/payload-types'

import { asUser, isAdmin } from '@/access'
import { reconcileOrder } from '@/lib/checkout'
import { isValidSignature } from '@/lib/midtrans'

type ID = number | string

/** A relationship arrives as a bare ID at depth 0 and as a document above it. */
const relId = (value: unknown): ID | null => {
  if (value == null || value === '') return null
  if (typeof value === 'number' || typeof value === 'string') return value
  if (typeof value === 'object' && 'id' in (value as Record<string, unknown>)) {
    return (value as { id: ID }).id
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
export const syncMembership = async (userId: ID, req: PayloadRequest): Promise<void> => {
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
    (sub) => sub.status === 'active' && sub.expiresAt && new Date(sub.expiresAt).getTime() > now,
  )

  // The furthest-out active subscription defines the window; stacked terms extend it.
  const furthestOf = (subs: Subscription[]) =>
    subs.reduce<Subscription | null>((best, sub) => {
      if (!best) return sub
      return new Date(sub.expiresAt!).getTime() > new Date(best.expiresAt!).getTime() ? sub : best
    }, null)
  const furthest = furthestOf(live)
  const untilFor = (edition: 'en' | 'id') =>
    furthestOf(live.filter((sub) => sub.edition === edition))?.expiresAt ?? null

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
          englishAccessUntil: untilFor('en'),
          indonesianAccessUntil: untilFor('id'),
        }
      : {
          membershipStatus: hasLapsed ? 'expired' : 'none',
          membershipExpiresAt: null,
          englishAccessUntil: null,
          indonesianAccessUntil: null,
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
      'One row per purchase. Midtrans payments activate themselves; for anything paid another way, set the status to Active and the dates fill in from the plan.',
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
          'Set by Midtrans for online payments. For a transfer or cash, set this to Active once it clears.',
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
      type: 'collapsible',
      label: 'Midtrans payment',
      admin: {
        initCollapsed: true,
        condition: (data) => Boolean(data?.paymentOrderId),
      },
      fields: [
        {
          name: 'paymentOrderId',
          type: 'text',
          index: true,
          admin: {
            readOnly: true,
            description: 'The latest payment attempt — search for it in the Midtrans dashboard.',
          },
        },
        {
          name: 'paymentMethod',
          type: 'text',
          admin: {
            readOnly: true,
            description: 'As Midtrans reports it, e.g. bank_transfer, gopay.',
          },
        },
        // Where the reader goes to finish paying; reused until it lapses.
        { name: 'paymentUrl', type: 'text', admin: { hidden: true } },
        { name: 'paymentUrlExpiresAt', type: 'date', admin: { hidden: true } },
      ],
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: { description: 'Internal only — never shown to the reader.' },
    },
  ],
  endpoints: [
    {
      // Midtrans calls this whenever an order changes state. The body is only a
      // prompt: once the signature checks out, the order's real status is fetched
      // from Midtrans and that is what gets applied.
      path: '/midtrans-notification',
      method: 'post',
      handler: async (req) => {
        const body = (await req.json?.().catch(() => null)) as Record<string, string> | null
        if (!body || !isValidSignature(body)) {
          return Response.json({ error: 'invalid signature' }, { status: 401 })
        }
        try {
          await reconcileOrder(req.payload, body.order_id)
        } catch (error) {
          req.payload.logger.error({ err: error }, `Midtrans notification ${body.order_id}`)
          // A non-2xx answer makes Midtrans retry later.
          return Response.json({ error: 'not applied' }, { status: 500 })
        }
        return Response.json({ ok: true })
      },
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
