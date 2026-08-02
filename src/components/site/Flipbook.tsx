'use client'

import type { PDFDocumentLoadingTask, PDFDocumentProxy } from 'pdfjs-dist'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import HTMLFlipBook from 'react-pageflip'

/** Rendered page width in CSS pixels. Height comes from the PDF's own aspect. */
const PAGE_WIDTH = 460

/** How many pages either side of the spread to rasterise ahead of the reader. */
const LOOKAHEAD = 3

/** Schemes we are willing to follow out of a PDF. Anything else is dropped. */
const SAFE_SCHEMES = ['http:', 'https:', 'mailto:']

/**
 * A clickable region lifted out of the PDF, measured as a percentage of the
 * page box so it keeps its place at any rendered size.
 */
type LinkBox = {
  left: number
  top: number
  width: number
  height: number
  url?: string
  target?: number
}

type PageFlipApi = {
  flipNext: () => void
  flipPrev: () => void
  flip: (page: number) => void
}

type Props = {
  /** The gated endpoint. Serves the full book or the preview slice, per reader. */
  src: string
  /** True when the reader's subscription is active. Presentation only — the
   *  server decides what bytes to send; this just explains why it ended. */
  entitled: boolean
  /** Length of the whole edition, for the "you have seen 12 of 422" message. */
  totalPages: number
  title: string
}

/**
 * The Encyclopedia reader.
 *
 * pdf.js parses the document in a worker and each page is rasterised to its own
 * canvas, which react-pageflip then turns. Only the pages near the current
 * spread are drawn: the canvases all exist from the start (so the book has its
 * true length and the flip physics are right) but stay blank until the reader
 * approaches them, which keeps 422 pages off the GPU.
 */
