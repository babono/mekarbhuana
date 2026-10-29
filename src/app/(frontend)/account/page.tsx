import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { isEntitled } from '@/access/entitlement'
import { logoutAction } from '@/app/(frontend)/actions'
import { PayButton } from '@/components/site/PayButton'
import { getPayloadAndUser, readAsUser } from '@/lib/auth'
import { reconcileOrder } from '@/lib/checkout'
import { formatDate, formatPrice } from '@/lib/format'
import type { Ebook, Plan, Subscription } from '@/payload-types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'My account',
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Awaiting payment',
  active: 'Active',
  expired: 'Expired',
  cancelled: 'Cancelled',
}

const statusPill = (status: string) => {
  const base =
    'inline-block border border-current px-3 py-2 font-label text-[10px] leading-none font-medium tracking-[0.16em] uppercase'
  if (status === 'active') return `${base} text-[#40602a]`
  if (status === 'pending') return `${base} text-brass`
  return `${base} text-crimson`
}

const PAYMENT_NOTICE: Record<string, { tone: 'good' | 'wait' | 'bad'; text: string }> = {
  paid: {
    tone: 'good',
    text: 'Payment received — your subscription is open. Enjoy the encyclopedia.',
  },
  pending: {
    tone: 'wait',
    text: 'We are waiting for your payment to clear. If you chose a bank transfer, follow the instructions from Midtrans — your access opens as soon as it arrives.',
  },
  failed: {
    tone: 'bad',
    text: 'That payment did not go through, and you have not been charged. You can try again below.',
  },
  unavailable: {
    tone: 'bad',
    text: 'We could not open the payment page just now. Please try again in a moment, or write to us.',
  },
}

const NOTICE_TONE = {
  good: 'border-sage bg-[#eef3e8] text-[#40602a]',
  wait: 'border-brass bg-[#f6f0e2] text-text',
  bad: 'border-crimson bg-[#fbeceb] text-crimson',
} as const

