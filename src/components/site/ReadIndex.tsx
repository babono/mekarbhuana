'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import { ARTICLE_CATEGORIES } from '@/collections/Articles'
import { Plate } from '@/components/site/Plate'
import type { Article, Media } from '@/payload-types'

const chip =
  'border px-5 py-3 font-mono text-[11px] leading-none font-medium tracking-[0.14em] uppercase transition-colors'
const chipIdle = 'border-line-strong text-soft hover:border-gold hover:text-crimson'
const chipActive = 'border-bark-450 bg-bark-450 text-bone'

const categoryLabel = (value: string) =>
  ARTICLE_CATEGORIES.find((option) => option.value === value)?.label ?? value

const articleKicker = (article: Article) =>
  [categoryLabel(article.category), article.partLabel].filter(Boolean).join(' · ')

/**
 * The Read index list and its category filter.
 *
 * Reading `?category=` here rather than in the page keeps /read statically
 * prerendered — `searchParams` on a server component opts the route into dynamic
 * rendering, while `useSearchParams` in a client component does not. Filtered
 * URLs stay shareable, and the filtering itself is instant since the full list
 * is already in the payload.
 */
export function ReadIndex({ articles }: { articles: Article[] }) {
  const params = useSearchParams()
  const requested = params.get('category') ?? undefined
  const activeCategory = ARTICLE_CATEGORIES.some((o) => o.value === requested)
    ? requested
    : undefined

  const visible = activeCategory
    ? articles.filter((a) => a.category === activeCategory)
    : articles

  // Nothing is promoted while a filter is applied — the reader asked for a list.
  const lead = activeCategory ? null : (visible.find((a) => a.featured) ?? null)
  const rest = lead ? visible.filter((a) => a.id !== lead.id) : visible

  return (
    <>
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

      {visible.length === 0 && (
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
    </>
  )
}
