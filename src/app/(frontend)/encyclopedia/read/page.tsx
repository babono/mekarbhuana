import type { Metadata } from 'next'
import Link from 'next/link'

import { isEntitled } from '@/access/entitlement'
import { Flipbook } from '@/components/site/Flipbook'
import { getMe } from '@/lib/auth'
import { getEbooks } from '@/lib/content'
import { DEFAULT_PREVIEW_PAGES, isEdition } from '@/lib/encyclopedia'

// Whether this reader sees the whole book or a preview depends on their cookie,
// so the page can never be prerendered.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Read the Encyclopedia',
  robots: { index: false },
}

export default async function ReadPage({
  searchParams,
}: {
  searchParams: Promise<{ edition?: string }>
}) {
  const { edition: raw } = await searchParams
  const edition = raw && isEdition(raw) ? raw : 'en'

  const [user, books] = await Promise.all([getMe(), getEbooks()])
  const entitled = isEntitled(user)

  const book = books.find((item) => item.edition === edition)
  const previewPages = book?.previewPages ?? DEFAULT_PREVIEW_PAGES
  const totalPages = book?.pageCount ?? 422

  return (
    <main className="min-h-screen bg-bark-700 px-[26px] py-14">
      <div className="mx-auto max-w-[1120px]">
        <div className="crumb mb-8">
          <Link href="/encyclopedia" className="text-gold-light">
            Encyclopedia
          </Link>{' '}
          / {edition === 'en' ? 'English edition' : 'Edisi Bahasa Indonesia'}
        </div>

        <div className="mb-9 flex flex-wrap items-end justify-between gap-5">
          <div>
            <h1 className="m-0 font-display text-[clamp(26px,3.4vw,40px)] leading-tight text-parchment">
              {book?.title ?? 'Encyclopedia of Balinese Gamelan Ensembles'}
            </h1>
            {!entitled && (
              <p className="mt-2.5 mb-0 font-body text-[15px] leading-relaxed text-sand">
                You are reading a {previewPages}-page preview.{' '}
                <Link href="/encyclopedia#plans" className="text-gold-light underline">
                  Subscribe
                </Link>{' '}
                to open all {totalPages} pages.
              </p>
            )}
          </div>

          <div className="flex gap-2">
            {(['en', 'id'] as const).map((value) => (
              <Link
                key={value}
                href={`/encyclopedia/read?edition=${value}`}
                className={`border px-4 py-2.5 font-label text-[10px] leading-none tracking-[0.16em] uppercase transition-colors ${
                  value === edition
                    ? 'border-gold-light text-gold-light'
                    : 'border-gold-light/30 text-sand hover:border-gold-light hover:text-gold-light'
                }`}
              >
                {value === 'en' ? 'English' : 'Bahasa'}
              </Link>
            ))}
          </div>
        </div>

        <Flipbook
          // Keyed so switching edition tears the reader down rather than trying
          // to swap the document underneath pdf.js.
          key={edition}
          src={`/encyclopedia/file/${edition}`}
          entitled={entitled}
          totalPages={totalPages}
          title={book?.title ?? 'the encyclopedia'}
        />
      </div>
    </main>
  )
}