const dataRow =
  'flex justify-between gap-4 border-b border-dotted border-line py-3.5 font-label text-[13px] leading-relaxed last:border-b-0'

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string; payment?: string; order_id?: string }>
}) {
  const { welcome, payment, order_id: orderId } = await searchParams
  const { payload, user } = await getPayloadAndUser()

  if (!user) redirect('/login')

  // Midtrans sends the reader back here with the order in the query string.
  // Its real status is fetched rather than read from the URL, which settles the
  // order at once instead of waiting on the notification — then the URL is
  // cleaned so a refresh does not repeat the lookup.
  if (orderId) {
    let outcome = 'pending'
    try {
      const result = await reconcileOrder(payload, orderId)
      const owner =
        result &&
        (typeof result.subscription.user === 'object'
          ? result.subscription.user.id
          : result.subscription.user)
      if (result && owner === user.id)
        outcome = result.outcome === 'reversed' ? 'failed' : result.outcome
    } catch (error) {
      payload.logger.error({ err: error }, `Reconciling ${orderId} on return`)
    }
    redirect(`/account?payment=${outcome}`)
  }

  const [subscriptionsResult, ebooksResult] = await Promise.all([
    payload.find({
      collection: 'subscriptions',
      where: { user: { equals: user.id } },
      sort: '-createdAt',
      depth: 1,
      limit: 20,
      ...readAsUser(user),
    }),
    payload.find({ collection: 'ebooks', depth: 0, limit: 10, ...readAsUser(user) }),
  ])

  // Abandoned attempts that never opened access are noise in a reader's history.
  const subscriptions = (subscriptionsResult.docs as Subscription[]).filter(
    (sub) => sub.status !== 'cancelled' || sub.startsAt,
  )
  const notice = payment ? PAYMENT_NOTICE[payment] : undefined
  const ebooks = ebooksResult.docs as Ebook[]
  const entitled = isEntitled(user)

  return (
    <main>
      <section className="relative overflow-hidden bg-bark-500 px-[26px] pt-[78px] pb-[66px]">
        <div className="mx-auto max-w-shell">
          <div className="crumb">
            <Link href="/" className="text-gold-light">
              Mekar Bhuana
            </Link>{' '}
            / Account
          </div>
          <h1 className="m-0 mb-5 font-display text-[clamp(38px,6vw,78px)] leading-[1.04] text-balance text-parchment">
            {user.name}
          </h1>
          <p className="m-0 max-w-[540px] font-body text-[clamp(16px,1.5vw,19px)] leading-[1.75] font-normal text-pretty text-sand">
            {entitled
              ? 'Your subscription is open — the flipbook is yours to read.'
              : 'Your reading account is set up. Access opens as soon as a subscription is activated.'}
          </p>
        </div>
      </section>

      <section className="bg-cream py-20">
        <div className="mx-auto max-w-shell px-[26px]">
          {welcome && !notice && (
            <div className="mb-[34px] border-l-[3px] border-sage bg-[#eef3e8] px-4 py-3.5 font-body text-sm leading-relaxed text-[#40602a]">
              Welcome to Mekar Bhuana.
            </div>
          )}
          {notice && (
            <div
              className={`mb-[34px] border-l-[3px] px-4 py-3.5 font-body text-sm leading-relaxed ${NOTICE_TONE[notice.tone]}`}
            >
              {notice.text}
            </div>
          )}

          <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] items-start gap-[26px]">
            <div className="card p-[38px]">
              <div className="kicker mb-5">Membership</div>

              <dl className="m-0">
                <div className={dataRow}>
                  <dt className="m-0 text-shadow uppercase">Status</dt>
                  <dd className="m-0 text-right text-text">
                    <span className={statusPill(entitled ? 'active' : 'expired')}>
                      {entitled ? 'Active' : (user.membershipStatus ?? 'none')}
                    </span>
                  </dd>
                </div>
                {user.membershipExpiresAt && (
                  <div className={dataRow}>
                    <dt className="m-0 text-shadow uppercase">Runs until</dt>
                    <dd className="m-0 text-right text-text">
                      {formatDate(user.membershipExpiresAt)}
                    </dd>
                  </div>
                )}
                {user.membershipEdition && (
                  <div className={dataRow}>
                    <dt className="m-0 text-shadow uppercase">Edition</dt>
                    <dd className="m-0 text-right text-text">
                      {user.membershipEdition === 'en' ? 'English' : 'Bahasa Indonesia'}
                    </dd>
                  </div>
                )}
                <div className={dataRow}>
                  <dt className="m-0 text-shadow uppercase">Email</dt>
                  <dd className="m-0 text-right text-text">{user.email}</dd>
                </div>
                {user.country && (
                  <div className={dataRow}>
                    <dt className="m-0 text-shadow uppercase">Country</dt>
                    <dd className="m-0 text-right text-text">{user.country}</dd>
                  </div>
                )}
              </dl>

              <div className="mt-[34px] flex flex-wrap gap-3">
                {entitled ? (
                  <>
                    <Link href="/encyclopedia/read?edition=en" className="btn btn-sm btn-crimson">
                      Read English Edition
                    </Link>
                    <Link href="/encyclopedia/read?edition=id" className="btn btn-sm btn-crimson">
                      Read Edisi Bahasa
                    </Link>
                  </>
                ) : (
                  <Link href="/encyclopedia" className="btn btn-sm btn-crimson">
                    See the plans
                  </Link>
                )}
                <form action={logoutAction}>
                  <button type="submit" className="btn btn-sm btn-outline">
                    Log out
                  </button>
                </form>
              </div>
            </div>

            <div className="card p-[38px]">
              <div className="kicker mb-5">Subscriptions</div>

              {subscriptions.length === 0 ? (
                <p className="m-0 font-body text-[15px] leading-[1.8] font-normal text-muted">
                  Nothing here yet. <Link href="/encyclopedia">Choose a plan</Link> to start
                  reading.
                </p>
              ) : (
                <dl className="m-0">
                  {subscriptions.map((sub) => {
                    const plan = typeof sub.plan === 'object' ? (sub.plan as Plan) : null
                    return (
                      <div key={sub.id} className={dataRow}>
                        <dt className="m-0 text-shadow uppercase">
                          {plan?.name ?? 'Plan'}
                          {sub.amount != null && sub.currency
                            ? ` · ${formatPrice(sub.amount, sub.currency)}`
                            : ''}
                        </dt>
                        <dd className="m-0 text-right text-text">
                          <span className={statusPill(sub.status)}>
                            {STATUS_LABEL[sub.status] ?? sub.status}
                          </span>
                          {sub.expiresAt && (
                            <div className="mt-2 text-shadow">
                              until {formatDate(sub.expiresAt)}
                            </div>
                          )}
                          {sub.status === 'pending' && (
                            <div className="mt-3">
                              <PayButton
                                subscriptionId={String(sub.id)}
                                label={sub.paymentUrl ? 'Continue payment' : 'Pay now'}
                                className="btn btn-sm btn-crimson"
                              />
                            </div>
                          )}
                        </dd>
                      </div>
                    )
                  })}
                </dl>
              )}

              <p className="mt-[26px] mb-0 font-label text-[11px] leading-[1.7] text-shadow uppercase">
                Payments are handled securely by Midtrans — write to us if anything looks wrong.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
