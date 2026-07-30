import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'

import { EditionPlans } from '@/components/site/EditionPlans'
import { EncyclopediaCta } from '@/components/site/EncyclopediaCta'
import { Plate } from '@/components/site/Plate'
import { getEbooks, getPlans } from '@/lib/content'
import type { Ebook, Media, Plan } from '@/payload-types'

// Static; purged by Payload when a plan or e-book is saved. The reader-specific
// parts live in <EncyclopediaCta>, which runs on the client.
export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Encyclopedia of Balinese Gamelan Ensembles',
  description:
    'Over a hundred ensembles across four hundred pages, read as a flipbook in English or Bahasa Indonesia.',
}

const coverCaption =
  'mt-3 text-center font-mono text-xs leading-relaxed tracking-[0.1em] text-dust uppercase'

export default async function EncyclopediaPage() {
  // Both editions are prerendered; the switch happens on the client.
  const [plansEn, plansId, ebooks] = await Promise.all([
    getPlans('en'),
    getPlans('id'),
    getEbooks(),
  ])

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
            <Suspense fallback={<div className="h-[62px]" />}>
              <EncyclopediaCta />
            </Suspense>
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
          <Suspense fallback={<div className="min-h-[420px]" />}>
            <EditionPlans plans={{ en: plansEn, id: plansId }} />
          </Suspense>
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
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
