import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import type { Payload, PayloadRequest } from 'payload'

import { ARTICLE_COPY, ENSEMBLE_COPY, PLAN_COPY, PROGRAM_COPY } from './data/oldSiteCopy'

/**
 * Replaces the launch placeholder copy with the old site's wording
 * (balimusicanddance.com): programs, featured ensembles, plan descriptions and
 * the four articles, whose real text was never imported.
 *
 * Only documents still carrying the launch placeholder are touched: each entry
 * names the placeholder (`from`) its summary, description or excerpt must still
 * equal. Anything an editor has rewritten in the admin is left alone.
 *
 * Article images are fetched from the old site and uploaded as Media. A failed
 * image is left out rather than failing the deploy.
 */

type Node = Record<string, unknown>

const extensionOf = (type: string) =>
  ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' })[type] ??
  'jpg'

async function uploadImage(
  payload: Payload,
  req: PayloadRequest,
  src: string,
  alt: string,
): Promise<number | string | null> {
  try {
    const response = await fetch(src, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const mimetype = (response.headers.get('content-type') ?? 'image/jpeg').split(';')[0]
    if (!mimetype.startsWith('image/')) throw new Error(`not an image: ${mimetype}`)
    const data = Buffer.from(await response.arrayBuffer())
    const base = decodeURIComponent(src.split('/').pop() ?? 'image').replace(/\.[a-z]+$/i, '')
    const media = await payload.create({
      collection: 'media',
      data: { alt },
      file: { data, mimetype, name: `${base}.${extensionOf(mimetype)}`, size: data.length },
      req,
    })
    return media.id
  } catch (error) {
    payload.logger.warn(`old-site copy: skipped image ${src} (${(error as Error).message})`)
    return null
  }
}

const caption = (text: string): Node => ({
  type: 'paragraph',
  format: '',
  indent: 0,
  version: 1,
  direction: 'ltr',
  textFormat: 2,
  textStyle: '',
  children: [{ type: 'text', detail: 0, format: 2, mode: 'normal', style: '', text, version: 1 }],
})

async function articleBody(
  payload: Payload,
  req: PayloadRequest,
  title: string,
  blocks: readonly Node[],
) {
  const children: Node[] = []
  for (const block of blocks) {
    if (block.type !== '__image') {
      children.push(block)
      continue
    }
    const text = String(block.caption ?? '')
    const id = await uploadImage(payload, req, String(block.src), String(block.alt || text || title))
    if (id !== null) {
      children.push({
        type: 'upload',
        relationTo: 'media',
        value: id,
        fields: null,
        format: '',
        version: 3,
        id: crypto.randomUUID().replace(/-/g, '').slice(0, 24),
      })
    }
    if (text) children.push(caption(text))
  }
  return {
    root: { type: 'root', format: '' as const, indent: 0, version: 1, direction: 'ltr' as const, children },
  }
}

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  for (const copy of PROGRAM_COPY) {
    const { docs } = await payload.find({
      collection: 'programs',
      where: { slug: { equals: copy.slug } },
      limit: 1,
      req,
    })
    const doc = docs[0]
    if (!doc || doc.summary !== copy.from) continue
    await payload.update({
      collection: 'programs',
      id: doc.id,
      data: {
        summary: copy.summary,
        body: copy.body.map((text) => ({ text })),
        note: copy.note ?? null,
      },
      req,
    })
  }

  for (const copy of ENSEMBLE_COPY) {
    const { docs } = await payload.find({
      collection: 'ensembles',
      where: { slug: { equals: copy.slug } },
      limit: 1,
      req,
    })
    const doc = docs[0]
    if (!doc || doc.description !== copy.from) continue
    await payload.update({
      collection: 'ensembles',
      id: doc.id,
      data: { name: copy.name, statusLabel: copy.statusLabel, description: copy.description },
      req,
    })
  }

  for (const copy of PLAN_COPY) {
    const { docs } = await payload.find({
      collection: 'plans',
      where: { slug: { equals: copy.slug } },
      limit: 1,
      req,
    })
    const doc = docs[0]
    if (!doc || doc.description !== copy.from) continue
    await payload.update({
      collection: 'plans',
      id: doc.id,
      data: { description: copy.to },
      req,
    })
  }

  for (const copy of ARTICLE_COPY) {
    const { docs } = await payload.find({
      collection: 'articles',
      where: { slug: { equals: copy.slug } },
      limit: 1,
      draft: false,
      req,
    })
    const doc = docs[0]
    if (!doc || doc.excerpt !== copy.from) continue
    await payload.update({
      collection: 'articles',
      id: doc.id,
      data: {
        excerpt: copy.excerpt,
        publishedAt: copy.publishedAt,
        body: await articleBody(payload, req, doc.title, copy.blocks as readonly Node[]),
      },
      draft: false,
      req,
    })
  }
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Content only: the previous copy was placeholder text, nothing to restore.
}
