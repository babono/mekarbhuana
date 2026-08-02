import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { Readable } from 'node:stream'

import { isEntitled } from '@/access/entitlement'
import { getPayloadAndUser } from '@/lib/auth'
import { getEbooks } from '@/lib/content'
import { DEFAULT_PREVIEW_PAGES, editionPath, isEdition, previewBytes } from '@/lib/encyclopedia'

// Entitlement is per-reader, so this can never be prerendered or shared.
export const dynamic = 'force-dynamic'

/** `bytes=start-end`, resolved against a known size. Null when absent or unusable. */
const parseRange = (header: string | null, size: number): { start: number; end: number } | null => {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header?.trim() ?? '')
  if (!match) return null

  const [, rawStart, rawEnd] = match
  // A suffix range (`bytes=-500`) asks for the last N bytes.
  const start = rawStart === '' ? size - Number(rawEnd) : Number(rawStart)
  const end = rawStart === '' || rawEnd === '' ? size - 1 : Number(rawEnd)

  if (!Number.isFinite(start) || !Number.isFinite(end)) return null
  if (start < 0 || end >= size || start > end) return null
  return { start, end }
}

/**
 * The Encyclopedia PDF, gated on subscription.
 *
 * One URL serves two different documents: subscribers get the full book, and
 * everyone else gets a short preview slice built on the server. That means the
 * response varies by cookie, so it must never be stored by a shared cache —
 * a CDN that cached a subscriber's response would serve the whole book to the
 * next anonymous visitor. Hence `private, no-store` plus `Vary: Cookie` on
 * every path through this handler.
 *
 * Range requests are honoured so that pdf.js can fetch pages as the reader
 * turns them instead of pulling 30MB up front.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ edition: string }> },
): Promise<Response> {
  const { edition } = await params
  if (!isEdition(edition)) return new Response('Not found', { status: 404 })

  const { user } = await getPayloadAndUser()
  const entitled = isEntitled(user)

  const headers = new Headers({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `inline; filename="encyclopedia-${edition}.pdf"`,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'private, no-store, must-revalidate',
    Vary: 'Cookie',
    // The bytes are the product; do not let another origin frame or sniff them.
    'X-Content-Type-Options': 'nosniff',
  })

  const rangeHeader = request.headers.get('range')

  if (entitled) {
    const filePath = editionPath(edition)
    const { size } = await stat(filePath)
    const range = parseRange(rangeHeader, size)

    if (rangeHeader && !range) {
      headers.set('Content-Range', `bytes */${size}`)
      return new Response(null, { status: 416, headers })
    }

    const { start, end } = range ?? { start: 0, end: size - 1 }
    headers.set('Content-Length', String(end - start + 1))
    if (range) headers.set('Content-Range', `bytes ${start}-${end}/${size}`)

    const stream = Readable.toWeb(
      createReadStream(filePath, { start, end }),
    ) as unknown as ReadableStream

    return new Response(stream, { status: range ? 206 : 200, headers })
  }

  // Not entitled: build (or reuse) the preview slice and serve only that.
  const books = await getEbooks()
  const pages =
    books.find((book) => book.edition === edition)?.previewPages ?? DEFAULT_PREVIEW_PAGES

  const bytes = await previewBytes(edition, pages)
  const size = bytes.byteLength
  const range = parseRange(rangeHeader, size)

  if (rangeHeader && !range) {
    headers.set('Content-Range', `bytes */${size}`)
    return new Response(null, { status: 416, headers })
  }

  const { start, end } = range ?? { start: 0, end: size - 1 }
  headers.set('Content-Length', String(end - start + 1))
  if (range) headers.set('Content-Range', `bytes ${start}-${end}/${size}`)

  // `slice` copies, so the cached buffer is never handed out by reference.
  const body = bytes.slice(start, end + 1)
  return new Response(body as unknown as BodyInit, { status: range ? 206 : 200, headers })
}
