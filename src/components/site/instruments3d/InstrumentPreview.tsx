'use client'

import dynamic from 'next/dynamic'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import { INSTRUMENTS, type Instrument } from './data'
import { ViewerLoading } from './ViewerLoading'

// three.js is only fetched once a reader actually asks for a model.
const loadViewer = () => import('./InstrumentViewer')
const InstrumentViewer = dynamic(loadViewer, { ssr: false, loading: ViewerLoading })

const CARD_W = 300
const CARD_H = 350
const GAP = 14
const HOVER_DELAY = 180
/** Keeps the card clear of the sticky site header. */
const TOP_MIN = 80

type Anchor = { id: string; rect: DOMRect }

type PreviewApi = {
  hover: (id: string, el: HTMLElement) => void
  leave: () => void
  open: (id: string) => void
  canHover: boolean
}

const PreviewContext = createContext<PreviewApi | null>(null)

const usePreview = () => {
  const api = useContext(PreviewContext)
  if (!api) throw new Error('Instrument previews must sit inside <InstrumentPreviewProvider>')
  return api
}

/**
 * Owns the single hover card and the single dialog for a page, so any number
 * of figures and inline terms can trigger them without each mounting a viewer.
 */
export function InstrumentPreviewProvider({ children }: { children: ReactNode }) {
  const [anchor, setAnchor] = useState<Anchor | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const [canHover, setCanHover] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    const query = window.matchMedia('(hover: hover) and (pointer: fine)')
    const update = () => setCanHover(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  // The card is pinned to where the anchor was; once the page moves, drop it.
  useEffect(() => {
    if (!anchor) return
    const clear = () => setAnchor(null)
    window.addEventListener('scroll', clear, { passive: true })
    return () => window.removeEventListener('scroll', clear)
  }, [anchor])

  const hover = useCallback((id: string, el: HTMLElement) => {
    void loadViewer()
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(
      () => setAnchor({ id, rect: el.getBoundingClientRect() }),
      HOVER_DELAY,
    )
  }, [])

  const leave = useCallback(() => {
    window.clearTimeout(timer.current)
    setAnchor(null)
  }, [])

  const open = useCallback((id: string) => {
    window.clearTimeout(timer.current)
    setAnchor(null)
    setOpenId(id)
  }, [])

  return (
    <PreviewContext.Provider value={{ hover, leave, open, canHover }}>
      {children}
      {anchor && !openId && <HoverCard anchor={anchor} />}
      <InstrumentDialog
        instrument={openId ? INSTRUMENTS[openId] : null}
        onClose={() => setOpenId(null)}
      />
    </PreviewContext.Provider>
  )
}

/** Beside a figure; above or below a word in running text. */
const placeCard = (rect: DOMRect) => {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

  if (rect.width > 200) {
    const right = rect.right + GAP
    const left =
      right + CARD_W < vw - 12
        ? right
        : rect.left - GAP - CARD_W > 12
          ? rect.left - GAP - CARD_W
          : clamp(rect.left + rect.width / 2 - CARD_W / 2, 12, vw - CARD_W - 12)
    return { left, top: clamp(rect.top + rect.height / 2 - CARD_H / 2, TOP_MIN, vh - CARD_H - 12) }
  }

  const below = rect.bottom + GAP
  return {
    left: clamp(rect.left + rect.width / 2 - CARD_W / 2, 12, vw - CARD_W - 12),
    top: below + CARD_H < vh - 12 ? below : Math.max(TOP_MIN, rect.top - GAP - CARD_H),
  }
}

function HoverCard({ anchor }: { anchor: Anchor }) {
  const instrument = INSTRUMENTS[anchor.id]
  const position = placeCard(anchor.rect)

  return (
    <div
      role="tooltip"
      className="pointer-events-none fixed z-70 flex animate-pop-in flex-col overflow-hidden border border-gold/50 bg-bark-800 shadow-[0_24px_60px_-12px_rgba(20,12,8,0.6)]"
      style={{ ...position, width: CARD_W, height: CARD_H }}
    >
      <div className="relative flex-1 bg-[radial-gradient(circle_at_50%_40%,#4a3022,#20140d_75%)]">
        <InstrumentViewer model={instrument.model} scan={instrument.scan} embed={instrument.embed} />
        <span className="absolute top-3 left-3 border border-gold-light/40 px-2 py-1 font-label text-[9px] leading-none tracking-[0.2em] text-gold-light uppercase">
          3D preview
        </span>
      </div>
      <div className="border-t border-gold/30 px-4 py-3">
        <div className="font-display text-lg leading-tight text-parchment">{instrument.name}</div>
        <div className="mt-1 truncate font-label text-[10px] tracking-[0.14em] text-dust uppercase">
          {instrument.kind}
        </div>
        <div className="mt-2 font-label text-[10px] tracking-[0.14em] text-gold-light uppercase">
          Click to explore →
        </div>
      </div>
    </div>
  )
}

function InstrumentDialog({
  instrument,
  onClose,
}: {
  instrument: Instrument | null
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (instrument && !dialog.open) dialog.showModal()
    if (!instrument && dialog.open) dialog.close()
  }, [instrument])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      // A click that lands on the dialog element itself is a click on the backdrop.
      onClick={(event) => event.target === event.currentTarget && onClose()}
      className="m-auto max-h-[92vh] w-[min(1080px,94vw)] overflow-hidden border border-gold/40 bg-bark-800 p-0 text-parchment backdrop:bg-bark-900/80 backdrop:backdrop-blur-sm"
    >
      {instrument && (
        <div className="grid max-h-[92vh] grid-cols-[minmax(0,1fr)_340px] max-[820px]:grid-cols-1 max-[820px]:overflow-y-auto">
          <div className="relative h-[min(640px,80vh)] bg-[radial-gradient(circle_at_50%_40%,#4a3022,#20140d_75%)] max-[820px]:h-[52vh]">
            <InstrumentViewer
              key={instrument.id}
              model={instrument.model}
              scan={instrument.scan}
              embed={instrument.embed}
              interactive
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-4 text-center font-label text-[10px] tracking-[0.2em] text-dust uppercase">
              Drag to rotate · Scroll or pinch to zoom
            </div>
          </div>

          <div className="flex flex-col border-l border-gold/25 p-8 max-[820px]:border-t max-[820px]:border-l-0">
            <div className="flex items-start justify-between gap-4">
              <div className="font-label text-[10px] leading-none tracking-[0.2em] text-gold-light uppercase">
                {instrument.kind}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="-mt-2 -mr-2 grid size-9 flex-none cursor-pointer place-items-center text-2xl leading-none text-sand transition-colors hover:text-gold-light"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <h2 className="mt-3 mb-4 font-display text-4xl leading-tight text-parchment">
              {instrument.name}
            </h2>
            <p className="m-0 font-body text-[15px] leading-[1.75] text-sand">
              {instrument.description}
            </p>

            <dl className="mt-6 mb-0 border-t border-gold/20">
              {instrument.facts.map((fact) => (
                <div
                  key={fact.label}
                  className="flex justify-between gap-4 border-b border-gold/20 py-3 font-body text-[14px]"
                >
                  <dt className="text-dust">{fact.label}</dt>
                  <dd className="m-0 text-right text-parchment">{fact.value}</dd>
                </div>
              ))}
            </dl>

            <p className="mt-auto mb-0 pt-8 font-body text-[13px] leading-relaxed text-smoke italic">
              {instrument.scan || instrument.embed
                ? 'Photogrammetry scan made with KIRI Engine.'
                : 'Stand-in model for this prototype. The final version shows a KIRI Engine scan of the instrument in the Mekar Bhuana collection.'}
            </p>
          </div>
        </div>
      )}
    </dialog>
  )
}

function CubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden="true">
      <path d="M12 2.5 3.5 7v10l8.5 4.5 8.5-4.5V7L12 2.5Z" strokeLinejoin="round" />
      <path d="M3.5 7 12 11.5 20.5 7M12 11.5v10" strokeLinejoin="round" />
    </svg>
  )
}

/** Hover / focus / click handlers shared by figures and terms. */
const useTrigger = (id: string) => {
  const { hover, leave, open, canHover } = usePreview()
  return {
    canHover,
    props: {
      onMouseEnter: (event: React.MouseEvent<HTMLElement>) =>
        canHover && hover(id, event.currentTarget),
      onMouseLeave: leave,
      onFocus: (event: React.FocusEvent<HTMLElement>) =>
        canHover && hover(id, event.currentTarget),
      onBlur: leave,
      onClick: () => open(id),
    },
  }
}

export function InstrumentFigure({
  id,
  number,
  caption,
  height = 300,
}: {
  id: string
  number: number
  caption: ReactNode
  height?: number
}) {
  const instrument = INSTRUMENTS[id]
  const { canHover, props } = useTrigger(id)

  return (
    <figure className="m-0">
      <button
        type="button"
        {...props}
        aria-label={`View ${instrument.name} in 3D`}
        className="group relative block w-full cursor-pointer overflow-hidden border border-line-strong p-0 outline-offset-4 focus-visible:outline-2 focus-visible:outline-gold"
        style={{ height }}
      >
        <img
          src={instrument.photo}
          alt={instrument.photoAlt}
          className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-linear-to-t from-bark-900/55 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <span className="absolute top-3 right-3 flex items-center gap-1.5 bg-bark-800/85 px-2.5 py-1.5 font-label text-[10px] leading-none tracking-[0.18em] text-gold-light uppercase backdrop-blur-sm">
          <CubeIcon className="size-3.5" />
          {canHover ? '3D' : 'Tap for 3D'}
        </span>
      </button>
      <figcaption className="mt-2.5 font-body text-[13px] leading-snug text-muted italic">
        <span className="font-label text-[10px] tracking-[0.16em] text-brass uppercase not-italic">
          Fig. {number}
        </span>{' '}
        — {caption}
      </figcaption>
    </figure>
  )
}

/** An instrument name in running text that previews like its figure. */
export function InstrumentTerm({ id, children }: { id: string; children: ReactNode }) {
  const { props } = useTrigger(id)
  return (
    <button
      type="button"
      {...props}
      className="inline cursor-pointer border-0 bg-transparent p-0 font-[inherit] text-[inherit] text-crimson italic underline decoration-gold decoration-dotted decoration-1 underline-offset-4 transition-colors hover:text-gold"
    >
      {children}
      <CubeIcon className="ml-0.5 inline size-3 -translate-y-1.5 text-gold" />
    </button>
  )
}
