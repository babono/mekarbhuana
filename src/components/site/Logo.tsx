type LogoProps = {
  height?: number
  /**
   * `full` — ornament above the Balinese wordmark. Needs roughly 80px of height
   * before the script below is legible, so reserve it for standalone placements.
   * `mark` — the ornament alone, for small sizes and anywhere the name is
   * already set in type beside it.
   */
  variant?: 'full' | 'mark'
  className?: string
}

const ART = {
  // Intrinsic sizes of the trimmed artwork, used to keep the aspect ratio exact.
  full: { src: '/logo-mekar-bhuana.png', w: 140, h: 191 },
  mark: { src: '/logo-mekar-bhuana-mark.png', w: 126, h: 135 },
} as const

/**
 * The centre's mark: a gold ornament above the Balinese wordmark.
 *
 * Rendered as a plain <img> rather than next/image on purpose — `localPatterns`
 * in next.config.ts restricts next/image to Payload's upload route, and a 13KB
 * static asset gains nothing from optimisation. Width and height are always set
 * so it never shifts the layout while loading.
 */
export function Logo({ height = 38, variant = 'full', className }: LogoProps) {
  const art = ART[variant]
  const width = Math.round((height * art.w) / art.h)

  return (
    <img
      src={art.src}
      alt="Mekar Bhuana"
      width={width}
      height={height}
      className={className}
      style={{ height, width }}
    />
  )
}
