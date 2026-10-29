import { createHash } from 'node:crypto'

/**
 * A thin client for the two Midtrans calls the checkout needs: opening a Snap
 * payment page, and asking what became of an order.
 *
 * No SDK — both are single authenticated requests, and the official Node client
 * pulls in a dependency tree for little more than this.
 */

const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true'

const SNAP_URL = isProduction
  ? 'https://app.midtrans.com/snap/v1/transactions'
  : 'https://app.sandbox.midtrans.com/snap/v1/transactions'

const API_URL = isProduction ? 'https://api.midtrans.com/v2' : 'https://api.sandbox.midtrans.com/v2'

const serverKey = (): string => {
  const key = process.env.MIDTRANS_SERVER_KEY
  if (!key) throw new Error('MIDTRANS_SERVER_KEY is not set')
  return key
}

const authHeader = () => `Basic ${Buffer.from(`${serverKey()}:`).toString('base64')}`

export type SnapRequest = {
  orderId: string
  /** Whole rupiah — Midtrans rejects fractional IDR. */
  amount: number
  itemName: string
  customer: { name: string; email: string }
  finishUrl: string
  notificationUrl: string
  expiryHours: number
}

/**
 * Open a hosted payment page and return its address.
 *
 * The notification URL is sent per transaction rather than set in the Midtrans
 * dashboard: the dashboard setting still points at the old WordPress site, and
 * overriding it here lets both run side by side until changeover.
 */
export const createSnapTransaction = async (req: SnapRequest): Promise<{ redirectUrl: string }> => {
  const response = await fetch(SNAP_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: authHeader(),
      'X-Override-Notification': req.notificationUrl,
    },
    body: JSON.stringify({
      transaction_details: { order_id: req.orderId, gross_amount: req.amount },
      item_details: [
        // Midtrans truncates nothing and rejects names over 50 characters.
        { id: req.orderId, name: req.itemName.slice(0, 50), price: req.amount, quantity: 1 },
      ],
      customer_details: { first_name: req.customer.name, email: req.customer.email },
      callbacks: { finish: req.finishUrl },
      expiry: { unit: 'hours', duration: req.expiryHours },
    }),
  })

  const body = (await response.json().catch(() => ({}))) as {
    redirect_url?: string
    error_messages?: string[]
  }
  if (!response.ok || !body.redirect_url) {
    throw new Error(`Midtrans: ${body.error_messages?.join('; ') ?? response.statusText}`)
  }
  return { redirectUrl: body.redirect_url }
}

export type MidtransStatus = {
  order_id: string
  status_code: string
  transaction_status: string
  fraud_status?: string
  gross_amount: string
  payment_type?: string
  transaction_id?: string
}

/** The authoritative state of an order, or null when Midtrans has never seen it. */
export const getTransactionStatus = async (orderId: string): Promise<MidtransStatus | null> => {
  const response = await fetch(`${API_URL}/${encodeURIComponent(orderId)}/status`, {
    headers: { Accept: 'application/json', Authorization: authHeader() },
    cache: 'no-store',
  })
  const body = (await response.json()) as MidtransStatus
  // The status endpoint answers 200 with the real code in the body.
  if (body.status_code === '404') return null
  if (!response.ok || !body.transaction_status) {
    throw new Error(`Midtrans status ${orderId}: ${body.status_code ?? response.status}`)
  }
  return body
}

/** Notifications are signed with the server key; anything else is a forgery. */
export const isValidSignature = (n: {
  order_id?: string
  status_code?: string
  gross_amount?: string
  signature_key?: string
}): boolean => {
  if (!n.order_id || !n.status_code || !n.gross_amount || !n.signature_key) return false
  const expected = createHash('sha512')
    .update(`${n.order_id}${n.status_code}${n.gross_amount}${serverKey()}`)
    .digest('hex')
  return expected === n.signature_key
}

export type PaymentOutcome = 'paid' | 'pending' | 'failed' | 'reversed'

/**
 * Collapse Midtrans's transaction states into what the membership cares about.
 * A card capture only counts once the fraud check has accepted it.
 */
export const outcomeOf = (s: MidtransStatus): PaymentOutcome => {
  switch (s.transaction_status) {
    case 'settlement':
      return 'paid'
    case 'capture':
      return s.fraud_status === 'accept' ? 'paid' : 'pending'
    case 'pending':
    case 'authorize':
      return 'pending'
    case 'refund':
    case 'partial_refund':
    case 'chargeback':
    case 'partial_chargeback':
      return 'reversed'
    default:
      // deny, cancel, expire, failure
      return 'failed'
  }
}
