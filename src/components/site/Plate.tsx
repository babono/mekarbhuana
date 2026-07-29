import type { CSSProperties } from 'react'

import type { Media } from '@/payload-types'

type PlateProps = {
  /** Caption shown while no photograph has been uploaded. */
  label: string
  image?: Media | string | null
  height?: number | string
  /** Stretch to fill a positioned parent instead of sitting in the flow. */
  fill?: boolean
  /** Drop the frame — for plates sitting inside an already-bordered card. */
  flush?: boolean
  className?: string
  style?: CSSProperties
}

/**
 * An image frame that degrades to the prototype's labelled placeholder.
 *
 * The redesign was drawn before the photography existed, so every image slot
 * names the shot it is waiting for. Once a Media document is attached the plate
 * renders the real picture instead.
 *
 * Positioning and the border are props rather than pass-through classes: a
 * caller's `absolute` in `className` would lose to the `relative` below, since
 * conflicting utilities are resolved by stylesheet order, not attribute order.
 */
export function Plate({
  label,
  image,
  height,
  fill = false,
  flush = false,
  className,
  style,
}: PlateProps) {
  const media = typeof image === 'object' && image !== null ? image : null
  const src = media?.url

  return (
    <div
      className={[
        'plate-hatch flex items-end overflow-hidden p-3',
        fill ? 'absolute inset-0 size-full' : 'relative min-h-40 w-full',
        flush || fill ? '' : 'border border-line-strong',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={fill ? style : { height, minHeight: height ?? undefined, ...style }}
    >
      <div className="plate-sheen pointer-events-none absolute inset-0" aria-hidden="true" />
      {src ? (
        <img
          className="absolute inset-0 size-full object-cover"
          src={src}
          alt={media?.alt ?? ''}
          loading="lazy"
        />
      ) : (
        <span className="relative max-w-full border border-line-strong bg-cream px-[9px] py-[5px] font-mono text-[10px] leading-snug tracking-[0.1em] text-stone uppercase">
          {label}
        </span>
      )}
    </div>
  )
}
