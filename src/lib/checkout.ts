import type { Payload } from 'payload'

import type { Plan, Subscription, User } from '@/payload-types'

import {
  createSnapTransaction,
  getTransactionStatus,
  outcomeOf,
  type MidtransStatus,
  type PaymentOutcome,
} from './midtrans'

type ID = number | string

/** How long a payment page stays usable — long enough for a bank transfer. */
const PAYMENT_WINDOW_HOURS = 24

const planOf = (sub: Subscription): ID => (typeof sub.plan === 'object' ? sub.plan.id : sub.plan)
const userOf = (sub: Subscription): ID => (typeof sub.user === 'object' ? sub.user.id : sub.user)

/**
 * Each attempt gets its own Midtrans order id, since Midtrans refuses to reuse
 * one. The subscription id rides inside it so a late notification for an older
 * attempt still finds its way home.
 */
const newOrderId = (subId: ID) => `MB-${subId}-${Date.now().toString(36)}`

const subIdFromOrderId = (orderId: string): number | null => {
  const id = orderId.match(/^MB-(\d+)-/)?.[1]
  return id ? Number(id) : null
}

const appendNote = (sub: Subscription, line: string) =>
  [sub.notes, `${new Date().toISOString().slice(0, 16).replace('T', ' ')} — ${line}`]
    .filter(Boolean)
    .join('\n')

/**
 * The reader's open order for a plan, or a new one.
 *
 * Reusing an unpaid row is what keeps a reader who tries three times from
 * leaving three abandoned orders behind, as the old checkout did.
 */
export const pendingSubscriptionFor = async (
  payload: Payload,
  user: User,
  planId: ID,
): Promise<Subscription> => {
  const plan = (await payload.findByID({ collection: 'plans', id: planId, depth: 0 })) as Plan

  const { docs } = await payload.find({
    collection: 'subscriptions',
    where: {
      and: [
        { user: { equals: user.id } },
        { plan: { equals: plan.id } },
        { status: { equals: 'pending' } },
      ],
    },
    sort: '-createdAt',
    limit: 1,
    depth: 0,
  })
  // A price change since the order was opened means the old one is stale.
  if (docs[0] && docs[0].amount === plan.price) return docs[0] as Subscription

  return (await payload.create({
    collection: 'subscriptions',
    data: {
      user: user.id,
      plan: plan.id,
      status: 'pending',
      amount: plan.price,
      currency: plan.currency,
    },
  })) as Subscription
}

/**
 * The Midtrans page where this subscription can be paid. An attempt that is
 * still open is handed back as-is, so a reader returning to finish a bank
 * transfer sees the same virtual account number rather than a new one.
 */
export const paymentUrlFor = async (
  payload: Payload,
  sub: Subscription,
  user: User,
  origin: string,
): Promise<string> => {
  if (sub.status !== 'pending') throw new Error('This subscription is not awaiting payment.')

  if (
    sub.paymentUrl &&
    sub.paymentUrlExpiresAt &&
    new Date(sub.paymentUrlExpiresAt).getTime() > Date.now() + 5 * 60_000
  ) {
    return sub.paymentUrl
  }

  const plan = (await payload.findByID({ collection: 'plans', id: planOf(sub), depth: 0 })) as Plan
  if (sub.currency !== 'IDR' || !sub.amount || !Number.isInteger(sub.amount)) {
    // Midtrans settles in whole rupiah only.
    throw new Error('This plan is not priced in rupiah yet — please contact us to subscribe.')
  }

  const orderId = newOrderId(sub.id)
  const edition = plan.edition === 'en' ? 'English' : 'Bahasa Indonesia'
  const { redirectUrl } = await createSnapTransaction({
    orderId,
    amount: sub.amount,
    itemName: `Encyclopedia ${plan.name} · ${edition}`,
    customer: { name: user.name ?? user.email, email: user.email },
    finishUrl: `${origin}/account`,
    notificationUrl: `${origin}/api/subscriptions/midtrans-notification`,
    expiryHours: PAYMENT_WINDOW_HOURS,
  })

  await payload.update({
    collection: 'subscriptions',
    id: sub.id,
    data: {
      paymentOrderId: orderId,
      paymentUrl: redirectUrl,
      paymentUrlExpiresAt: new Date(Date.now() + PAYMENT_WINDOW_HOURS * 3_600_000).toISOString(),
    },
  })

  return redirectUrl
}

