'use client'

import type { PDFDocumentProxy, PDFDocumentLoadingTask } from 'pdfjs-dist'
import Link from 'next/link'
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
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
  turnToPage: (page: number) => void
}

/**
 * Pages read their state from context rather than props.
 *
 * react-pageflip clones the children it is given into its own state and, with
 * `renderOnlyPageLengthChange` set, deliberately stops refreshing them — so the
 * props captured at clone time never change again. Context sidesteps that
 * entirely: the page components stay mounted and subscribed, so they still hear
 * about the reader turning a page.
 */
const ReaderContext = createContext<{
  doc: PDFDocumentProxy | null
  current: number
  goTo: (index: number) => void
}>({ doc: null, current: 0, goTo: () => {} })

/** Resolve a PDF destination to a zero-based page index. */
const destinationPage = async (
  document: PDFDocumentProxy,
  dest: unknown,
): Promise<number | undefined> => {
  try {
    const resolved = typeof dest === 'string' ? await document.getDestination(dest) : dest
    const ref = Array.isArray(resolved) ? resolved[0] : null
    if (!ref) return undefined
    return await document.getPageIndex(ref as Parameters<typeof document.getPageIndex>[0])
  } catch {
    return undefined
  }
}

/**
 * One leaf of the book: a canvas, a placeholder until it is drawn, and the
 * page's own links laid over the top.
 *
 * It owns its raster state so that finishing a page cannot disturb the book —
 * lifting this into the parent is what previously re-created every canvas.
 * The forwarded ref matters: react-pageflip clones each child to attach its own
 * ref, and needs a real DOM node back.
 */
const FlipPage = forwardRef<HTMLDivElement, { index: number }>(function FlipPage({ index }, ref) {
  const { doc, current, goTo } = useContext(ReaderContext)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)
  const [links, setLinks] = useState<LinkBox[]>([])
  // Which document this canvas holds, so a re-mount or a new edition redraws.
  const painted = useRef<PDFDocumentProxy | null>(null)

  const active = Math.abs(index - current) <= LOOKAHEAD + 1

  useEffect(() => {
    if (!doc || !active || painted.current === doc) return

    let cancelled = false
    let task: { cancel: () => void } | null = null

    const render = async () => {
      const canvas = canvasRef.current
      if (!canvas) return

      try {
        const page = await doc.getPage(index + 1)
        // Bail before touching the canvas, not after. A run that has already
        // been cancelled must never start a render: pdf.js allows only one at a
        // time per canvas, and the second one throws for both.
        if (cancelled) return

        const base = page.getViewport({ scale: 1 })
        // Rasterise at device resolution so the type stays crisp on retina.
        const ratio = Math.min(window.devicePixelRatio || 1, 2)
        const viewport = page.getViewport({ scale: (PAGE_WIDTH / base.width) * ratio })

        canvas.width = viewport.width
        canvas.height = viewport.height

        const rendering = page.render({ canvas, viewport })
        task = rendering
        await rendering.promise
        if (cancelled) return

        // Marked only once the pixels are actually down. Claiming the page
        // earlier means a run cancelled mid-flight — which is exactly what
        // StrictMode's double effect does — blocks the run that replaces it,
        // leaving a painted canvas the component never admits is ready.
        painted.current = doc

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

        if (cancelled) return
        setReady(true)
        if (boxes.length > 0) setLinks(boxes)
      } catch {
        // Let a failed page be retried rather than leaving it blank for good.
        painted.current = null
      }
    }

    void render()
    return () => {
      cancelled = true
      // pdf.js refuses to draw the same canvas twice at once, so the outgoing
      // run has to be stopped before its replacement starts.
      task?.cancel()
    }
  }, [doc, active, index])

  return (
    <div ref={ref} className="relative bg-paper">
      <canvas ref={canvasRef} className="block h-full w-full" />

      {!ready && (
        <div className="absolute inset-0 grid place-items-center bg-paper">
          <span
            className="size-6 animate-spin rounded-full border-2 border-line-strong border-t-gold"
            aria-hidden="true"
          />
          <span className="sr-only">Rendering page {index + 1}</span>
        </div>
      )}

      {links.map((box, i) => {
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
            onClick={() => goTo(box.target as number)}
            className="absolute cursor-pointer rounded-[2px] border-0 bg-transparent p-0 transition-colors hover:bg-gold/20"
            style={position}
            aria-label={`Go to page ${(box.target ?? 0) + 1}`}
          />
        )
      })}
    </div>
  )
})

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
 * pdf.js parses the document in a worker and each page rasterises itself to a
 * canvas, which react-pageflip then turns. Every canvas exists from the start,
 * so the book has its true length and the flip physics are right, but a page
 * only draws once the reader is within a few spreads of it.
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

  const book = useRef<{ pageFlip: () => PageFlipApi } | null>(null)

  useEffect(() => {
    let cancelled = false
    let opened = false
    let task: PDFDocumentLoadingTask | null = null

    const load = async () => {
      // Imported here rather than at module scope: pdf.js touches DOM globals
      // and must not be pulled into the server bundle.
      const pdfjs = await import('pdfjs-dist')
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

      task = pdfjs.getDocument({ url: src, withCredentials: true })
      task.onProgress = ({ loaded, total }: { loaded: number; total: number }) => {
        // pdf.js keeps streaming — and reporting — after the document resolves.
        // Those late updates re-render the book for a bar nobody is looking at.
        if (!cancelled && !opened && total > 0) setProgress(Math.min(loaded / total, 1))
      }

      try {
        const loaded = await task.promise
        if (cancelled) return

        // Size the book to the document rather than guessing, so pages are not
        // stretched to fit a hardcoded box.
        const first = await loaded.getPage(1)
        const view = first.getViewport({ scale: 1 })
        if (cancelled) return

        opened = true
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

  /**
   * Jump to a page a link points at.
   *
   * `turnToPage` rather than `flip`: the latter walks the book a spread at a
   * time towards the target and gives up inside an empty catch when it cannot,
   * which is silent failure for a contents entry two hundred pages away. An
   * instant jump is the right gesture for a link anyway. It emits no flip
   * event, so the page counter is moved by hand.
   */
  const goTo = useCallback((index: number) => {
    book.current?.pageFlip()?.turnToPage(index)
    setCurrent(index)
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') book.current?.pageFlip()?.flipNext()
      if (event.key === 'ArrowLeft') book.current?.pageFlip()?.flipPrev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const context = useMemo(() => ({ doc, current, goTo }), [doc, current, goTo])

  /**
   * Held stable across re-renders, and not merely as an optimisation.
   *
   * react-pageflip empties its collected child refs every time the children
   * identity changes, but with `renderOnlyPageLengthChange` it then declines to
   * re-render them — so the refs never come back, and the effect that builds the
   * book quietly finds nothing to build from. Any parent re-render landing in
   * that window leaves 422 loose divs and no flipbook at all.
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ['s', 'S', 'p', 'P'].includes(e.key)) {
        e.preventDefault()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const leaves = useMemo(
    () => Array.from({ length: pageCount }, (_, index) => <FlipPage key={index} index={index} />),
    [pageCount],
  )

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
    <ReaderContext.Provider value={context}>
      <div
        className="flex flex-col items-center select-none"
        onContextMenu={(e) => e.preventDefault()}
      >
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
          // Without this the book re-initialises whenever a page finishes
          // drawing, throwing away every canvas it had already rendered.
          renderOnlyPageLengthChange
          onFlip={(event: { data: number }) => setCurrent(event.data)}
        >
          {leaves}
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
    </ReaderContext.Provider>
  )
}
