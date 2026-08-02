'use client'

import Link from 'next/link'

import { formatPromoEnd, planComparePrice, planPrice } from '@/lib/format'
import type { Plan } from '@/payload-types'

import { useEdition } from './useEdition'
import { useMe } from './useMe'

const COPY = {
  en: {
    subscribe: 'Subscribe',
    readNow: 'Read now',
    perks: [
      {
        title: 'Read as a flipbook',
        body: 'In the browser, on any device, with the original page layout intact.',
      },
      {
        title: 'Linked media',
        body: 'Every ensemble entry links out to recordings and video of it being played.',
      },
      {
        title: 'No AI training',
        body: 'Unauthorised scraping, data mining or extraction of this archive is prohibited.',
      },
    ],
  },
  id: {
    subscribe: 'Berlangganan',
    readNow: 'Buka Reader',
    perks: [
      {
        title: 'Dibaca sebagai flipbook',
        body: 'Di peramban, di perangkat apa pun, dengan tata letak halaman aslinya.',
      },
      {
        title: 'Media tertaut',
        body: 'Setiap entri ansambel tertaut ke rekaman audio dan video permainannya.',
      },
      {
        title: 'Tanpa pelatihan AI',
        body: 'Pengambilan, penambangan data atau ekstraksi arsip ini tanpa izin dilarang.',
      },
    ],
  },
} as const

const tab = 'px-7 py-[15px] font-body text-[12px] leading-none font-medium tracking-[0.13em] uppercase'

/**
 * Edition switch and the plan tiers for whichever edition is selected.
 *
 * Both editions are sent from the server so the switch is instant and the page
 * stays statically prerendered — the selection lives in `?edition=`, read on the
 * client so it does not force dynamic rendering.
 */
export function EditionPlans({ plans }: { plans: { en: Plan[]; id: Plan[] } }) {
  const edition = useEdition()
  const { entitled } = useMe()
  const copy = COPY[edition]
  const active = plans[edition]

  return (
    <>
      <div className="mb-[46px] flex w-fit border border-line-strong">
        <Link
          href="/encyclopedia"
          className={`${tab} ${edition === 'en' ? 'bg-bark-450 text-bone' : 'text-soft'}`}
        >
          English edition
        </Link>
        <Link
          href="/encyclopedia?edition=id"
          className={`${tab} border-l border-line-strong ${
            edition === 'id' ? 'bg-bark-450 text-bone' : 'text-soft'
          }`}
        >
          Edisi Bahasa
        </Link>
      </div>

      {active.length === 0 ? (
        <p className="font-body text-[17px] leading-[1.8] font-normal text-muted">
          No plans are listed for this edition yet.
        </p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-[22px]">
          {active.map((plan) => {
            const wasPrice = planComparePrice(plan)
            const promo = formatPromoEnd(plan.promoEndsAt)
            return (
              <div
                key={plan.id}
                className={`relative flex flex-col bg-paper p-[34px] ${
                  plan.featured ? 'border-2 border-crimson' : 'border border-line'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-px -right-px bg-crimson px-3 py-2 font-label text-[9.5px] leading-none font-medium tracking-[0.16em] text-cream uppercase">
                    {plan.badge}
                  </div>
                )}
                <div className="font-label text-[10px] leading-none font-medium tracking-[0.2em] text-brass uppercase">
                  {plan.name}
                </div>
                {wasPrice && (
                  <div className="mt-5 mb-1.5 font-body text-[15px] leading-none font-normal text-[#9a8871] line-through">
                    {wasPrice}
                  </div>
                )}
                <div
                  className={`font-display text-[clamp(26px,3.2vw,40px)] leading-tight whitespace-nowrap text-text ${
                    wasPrice ? '' : 'mt-5'
                  }`}
                >
                  {planPrice(plan)}
                </div>
                <p className="mt-5 flex-1 font-body text-[14.5px] leading-[1.75] font-normal text-muted">
                  {plan.description}
                </p>
                {promo && (
                  <div className="my-5 font-label text-[11px] leading-relaxed text-crimson uppercase">
                    {promo}
                  </div>
                )}
                <Link
                  href={entitled ? `/encyclopedia/read?edition=${edition}` : `/join?plan=${plan.id}`}
                  className={`btn btn-sm mt-6 ${plan.featured ? 'btn-crimson' : 'btn-dark'}`}
                >
                  {entitled ? copy.readNow : copy.subscribe}
                </Link>
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-11 grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-[26px] border-t border-line pt-[38px]">
        {copy.perks.map((perk) => (
          <div key={perk.title}>
            <div className="mb-2.5 font-display text-lg leading-snug text-text">{perk.title}</div>
            <p className="m-0 font-body text-[14.5px] leading-[1.75] font-normal text-muted">
              {perk.body}
            </p>
          </div>
        ))}
      </div>
    </>
  )
}
