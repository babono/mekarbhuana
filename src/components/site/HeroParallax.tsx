'use client'

import { useEffect, useRef } from 'react'

/**
 * The home hero still, drifting slower than the page as it scrolls.
 *
 * The image is rendered over-tall (125%) and pulled up, so translating it never
 * exposes an edge. Work happens inside a rAF frame and writes only a transform,
 * which the compositor handles without re-laying-out the page.
 *
 * Honours prefers-reduced-motion: parallax is exactly the kind of movement that
 * setting exists to suppress, so it stays pinned for those readers.
 */
export function HeroParallax({ src, alt }: { src: string; alt: string }) {
  const ref = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (reduced.matches) return

    let frame = 0

    const update = () => {
      frame = 0
      // Only the portion of the scroll that still overlaps the hero matters.
      const offset = Math.min(window.scrollY, window.innerHeight)
      node.style.transform = `translate3d(0, ${offset * 0.35}px, 0)`
    }

    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })

    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <img
        ref={ref}
        src={src}
        alt={alt}
        className="absolute inset-x-0 top-[-12%] h-[125%] w-full object-cover will-change-transform"
        fetchPriority="high"
      />
    </div>
  )
}
