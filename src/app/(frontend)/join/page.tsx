import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { RegisterForm } from '@/components/site/RegisterForm'
import { getPayloadAndUser, readAsUser } from '@/lib/auth'
import { formatPromoEnd, planComparePrice, planPrice } from '@/lib/format'
import type { Plan } from '@/payload-types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Create your reading account',
  description:
    'One account gives you the flipbook, the linked media, and every future revision inside your subscription period.',
}

const PERKS = [
  '400+ pages, 100+ ensembles',
  'Video and audio for each entry',
  'Read on any device',
  'Cancel any time',
]

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>
}) {
  const { plan: planId } = await searchParams
  const { payload, user } = await getPayloadAndUser()

  // Someone already signed in does not need the registration form.
  if (user) redirect('/account')

  let plan: Plan | null = null
  if (planId) {
    try {
      plan = (await payload.findByID({
        collection: 'plans',
        id: planId,
        depth: 0,
        ...readAsUser(user),
      })) as Plan
    } catch {
      // A stale or mistyped plan link should still let someone register.
      plan = null
    }
  }

  const wasPrice = plan ? planComparePrice(plan) : null
  const promo = plan ? formatPromoEnd(plan.promoEndsAt) : null

  return (
    <main>
      <section className="bg-cream px-[26px] pt-[70px] pb-[90px]">
        <div className="mx-auto max-w-[1000px]">
          <div className="crumb">
            <Link href="/" className="text-crimson">
              Mekar Bhuana
            </Link>{' '}
            / Subscribe
          </div>
          <h1 className="m-0 mb-3.5 font-display text-[clamp(32px,4.6vw,58px)] leading-[1.08] text-balance text-text">
            Create your reading account
          </h1>
          <p className="m-0 mb-11 max-w-[520px] font-body text-[17px] leading-[1.8] font-light text-muted">
            One account gives you the flipbook, the linked media, and every future revision inside
            your subscription period.
          </p>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] items-start gap-11">
            <RegisterForm planId={plan?.id ? String(plan.id) : undefined} />

            <aside className="card p-8">
              <div className="kicker mb-5">Your plan</div>

              {plan ? (
                <>
                  <div className="mb-2 font-display text-[22px] leading-tight text-text">
                    {plan.name} · {plan.edition === 'en' ? 'English' : 'Bahasa Indonesia'}
                  </div>
                  <div className="mb-1.5 font-display text-[34px] leading-none text-crimson">
                    {planPrice(plan)}
                  </div>
                  {wasPrice && (
                    <div className="mb-[22px] font-body text-sm leading-relaxed font-light text-shadow line-through">
                      {wasPrice}
                    </div>
                  )}
                </>
              ) : (
                <p className="m-0 mb-[22px] font-body text-[15px] leading-[1.8] font-light text-muted">
                  No plan chosen yet — create your account now and pick one afterwards, or browse the
                  tiers first.
                </p>
              )}

              <div className="mb-[22px] h-px bg-line-faint" />

              <div className="flex flex-col gap-3 font-body text-[14.5px] leading-relaxed font-light text-muted">
                {PERKS.map((perk) => (
                  <div key={perk} className="flex gap-[11px]">
                    <span className="text-gold">◆</span>
                    {perk}
                  </div>
                ))}
              </div>

              {promo && (
                <div className="my-5 font-mono text-[11px] leading-relaxed text-crimson uppercase">
                  {promo}
                </div>
              )}

              <Link
                href="/encyclopedia"
                className="mt-[18px] block font-mono text-[11px] leading-none font-medium tracking-[0.14em] text-soft uppercase underline underline-offset-4"
              >
                {plan ? 'Change plan' : 'See the plans'}
              </Link>

              <p className="mt-[22px] mb-0 font-mono text-[11px] leading-[1.7] text-shadow uppercase">
                Payment is arranged by email or bank transfer — we open your access as soon as it
                clears.
              </p>
            </aside>
          </div>
        </div>
      </section>
    </main>
  )
}
