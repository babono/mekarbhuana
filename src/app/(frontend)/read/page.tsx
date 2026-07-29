import type { Metadata } from 'next'
import Link from 'next/link'

import { Plate } from '@/components/site/Plate'
import { ARTICLE_CATEGORIES } from '@/collections/Articles'
import { getPayloadAndUser, readAsUser } from '@/lib/auth'
import type { Article, Media } from '@/payload-types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Field notes',
  description:
    'Research, arguments and dispatches from the workshop floor — written by the people doing the restoring.',
}

const categoryLabel = (value: string) =>
  ARTICLE_CATEGORIES.find((option) => option.value === value)?.label ?? value

const articleKicker = (article: Article) =>
  [categoryLabel(article.category), article.partLabel].filter(Boolean).join(' · ')

const chip =
  'border px-5 py-3 font-mono text-[11px] leading-none font-medium tracking-[0.14em] uppercase transition-colors'
const chipIdle = 'border-line-strong text-soft hover:border-gold hover:text-crimson'
const chipActive = 'border-bark-450 bg-bark-450 text-bone'

export default async function ReadPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  const { payload, user } = await getPayloadAndUser()

  const isKnownCategory = ARTICLE_CATEGORIES.some((option) => option.value === category)
  const activeCategory = isKnownCategory ? category : undefined

  const { docs } = await payload.find({
    collection: 'articles',
    where: activeCategory ? { category: { equals: activeCategory } } : {},
    sort: '-publishedAt',
    limit: 30,
    depth: 1,
    // The index never renders bodies; leaving them out keeps the payload small.
    select: {
      title: true,
      slug: true,
      category: true,
      partLabel: true,
      excerpt: true,
      cover: true,
      coverLabel: true,
      access: true,
      featured: true,
      publishedAt: true,
    },
    ...readAsUser(user),
  })

  const articles = docs as Article[]

  // The newest featured article leads the page; everything else follows in the grid.
  // When a filter is applied nothing is promoted — the reader asked for a list.
  const lead = activeCategory ? null : (articles.find((article) => article.featured) ?? null)
  const rest = lead ? articles.filter((article) => article.id !== lead.id) : articles

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
          <p className="m-0 max-w-[540px] font-body text-[clamp(16px,1.5vw,19px)] leading-[1.75] font-light text-pretty text-sand">
            Research, arguments and dispatches from the workshop floor — written by the people doing
            the restoring.
          </p>
        </div>
      </section>

      <section className="bg-cream py-20">
        <div className="mx-auto max-w-shell px-[26px]">
          <div className="mb-11 flex flex-wrap gap-2">
            <Link href="/read" className={`${chip} ${!activeCategory ? chipActive : chipIdle}`}>
              All
            </Link>
            {ARTICLE_CATEGORIES.map((option) => (
              <Link
                key={option.value}
                href={`/read?category=${option.value}`}
                className={`${chip} ${activeCategory === option.value ? chipActive : chipIdle}`}
              >
                {option.label}
              </Link>
            ))}
            <Link href="/encyclopedia" className={`${chip} ${chipIdle}`}>
              E-books
            </Link>
          </div>

          {articles.length === 0 && (
            <p className="font-body text-[17px] leading-[1.8] font-light text-muted">
              Nothing published here yet.{' '}
              {activeCategory && <Link href="/read">See all field notes</Link>}
            </p>
          )}

          {lead && (
            <Link
              href={`/read/${lead.slug}`}
              className="mb-[22px] grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] items-center gap-11 border border-line bg-paper text-inherit transition-colors hover:border-gold hover:text-inherit"
            >
              <Plate
                label={lead.coverLabel ?? lead.title}
                image={lead.cover as Media | null}
                height={380}
                flush
                style={{ height: '100%', minHeight: 380 }}
              />
              <div className="p-[38px]">
                <div className="kicker mb-4 text-crimson">Featured · {articleKicker(lead)}</div>
                <h2 className="m-0 mb-4 font-display text-[clamp(24px,2.8vw,36px)] leading-tight text-balance text-text">
                  {lead.title}
                </h2>
                <p className="m-0 mb-[22px] font-body text-[15.5px] leading-[1.8] font-light text-muted">
                  {lead.excerpt}
                </p>
                <span className="font-mono text-[11px] leading-none font-medium tracking-[0.16em] text-crimson uppercase">
                  Read the article →
                </span>
              </div>
            </Link>
          )}

          <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-[22px]">
            {rest.map((article) => (
              <Link
                key={article.id}
                href={`/read/${article.slug}`}
                className="card block text-inherit transition-colors hover:border-gold hover:text-inherit"
              >
                <Plate
                  label={article.coverLabel ?? article.title}
                  image={article.cover as Media | null}
                  height={190}
                  flush
                />
                <div className="p-7">
                  <div className="kicker mb-3.5">
                    {articleKicker(article)}
                    {article.access === 'members' && ' · Members'}
                  </div>
                  <h3 className="m-0 mb-3.5 font-display text-[21px] leading-tight text-text">
                    {article.title}
                  </h3>
                  <p className="m-0 font-body text-[14.5px] leading-[1.75] font-light text-muted">
                    {article.excerpt}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-11 flex flex-wrap items-center justify-between gap-[26px] bg-bark-450 p-[38px]">
            <div>
              <div className="mb-2 font-display text-2xl leading-snug text-bone">
                E-books &amp; the Encyclopedia
              </div>
              <div className="max-w-[460px] font-body text-[15px] leading-[1.7] font-light text-clay">
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