export function Flipbook({ src, entitled, totalPages, title }: Props) {
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null)
  const [pageCount, setPageCount] = useState(0)
  const [current, setCurrent] = useState(0)
  const [error, setError] = useState<string | null>(null)

  /** 0–1 while the document downloads; drives the opening progress bar. */
  const [progress, setProgress] = useState(0)
  /** Page height as a multiple of its width, taken from the document itself. */
  const [aspect, setAspect] = useState(1.4)
  /** Pages whose canvas has finished drawing, so the placeholder can lift. */
  const [ready, setReady] = useState<ReadonlySet<number>>(new Set())
  /** Link regions per page, extracted alongside the raster. */
  const [links, setLinks] = useState<ReadonlyMap<number, LinkBox[]>>(new Map())

  const canvases = useRef(new Map<number, HTMLCanvasElement>())
  const drawing = useRef(new Set<number>())
  const book = useRef<{ pageFlip: () => PageFlipApi } | null>(null)

  useEffect(() => {
    let cancelled = false
    let task: PDFDocumentLoadingTask | null = null

    const load = async () => {
      // Imported here rather than at module scope: pdf.js touches DOM globals
      // and must not be pulled into the server bundle.
      const pdfjs = await import('pdfjs-dist')
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

      task = pdfjs.getDocument({ url: src, withCredentials: true })
      task.onProgress = ({ loaded, total }: { loaded: number; total: number }) => {
        if (!cancelled && total > 0) setProgress(Math.min(loaded / total, 1))
      }

      try {
        const loaded = await task.promise
        if (cancelled) return

        // Size the book to the document rather than guessing, so pages are not
        // stretched to fit a hardcoded box.
        const first = await loaded.getPage(1)
        const view = first.getViewport({ scale: 1 })
        if (cancelled) return

        setAspect(view.height / view.width)
        setDoc(loaded)
        setPageCount(loaded.numPages)
      } catch {
        if (!cancelled) setError('The reader could not open this edition.')
      }
    }

    void load()
    return () => {
      cancelled = true
      // Tearing down the loading task also disposes the document and its worker.
      void task?.destroy()
    }
  }, [src])

  /** Resolve a PDF destination to a zero-based page index. */
  const destinationPage = useCallback(
    async (document: PDFDocumentProxy, dest: unknown): Promise<number | undefined> => {
      try {
        const resolved = typeof dest === 'string' ? await document.getDestination(dest) : dest
        const ref = Array.isArray(resolved) ? resolved[0] : null
        if (!ref) return undefined
        return await document.getPageIndex(ref as Parameters<typeof document.getPageIndex>[0])
      } catch {
        return undefined
      }
    },
    [],
  )

  const draw = useCallback(
    async (index: number) => {
      const canvas = canvases.current.get(index)
      if (!doc || !canvas || drawing.current.has(index)) return
      drawing.current.add(index)

      try {
        const page = await doc.getPage(index + 1)
        const base = page.getViewport({ scale: 1 })
        // Rasterise at device resolution so the type stays crisp on retina.
        const ratio = Math.min(window.devicePixelRatio || 1, 2)
        const viewport = page.getViewport({ scale: (PAGE_WIDTH / base.width) * ratio })

        canvas.width = viewport.width
        canvas.height = viewport.height
        await page.render({ canvas, viewport }).promise

        // Links are measured against the unscaled page and stored as
        // percentages, so the overlay tracks whatever size the book is drawn at.
        const annotations = await page.getAnnotations({ intent: 'display' })
        const boxes: LinkBox[] = []

        for (const annotation of annotations) {
          if (annotation.subtype !== 'Link') continue

          // pdfjs 6 dropped convertToViewportRectangle; converting the two
          // corners does the same job and still respects page rotation.
          const [x1, y1] = base.convertToViewportPoint(annotation.rect[0], annotation.rect[1])
          const [x2, y2] = base.convertToViewportPoint(annotation.rect[2], annotation.rect[3])
          const box = {
            left: (Math.min(x1, x2) / base.width) * 100,
            top: (Math.min(y1, y2) / base.height) * 100,
            width: (Math.abs(x2 - x1) / base.width) * 100,
            height: (Math.abs(y2 - y1) / base.height) * 100,
          }

          if (annotation.url) {
            // A PDF is untrusted content: only follow schemes that cannot run code.
            try {
              if (SAFE_SCHEMES.includes(new URL(annotation.url).protocol)) {
                boxes.push({ ...box, url: annotation.url })
              }
            } catch {
              // Unparseable href — drop it.
            }
          } else if (annotation.dest) {
            const target = await destinationPage(doc, annotation.dest)
            if (target !== undefined) boxes.push({ ...box, target })
          }
        }

        setReady((previous) => new Set(previous).add(index))
        if (boxes.length > 0) {
          setLinks((previous) => new Map(previous).set(index, boxes))
        }
      } catch {
        // A page that fails to draw stays blank rather than taking down the book.
        drawing.current.delete(index)
      }
    },
    [doc, destinationPage],
  )

  useEffect(() => {
    if (!doc) return
    for (let index = current - LOOKAHEAD; index <= current + LOOKAHEAD + 1; index += 1) {
      if (index >= 0 && index < pageCount) void draw(index)
    }
  }, [doc, current, pageCount, draw])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') book.current?.pageFlip()?.flipNext()
      if (event.key === 'ArrowLeft') book.current?.pageFlip()?.flipPrev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (error) {
    return (
      <p className="mx-auto max-w-[420px] text-center font-body text-[15px] leading-relaxed text-sand">
        {error}
      </p>
    )
  }

  if (!doc) {
    const percent = Math.round(progress * 100)
    return (
      <div className="flex min-h-[520px] flex-col items-center justify-center gap-4">
        <span className="font-label text-[10px] leading-none tracking-[0.24em] text-dust uppercase">
          Opening {title}
        </span>
        <div
          className="h-[3px] w-[220px] overflow-hidden bg-bark-600"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Loading the encyclopedia"
        >
          <div
            className="h-full bg-gold-light transition-[width] duration-200 ease-out"
            style={{ width: `${Math.max(percent, 4)}%` }}
          />
        </div>
        <span className="font-label text-[9px] leading-none tracking-[0.2em] text-shadow uppercase">
          {percent}%
        </span>
      </div>
    )
  }

  const atEnd = current >= pageCount - 2

  return (
    <div className="flex flex-col items-center">
      <HTMLFlipBook
        ref={book}
        className="encyclopedia-book"
        style={{}}
        width={PAGE_WIDTH}
        height={Math.round(PAGE_WIDTH * aspect)}
        size="stretch"
        minWidth={280}
        maxWidth={640}
        minHeight={Math.round(280 * aspect)}
        maxHeight={Math.round(640 * aspect)}
        startPage={0}
        drawShadow
        flippingTime={800}
        usePortrait
        startZIndex={0}
        autoSize
        maxShadowOpacity={0.5}
        showCover
        mobileScrollSupport
        // Lets a click on an <a> or <button> do its own thing instead of
        // turning the page — this is what makes the PDF's links reachable.
        clickEventForward
        useMouseEvents
        swipeDistance={30}
        showPageCorners
        disableFlipByClick={false}
        onFlip={(event: { data: number }) => setCurrent(event.data)}
      >
        {Array.from({ length: pageCount }, (_, index) => (
          <div key={index} className="relative bg-paper">
            <canvas
              ref={(element) => {
                // Braces matter: a ref callback that returns a value is treated
                // as a cleanup function in React 19.
                if (element) canvases.current.set(index, element)
                else canvases.current.delete(index)
              }}
              className="block h-full w-full"
            />

            {!ready.has(index) && (
              <div className="absolute inset-0 grid place-items-center bg-paper">
                <span
                  className="size-6 animate-spin rounded-full border-2 border-line-strong border-t-gold"
                  aria-hidden="true"
                />
                <span className="sr-only">Rendering page {index + 1}</span>
              </div>
            )}

            {(links.get(index) ?? []).map((box, i) => {
              const position = {
                left: `${box.left}%`,
                top: `${box.top}%`,
                width: `${box.width}%`,
                height: `${box.height}%`,
              }

              return box.url ? (
                <a
                  key={i}
                  href={box.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute rounded-[2px] transition-colors hover:bg-gold/20"
                  style={position}
                  title={box.url}
                />
              ) : (
                <button
                  key={i}
                  type="button"
                  onClick={() => book.current?.pageFlip()?.flip(box.target as number)}
                  className="absolute cursor-pointer rounded-[2px] border-0 bg-transparent p-0 transition-colors hover:bg-gold/20"
                  style={position}
                  aria-label={`Go to page ${(box.target ?? 0) + 1}`}
                />
              )
            })}
          </div>
        ))}
      </HTMLFlipBook>

      <div className="mt-6 flex items-center gap-5">
        <button
          type="button"
          onClick={() => book.current?.pageFlip()?.flipPrev()}
          className="btn btn-sm btn-ghost"
        >
          Previous
        </button>
        <span className="font-label text-[10px] leading-none tracking-[0.2em] text-dust uppercase">
          {Math.min(current + 1, pageCount)} / {pageCount}
          {!entitled && ` of ${totalPages}`}
        </span>
        <button
          type="button"
          onClick={() => book.current?.pageFlip()?.flipNext()}
          className="btn btn-sm btn-ghost"
        >
          Next
        </button>
      </div>

      {!entitled && atEnd && (
        <div className="mt-8 max-w-[440px] border border-gold/40 bg-bark-600 px-7 py-6 text-center">
          <div className="kicker mb-3 text-gold-light">End of preview</div>
          <p className="mb-5 font-body text-[15px] leading-[1.75] text-sand">
            You have read {pageCount} of {totalPages} pages. A subscription opens the rest of
            the encyclopedia, in both editions.
          </p>
          <Link href="/encyclopedia#plans" className="btn btn-sm btn-gold">
            Choose a plan
          </Link>
        </div>
      )}
    </div>
  )
}
