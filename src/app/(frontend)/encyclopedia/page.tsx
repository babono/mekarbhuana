import type { Metadata } from 'next'
import Link from 'next/link'

import { isEntitled } from '@/access/entitlement'
import { Plate } from '@/components/site/Plate'
import { getPayloadAndUser, readAsUser } from '@/lib/auth'
import { formatPromoEnd, planComparePrice, planPrice } from '@/lib/format'
import type { Ebook, Media, Plan } from '@/payload-types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Encyclopedia of Balinese Gamelan Ensembles',
  description:
    'Over a hundred ensembles across four hundred pages, read as a flipbook in English or Bahasa Indonesia.',
}

const COPY = {
  en: {
    subscribe: 'Subscribe',
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

const coverCaption =
  'mt-3 text-center font-mono text-xs leading-relaxed tracking-[0.1em] text-dust uppercase'

export default async function EncyclopediaPage({
  searchParams,
}: {
  searchParams: Promise<{ edition?: string }>
}) {
  const { edition: requested } = await searchParams
  const edition = requested === 'id' ? 'id' : 'en'
  const copy = COPY[edition]

  const { payload, user } = await getPayloadAndUser()

  const [plansResult, ebooksResult] = await Promise.all([
    payload.find({
      collection: 'plans',
      where: { active: { equals: true }, edition: { equals: edition } },
      sort: 'order',
      limit: 10,
      depth: 0,
      ...readAsUser(user),
    }),
    payload.find({
      collection: 'ebooks',
      sort: 'edition',
      limit: 10,
      depth: 1,
      ...readAsUser(user),
    }),
  ])

  const plans = plansResult.docs as Plan[]
  const ebooks = ebooksResult.docs as Ebook[]
  const entitled = isEntitled(user)

  // `readerUrl` is stripped by field access unless the reader is entitled, so its
  // presence is the signal that the flipbook can be offered.
  const readable = ebooks.find((book) => book.edition === edition && book.readerUrl)

  return (
    <main>
      <section className="relative overflow-hidden bg-bark-700 px-[26px] py-20">
        <div className="band-weave-vertical absolute inset-y-0 left-0 w-[9px]" />

        <div className="mx-auto grid max-w-shell grid-cols-[repeat(auto-fit,minmax(300px,1fr))] items-center gap-14">
          <div>
            <div className="crumb">
              <Link href="/" className="text-gold-light">
                Mekar Bhuana
              </Link>{' '}
              / Encyclopedia
            </div>
            <h1 className="m-0 mb-5 font-display text-[clamp(34px,5vw,66px)] leading-[1.06] text-balance text-parchment">
              Encyclopedia of Balinese Gamelan Ensembles
            </h1>
            <p className="m-0 mb-[30px] max-w-[520px] font-body text-[clamp(16px,1.5vw,19px)] leading-[1.75] font-light text-pretty text-sand">
              From ancient to contemporary, popular to extinct. Over a hundred ensembles across four
              hundred pages, read as a 3D flipbook with links out to video and audio for each one.
            </p>
            <div className="flex flex-wrap gap-3">
              {entitled && readable ? (
                <a href={readable.readerUrl!} className="btn btn-gold">
                  Start reading
                </a>
              ) : (
                <Link href={user ? '/join' : '/login'} className="btn btn-gold">
                  {user ? 'Choose a plan' : 'Login and start reading'}
                </Link>
              )}
              <Link href="#preview" className="btn btn-ghost">
                Preview a chapter
              </Link>
            </div>
          </div>

          <div className="flex gap-[18px]">
            <div className="flex-1">
              <Plate
                label="cover — English edition"
                image={ebooks.find((b) => b.edition === 'en')?.cover as Media | null}
                height={340}
              />
              <div className={coverCaption}>English</div>
            </div>
            <div className="mt-9 flex-1">
              <Plate
                label="sampul — edisi Bahasa Indonesia"
                image={ebooks.find((b) => b.edition === 'id')?.cover as Media | null}
                height={340}
              />
              <div className={coverCaption}>Bahasa</div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-cream py-20">
        <div className="mx-auto max-w-[1120px] px-[26px]">
          <div className="mb-[46px] flex w-fit border border-line-strong">
            <Link
              href="/encyclopedia"
              className={`px-7 py-[15px] font-body text-[12px] leading-none font-medium tracking-[0.13em] uppercase ${
                edition === 'en' ? 'bg-bark-450 text-bone' : 'text-soft'
              }`}
            >
              English edition
            </Link>
            <Link
              href="/encyclopedia?edition=id"
              className={`border-l border-line-strong px-7 py-[15px] font-body text-[12px] leading-none font-medium tracking-[0.13em] uppercase ${
                edition === 'id' ? 'bg-bark-450 text-bone' : 'text-soft'
              }`}
            >
              Edisi Bahasa
            </Link>
          </div>

          {entitled && (
            <div className="mb-[34px] border-l-[3px] border-sage bg-[#eef3e8] px-4 py-3.5 font-body text-sm leading-relaxed text-[#40602a]">
              Your subscription is active — you already have access to this edition.
            </div>
          )}

          {plans.length === 0 ? (
            <p className="font-body text-[17px] leading-[1.8] font-light text-muted">
              No plans are listed for this edition yet.
            </p>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-[22px]">
              {plans.map((plan) => {
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
                      <div className="absolute -top-px -right-px bg-crimson px-3 py-2 font-mono text-[9.5px] leading-none font-medium tracking-[0.16em] text-cream uppercase">
                        {plan.badge}
                      </div>
                    )}
                    <div className="font-mono text-[10px] leading-none font-medium tracking-[0.2em] text-brass uppercase">
                      {plan.name}
                    </div>
                    {wasPrice && (
                      <div className="mt-5 mb-1.5 font-body text-[15px] leading-none font-light text-[#9a8871] line-through">
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
                    <p className="mt-5 flex-1 font-body text-[14.5px] leading-[1.75] font-light text-muted">
                      {plan.description}
                    </p>
                    {promo && (
                      <div className="my-5 font-mono text-[11px] leading-relaxed text-crimson uppercase">
                        {promo}
                      </div>
                    )}
                    <Link
                      href={`/join?plan=${plan.id}`}
                      className={`btn btn-sm mt-6 ${plan.featured ? 'btn-crimson' : 'btn-dark'}`}
                    >
                      {copy.subscribe}
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
                <p className="m-0 font-body text-[14.5px] leading-[1.75] font-light text-muted">
                  {perk.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="preview" className="bg-cream-deep py-20">
        <div className="mx-auto max-w-[1120px] px-[26px]">
          <div className="mb-[34px] flex items-center gap-4">
            <span className="font-mono text-[11px] leading-none font-medium tracking-[0.3em] text-brass uppercase">
              Preview
            </span>
            <div className="h-px flex-1 bg-[#d3c4a8]" />
          </div>

          {ebooks.length === 0 ? (
            <p className="font-body text-[17px] leading-[1.8] font-light text-muted">
              A sample chapter will appear here once an edition is published.
            </p>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-[22px]">
              {ebooks.map((book) => (
                <article key={book.id} className="card p-[38px]">
                  <div className="kicker">
                    {book.edition === 'en' ? 'English' : 'Bahasa Indonesia'}
                  </div>
                  <h2 className="mt-3.5 mb-3.5 font-display text-[22px] leading-tight text-text">
                    {book.title}
                  </h2>
                  <p className="m-0 mb-5 font-body text-[15px] leading-[1.8] font-light text-muted">
                    {book.summary}
                  </p>
                  <div className="flex flex-wrap items-center gap-[18px] font-mono text-[11px] leading-relaxed tracking-[0.14em] text-smoke uppercase">
                    {book.pageCount && <span>{book.pageCount} pages</span>}
                    {book.ensembleCount && <span>{book.ensembleCount} ensembles</span>}
                  </div>
                  {book.readerUrl && (
                    <a href={book.readerUrl} className="btn btn-sm btn-dark mt-[34px]">
                      Open the flipbook
                    </a>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
