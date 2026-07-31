import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'

import { ReadIndex } from '@/components/site/ReadIndex'
import { getArticles } from '@/lib/content'

// Static; purged by Payload when an article is saved. The category filter reads
// the query string on the client, which is what keeps this page prerenderable.
export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Field notes',
  description:
    'Research, arguments and dispatches from the workshop floor — written by the people doing the restoring.',
}

export default async function ReadPage() {
  const articles = await getArticles()

  return (
    <main>
      <section className="relative overflow-hidden bg-bark-500 px-[26px] pt-[78px] pb-[66px]">
        <div className="mx-auto max-w-shell">
          <div className="crumb">
            <Link href="/" className="text-gold-light">
              Mekar Bhuana
            </Link>{' '}
            / Read
          </div>
          <h1 className="m-0 mb-5 font-display text-[clamp(38px,6vw,78px)] leading-[1.04] text-balance text-parchment">
            Field notes
          </h1>
          <p className="m-0 max-w-[540px] font-body text-[clamp(16px,1.5vw,19px)] leading-[1.75] font-normal text-pretty text-sand">
            Research, arguments and dispatches from the workshop floor — written by the people doing
            the restoring.
          </p>
        </div>
      </section>

      <section className="bg-cream py-20">
        <div className="mx-auto max-w-shell px-[26px]">
          {/* useSearchParams needs a boundary so the shell can still prerender. */}
          <Suspense fallback={<div className="min-h-[420px]" />}>
            <ReadIndex articles={articles} />
          </Suspense>

          <div className="mt-11 flex flex-wrap items-center justify-between gap-[26px] bg-bark-450 p-[38px]">
            <div>
              <div className="mb-2 font-display text-2xl leading-snug text-bone">
                E-books &amp; the Encyclopedia
              </div>
              <div className="max-w-[460px] font-body text-[15px] leading-[1.7] font-normal text-clay">
                Longer work lives behind a subscription — including the 400-page Encyclopedia of
                Balinese Gamelan Ensembles.
              </div>
            </div>
            <Link href="/encyclopedia" className="btn btn-gold">
              Subscribe to read
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
