import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { PDFDocument } from 'pdf-lib'

export type Edition = 'en' | 'id'

/**
 * Master PDFs, keyed by edition.
 *
 * These live in `private/` rather than `public/` deliberately: anything under
 * `public/` is served verbatim by Next at a guessable URL, which would hand the
 * whole book to anyone who asked and make the subscription decorative. The only
 * way to these bytes is the route handler at `/encyclopedia/file/[edition]`,
 * which checks entitlement first.
 *
 * Both editions point at the English file until the Bahasa translation is
 * ready — swap the `id` entry when it lands, nothing else needs to change.
 */
const FILES: Record<Edition, string> = {
  en: 'encyclopedia-eng.pdf',
  id: 'encyclopedia-eng.pdf',
}

/** Used when an e-book document does not set its own preview length. */
export const DEFAULT_PREVIEW_PAGES = 12

export const isEdition = (value: string): value is Edition => value === 'en' || value === 'id'

/** Absolute path to an edition's master PDF. Never expose this to the client. */
export const editionPath = (edition: Edition): string =>
  path.join(process.cwd(), 'private', FILES[edition])

/**
 * Preview slices, keyed by edition and length.
 *
 * Building one costs a full parse of a 30MB document (~600ms), so the result is
 * held for the life of the server process. The key includes the page count so
 * that changing `previewPages` in the admin panel takes effect rather than
 * being masked by a stale entry.
 */
const previewCache = new Map<string, Uint8Array>()

/**
 * The first `pages` pages of an edition, as a standalone PDF.
 *
 * The slice happens on the server so that an unentitled reader never receives
 * the bytes of a page they have not paid for — truncating in the browser would
 * mean shipping the whole book and hiding most of it.
 */
export const previewBytes = async (edition: Edition, pages: number): Promise<Uint8Array> => {
  const key = `${edition}:${pages}`
  const cached = previewCache.get(key)
  if (cached) return cached

  const source = await PDFDocument.load(await readFile(editionPath(edition)), {
    updateMetadata: false,
  })

  const count = Math.max(1, Math.min(pages, source.getPageCount()))
  const preview = await PDFDocument.create()
  const copied = await preview.copyPages(
    source,
    Array.from({ length: count }, (_, index) => index),
  )
  copied.forEach((page) => preview.addPage(page))

  const bytes = await preview.save()
  previewCache.set(key, bytes)
  return bytes
}
