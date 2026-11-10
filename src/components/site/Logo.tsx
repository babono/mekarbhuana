type LogoProps = {
  height?: number
  /**
   * `full` — the official artwork: ornament, Balinese wordmark and ©. Needs
   * roughly 80px of height before the script is legible, so reserve it for
   * standalone placements.
   * `mark` — the ornament alone, for small sizes and anywhere the name is
   * already set in type beside it.
   */
  variant?: 'full' | 'mark'
  /** Colour comes from `currentColor`, so set it with a text-* class. */
  className?: string
}

const ART = {
  // viewBox sizes of the trimmed vector artwork, used to keep the aspect exact.
  full: { src: '/logo-mekar-bhuana.svg', w: 1179, h: 1749 },
  mark: { src: '/logo-mekar-bhuana-mark.svg', w: 1141, h: 1169 },
} as const

/**
 * The centre's copyrighted logo, from the official vector file.
 *
 * Drawn as a CSS mask over `currentColor` rather than an <img>, so one file
 * serves every placement — gold on the dark footer, parchment over the hero,
 * brown on cream — without recolouring the artwork. Width and height are
 * always set so it never shifts the layout while loading.
 */
export function Logo({ height = 38, variant = 'full', className = 'text-gold' }: LogoProps) {
  const art = ART[variant]
  const width = Math.round((height * art.w) / art.h)

  return (
    <span
      role="img"
      aria-label="Mekar Bhuana"
      className={`mask-icon inline-block ${className}`}
      style={{
        height,
        width,
        maskImage: `url('${art.src}')`,
        WebkitMaskImage: `url('${art.src}')`,
      }}
    />
  )
}
