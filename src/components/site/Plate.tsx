import type { CSSProperties } from 'react'

import type { Media } from '@/payload-types'

type PlateProps = {
  /** Caption shown while no photograph is available. */
  label: string
  /** A Media document from Payload. Takes precedence over `src`. */
  image?: Media | string | null
  /** Static path under /public, for slots not yet backed by the CMS. */
  src?: string
  height?: number | string
  /** Stretch to fill a positioned parent instead of sitting in the flow. */
  fill?: boolean
  /** Drop the frame — for plates sitting inside an already-bordered card. */
  flush?: boolean
  /** Focal point, e.g. 'center 30%', when the default crop cuts badly. */
  position?: string
  className?: string
  style?: CSSProperties
}

/**
 * An image frame that degrades to the prototype's labelled placeholder.
 *
 * A Media document wins over `src` so that anything an editor uploads replaces
 * the static file shipped in /public, without a code change.
 *
 * Positioning and the border are props rather than pass-through classes: a
 * caller's `absolute` in `className` would lose to the `relative` below, since
 * conflicting utilities are resolved by stylesheet order, not attribute order.
 */
export function Plate({
  label,
  image,
  src,
  height,
  fill = false,
  flush = false,
  position,
  className,
  style,
}: PlateProps) {
  const media = typeof image === 'object' && image !== null ? image : null
  const source = media?.url ?? src
  const alt = media?.alt ?? label

  return (
    <div
      className={[
        'flex items-end overflow-hidden p-3',
        source ? '' : 'plate-hatch',
        fill ? 'absolute inset-0 size-full' : 'relative min-h-40 w-full',
        flush || fill ? '' : 'border border-line-strong',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={fill ? style : { height, minHeight: height ?? undefined, ...style }}
    >
      {source ? (
        <img
          className="absolute inset-0 size-full object-cover"
          style={position ? { objectPosition: position } : undefined}
          src={source}
          alt={alt}
          loading="lazy"
        />
      ) : (
        <>
          <div className="plate-sheen pointer-events-none absolute inset-0" aria-hidden="true" />
          <span className="relative max-w-full border border-line-strong bg-cream px-[9px] py-[5px] font-mono text-[10px] leading-snug tracking-[0.1em] text-stone uppercase">
            {label}
          </span>
        </>
      )}
    </div>
  )
}
