import { unstable_cache } from 'next/cache'

import { getPayloadClient } from '@/lib/auth'
import type { Article, Ebook, Ensemble, Plan, Program } from '@/payload-types'

/**
 * Cache tags, one per collection. Payload's hooks purge these on save, so a
 * statically rendered page picks up an edit within a second or two instead of
 * waiting for its revalidate window.
 */
export const TAGS = {
  articles: 'articles',
  ebooks: 'ebooks',
  ensembles: 'ensembles',
  plans: 'plans',
  programs: 'programs',
} as const

export type ContentTag = (typeof TAGS)[keyof typeof TAGS]

/**
 * These run outside a request, so there is no user to check access against and
 * `overrideAccess` defaults to true. Every query below therefore filters to
 * published documents explicitly — relying on access control here would quietly
 * bake drafts into a public page.
 *
 * Nothing gated is fetched through this module. Paywalled fields stay on the
 * dynamic routes, where the reader's own permissions apply.
 */

export const getPrograms = unstable_cache(
  async (): Promise<Program[]> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'programs',
      sort: 'order',
      limit: 20,
      depth: 1,
    })
    return docs as Program[]
  },
  ['programs'],
  { tags: [TAGS.programs] },
)

export const getFeaturedEnsembles = unstable_cache(
  async (): Promise<Ensemble[]> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'ensembles',
      where: { featured: { equals: true } },
      sort: 'order',
      limit: 3,
      depth: 1,
    })
    return docs as Ensemble[]
  },
  ['ensembles-featured'],
  { tags: [TAGS.ensembles] },
)

export const getPlans = unstable_cache(
  async (edition: 'en' | 'id'): Promise<Plan[]> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'plans',
      where: { active: { equals: true }, edition: { equals: edition } },
      sort: 'order',
      limit: 10,
      depth: 0,
    })
    return docs as Plan[]
  },
  ['plans'],
  { tags: [TAGS.plans] },
)

/** Cheapest active plan for the price teaser on the home page. */
export const getEntryPlan = unstable_cache(
  async (): Promise<Plan | null> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'plans',
      where: { active: { equals: true }, edition: { equals: 'en' } },
      sort: 'durationMonths',
      limit: 1,
      depth: 0,
    })
    return (docs[0] as Plan) ?? null
  },
  ['plan-entry'],
  { tags: [TAGS.plans] },
)

/**
 * E-books without `readerUrl` — that field is the paid product and is stripped
 * by field-level access for unentitled readers. It must never enter a cache that
 * is shared by everyone, so it is left out at the query level too.
 */
export const getEbooks = unstable_cache(
  async (): Promise<Ebook[]> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'ebooks',
      where: { _status: { equals: 'published' } },
      sort: 'edition',
      limit: 10,
      depth: 1,
      select: {
        title: true,
        slug: true,
        edition: true,
        summary: true,
        cover: true,
        coverLabel: true,
        pageCount: true,
        ensembleCount: true,
      },
    })
    return docs as Ebook[]
  },
  ['ebooks'],
  { tags: [TAGS.ebooks] },
)

/** Article list for the Read index. Bodies are never included. */
export const getArticles = unstable_cache(
  async (category?: string): Promise<Article[]> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'articles',
      where: {
        _status: { equals: 'published' },
        ...(category ? { category: { equals: category } } : {}),
      },
      sort: '-publishedAt',
      limit: 30,
      depth: 1,
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
    })
    return docs as Article[]
  },
  ['articles'],
  { tags: [TAGS.articles] },
)
