'use client'

import type { PDFDocumentLoadingTask, PDFDocumentProxy } from 'pdfjs-dist'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import HTMLFlipBook from 'react-pageflip'

/** Rendered page width in CSS pixels; the height follows the PDF's own aspect. */
const PAGE_WIDTH = 460
const PAGE_HEIGHT = 640

/** How many pages either side of the spread to rasterise ahead of the reader. */
const LOOKAHEAD = 3

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

  const canvases = useRef(new Map<number, HTMLCanvasElement>())
  const drawn = useRef(new Set<number>())
  const book = useRef<{ pageFlip: () => { flipNext: () => void; flipPrev: () => void } } | null>(
    null,
  )

  useEffect(() => {
    let cancelled = false
    let task: PDFDocumentLoadingTask | null = null

    const load = async () => {
      // Imported here rather than at module scope: pdf.js touches DOM globals
      // and must not be pulled into the server bundle.
      const pdfjs = await import('pdfjs-dist')
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

      task = pdfjs.getDocument({ url: src, withCredentials: true })
      try {
        const loaded = await task.promise
        if (cancelled) return
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

  const draw = useCallback(
    async (index: number) => {
      const canvas = canvases.current.get(index)
      if (!doc || !canvas || drawn.current.has(index)) return
      drawn.current.add(index)

      try {
        const page = await doc.getPage(index + 1)
        const base = page.getViewport({ scale: 1 })
        // Rasterise at device resolution so the type stays crisp on retina.
        const ratio = Math.min(window.devicePixelRatio || 1, 2)
        const viewport = page.getViewport({ scale: (PAGE_WIDTH / base.width) * ratio })

        canvas.width = viewport.width
        canvas.height = viewport.height

        await page.render({ canvas, viewport }).promise
      } catch {
        // A page that fails to draw stays blank rather than taking down the book.
        drawn.current.delete(index)
      }
    },
    [doc],
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
    return (
      <div className="flex min-h-[520px] items-center justify-center">
        <span className="font-label text-[10px] leading-none tracking-[0.24em] text-dust uppercase">
          Opening {title}…
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
        height={PAGE_HEIGHT}
        size="stretch"
        minWidth={280}
        maxWidth={640}
        minHeight={380}
        maxHeight={900}
        startPage={0}
        drawShadow
        flippingTime={800}
        usePortrait
        startZIndex={0}
        autoSize
        maxShadowOpacity={0.5}
        showCover
        mobileScrollSupport
        clickEventForward={false}
        useMouseEvents
        swipeDistance={30}
        showPageCorners
        disableFlipByClick={false}
        onFlip={(event: { data: number }) => setCurrent(event.data)}
      >
        {Array.from({ length: pageCount }, (_, index) => (
          <div key={index} className="bg-paper">
            <canvas
              ref={(element) => {
                // Braces matter: a ref callback that returns a value is treated
                // as a cleanup function in React 19.
                if (element) canvases.current.set(index, element)
                else canvases.current.delete(index)
              }}
              className="block h-full w-full"
            />
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