/**
 * When a new term should begin: straight away, or when the reader's current
 * access runs out, so renewing early never costs them the time they had left.
 */
const startOfNextTerm = async (payload: Payload, sub: Subscription): Promise<Date> => {
  const { docs } = await payload.find({
    collection: 'subscriptions',
    where: {
      and: [
        { user: { equals: userOf(sub) } },
        { status: { equals: 'active' } },
        { id: { not_equals: sub.id } },
        { expiresAt: { greater_than: new Date().toISOString() } },
      ],
    },
    sort: '-expiresAt',
    limit: 1,
    depth: 0,
  })
  const current = docs[0]?.expiresAt
  return current ? new Date(current) : new Date()
}

/**
 * Bring a subscription in line with what Midtrans says happened to its order.
 * Safe to call any number of times — notifications are retried, and the reader
 * returning from the payment page triggers the same check.
 */
export const applyPaymentStatus = async (
  payload: Payload,
  status: MidtransStatus,
): Promise<{ outcome: PaymentOutcome; subscription: Subscription } | null> => {
  const subId = subIdFromOrderId(status.order_id)
  if (!subId) return null

  let sub: Subscription
  try {
    sub = (await payload.findByID({
      collection: 'subscriptions',
      id: subId,
      depth: 0,
    })) as Subscription
  } catch {
    return null
  }

  const outcome = outcomeOf(status)
  const isCurrentAttempt = sub.paymentOrderId === status.order_id
  const update = (data: Partial<Subscription>) =>
    payload.update({ collection: 'subscriptions', id: sub.id, data }) as Promise<Subscription>

  if (outcome === 'paid' && sub.status === 'pending') {
    // Never trust the amount alone, but never open access for less than the price.
    if (Math.round(Number(status.gross_amount)) !== sub.amount) {
      payload.logger.error(
        `Midtrans ${status.order_id}: paid ${status.gross_amount}, expected ${sub.amount}`,
      )
      sub = await update({
        notes: appendNote(
          sub,
          `Paid ${status.gross_amount} via ${status.order_id}, expected ${sub.amount}. Not activated — check by hand.`,
        ),
      })
      return { outcome: 'pending', subscription: sub }
    }

    sub = await update({
      status: 'active',
      startsAt: (await startOfNextTerm(payload, sub)).toISOString(),
      expiresAt: null,
      reference: status.order_id,
      paymentMethod: status.payment_type ?? null,
      paymentUrl: null,
      paymentUrlExpiresAt: null,
      notes: appendNote(
        sub,
        `Paid via Midtrans (${status.payment_type ?? 'unknown'}), ${status.order_id}.`,
      ),
    })
  } else if (outcome === 'failed' && sub.status === 'pending' && isCurrentAttempt) {
    // An older attempt expiring must not close the one the reader is paying now.
    sub = await update({
      status: 'cancelled',
      paymentUrl: null,
      paymentUrlExpiresAt: null,
      notes: appendNote(sub, `Midtrans ${status.transaction_status}, ${status.order_id}.`),
    })
  } else if (
    outcome === 'reversed' &&
    sub.status === 'active' &&
    sub.reference === status.order_id
  ) {
    sub = await update({
      status: 'cancelled',
      notes: appendNote(
        sub,
        `Midtrans ${status.transaction_status}, ${status.order_id}. Access withdrawn.`,
      ),
    })
  } else if (
    outcome === 'pending' &&
    status.payment_type &&
    !sub.paymentMethod &&
    isCurrentAttempt
  ) {
    sub = await update({ paymentMethod: status.payment_type })
  }

  return { outcome, subscription: sub }
}

/** Ask Midtrans directly rather than trusting anything the browser carried back. */
export const reconcileOrder = async (payload: Payload, orderId: string) => {
  const status = await getTransactionStatus(orderId)
  return status ? applyPaymentStatus(payload, status) : null
}
