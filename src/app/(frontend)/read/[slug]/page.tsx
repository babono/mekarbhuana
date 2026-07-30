import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ARTICLE_CATEGORIES } from '@/collections/Articles'
import { Plate } from '@/components/site/Plate'
import { isEntitled } from '@/access/entitlement'
import { getPayloadAndUser, readAsUser } from '@/lib/auth'
import { formatDate } from '@/lib/format'
import { photoFor } from '@/lib/photos'
import type { Article, Media, User } from '@/payload-types'

export const dynamic = 'force-dynamic'

/**
 * Fetched as the reader, not as the system: field-level access on `body` is what
 * enforces the paywall, and it only runs when `overrideAccess` is false.
 */
const findArticle = async (slug: string, user: User | null): Promise<Article | null> => {
  const { payload } = await getPayloadAndUser()
  const { docs } = await payload.find({
    collection: 'articles',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
    ...readAsUser(user),
  })
  return (docs[0] as Article) ?? null
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const { user } = await getPayloadAndUser()
  const article = await findArticle(slug, user)
  if (!article) return { title: 'Not found' }
  return { title: article.title, description: article.excerpt }
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { user } = await getPayloadAndUser()
  const article = await findArticle(slug, user)

  if (!article) notFound()

  const categoryLabel =
    ARTICLE_CATEGORIES.find((option) => option.value === article.category)?.label ??
    article.category

  // `body` is stripped by field-level access for unentitled readers, so an absent
  // body on a members-only article is the paywall doing its job — not missing content.
  const locked = article.access === 'members' && !isEntitled(user)

  return (
    <main>
      <section className="relative overflow-hidden bg-bark-500 px-[26px] pt-[78px] pb-[66px]">
        <div className="mx-auto max-w-shell">
          <div className="crumb">
            <Link href="/" className="text-gold-light">
              Mekar Bhuana
            </Link>{' '}
            /{' '}
            <Link href="/read" className="text-gold-light">
              Read
            </Link>{' '}
            / {categoryLabel}
          </div>
          <h1 className="m-0 mb-5 max-w-[900px] font-display text-[clamp(38px,6vw,78px)] leading-[1.04] text-balance text-parchment">
            {article.title}
          </h1>
          <div className="mt-[26px] flex flex-wrap items-center gap-[18px] font-mono text-[11px] leading-relaxed tracking-[0.14em] text-smoke uppercase">
            {article.author && <span>{article.author}</span>}
            {article.publishedAt && <span>{formatDate(article.publishedAt)}</span>}
            {article.access === 'members' && <span>Members only</span>}
          </div>
        </div>
      </section>

      <section className="bg-cream py-20">
        <div className="mx-auto max-w-shell px-[26px]">
          {article.cover || article.coverLabel ? (
            <Plate
              label={article.coverLabel ?? article.title}
              image={article.cover as Media | null}
              src={photoFor('articles', article.slug)}
              height={420}
              className="mb-14"
            />
          ) : null}

          <div
            className="max-w-[720px] font-body text-[18px] leading-[1.85] font-light text-body
              [&_blockquote]:my-8 [&_blockquote]:border-l-2 [&_blockquote]:border-gold [&_blockquote]:pl-[22px] [&_blockquote]:text-muted [&_blockquote]:italic
              [&_h2]:mt-13 [&_h2]:mb-[18px] [&_h2]:font-display [&_h2]:text-[32px] [&_h2]:leading-tight [&_h2]:text-text
              [&_h3]:mt-10 [&_h3]:mb-3.5 [&_h3]:font-display [&_h3]:text-2xl [&_h3]:leading-tight [&_h3]:text-text
              [&_li]:mb-2.5 [&_ol]:mb-6 [&_ol]:pl-6 [&_p]:mb-6 [&_p]:text-pretty [&_ul]:mb-6 [&_ul]:pl-6"
          >
            <p className="font-body text-[21px] leading-[1.75] font-light text-muted">
              {article.excerpt}
            </p>

            {article.body ? <RichText data={article.body} /> : null}
          </div>
        </div>

        {locked && (
          <div className="relative -mt-40 bg-linear-to-b from-transparent to-cream to-[130px] pt-40">
            <div className="mx-auto max-w-[640px] bg-bark-450 px-[38px] py-[46px] text-center">
              <h2 className="m-0 mb-3.5 font-display text-[28px] leading-tight text-bone">
                The rest of this is for members
              </h2>
              <p className="m-0 mb-7 font-body text-[15.5px] leading-[1.8] font-light text-clay">
                This piece sits inside the Encyclopedia subscription, alongside 400 pages on more
                than a hundred Balinese ensembles.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link href="/encyclopedia" className="btn btn-gold">
                  See the plans
                </Link>
                {!user && (
                  <Link href="/login" className="btn btn-ghost">
                    Log in
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mx-auto mt-11 max-w-shell px-[26px]">
          <Link
            href="/read"
            className="font-mono text-[11px] leading-none font-medium tracking-[0.16em] text-crimson uppercase"
          >
            ← All field notes
          </Link>
        </div>
      </section>
    </main>
  )
}
