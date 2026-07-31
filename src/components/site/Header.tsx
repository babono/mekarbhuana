'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { HeaderAuth } from './HeaderAuth'
import { Logo } from './Logo'

const NAV = [
  { href: '/', label: 'About' },
  { href: '/programs', label: 'Programs' },
  { href: '/hire', label: 'Hire' },
  { href: '/read', label: 'Read' },
  { href: '/encyclopedia', label: 'Encyclopedia' },
  { href: '/contact', label: 'Visit' },
]

/**
 * Routes whose first section is a full-bleed image the header should sit over.
 * Everywhere else the bar stays solid and occupies its own space in the layout,
 * so nothing is hidden underneath it.
 */
const OVERLAY_ROUTES = ['/']

const navLink =
  'font-body text-[12px] leading-none font-medium tracking-[0.08em] uppercase whitespace-nowrap ' +
  'px-[9px] py-[9px] border-b-2 transition-colors'

export function Header() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const overlay = OVERLAY_ROUTES.includes(pathname)
  // Transparent only while over the hero — once the page moves, the bar solidifies.
  const clear = overlay && !scrolled && !menuOpen

  // The menu is an overlay, not a route — leaving the page should close it.
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!overlay) return

    // Written inside a rAF frame so a fast scroll cannot queue up state updates.
    let frame = 0
    const update = () => {
      frame = 0
      setScrolled(window.scrollY > 40)
    }
    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
    }
  }, [overlay])

  return (
    <header
      className={[
        'top-0 z-60 transition-colors duration-300',
        overlay ? 'fixed inset-x-0' : 'sticky',
        clear
          ? 'border-b border-transparent bg-transparent'
          : 'border-b border-line-soft bg-cream/93 backdrop-blur-[14px]',
      ].join(' ')}
    >
      <div className="mx-auto flex max-w-shell flex-wrap items-center gap-x-[18px] gap-y-3 px-[26px] py-[13px]">
        <Link href="/" className="flex flex-none items-center gap-[11px] text-inherit hover:text-inherit">
          <Logo variant="mark" height={40} className="flex-none" />
          <div>
            <div
              className={`font-display text-[15px] leading-none tracking-[0.19em] transition-colors ${
                clear ? 'text-parchment' : 'text-bark-600'
              }`}
            >
              MEKAR BHUANA
            </div>
            <div
              className={`mt-1 font-label text-[8.5px] leading-snug tracking-[0.19em] uppercase transition-colors ${
                clear ? 'text-gold-light' : 'text-brass'
              }`}
            >
              Gamelan &amp; Dance · Denpasar
            </div>
          </div>
        </Link>

        {/* Desktop navigation */}
        <div className="contents max-[960px]:hidden">
          <nav className="flex flex-wrap items-center gap-0.5">
            {NAV.map((item) => {
              const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${navLink} ${
                    active
                      ? clear
                        ? 'border-gold-light text-parchment'
                        : 'border-gold text-crimson'
                      : clear
                        ? 'border-transparent text-sand hover:border-gold-light hover:text-parchment'
                        : 'border-transparent text-body hover:border-gold hover:text-crimson'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2.5">
            <HeaderAuth
              className={`px-1 py-[9px] font-body text-[12px] leading-none font-medium tracking-[0.11em] whitespace-nowrap uppercase transition-colors ${
                clear ? 'text-sand hover:text-parchment' : 'text-soft hover:text-crimson'
              }`}
            />
            <Link
              href="/encyclopedia"
              className="border border-crimson bg-crimson px-[22px] py-[13px] font-body text-[12px] leading-none font-semibold tracking-[0.13em] whitespace-nowrap text-cream uppercase transition-colors hover:border-gold hover:bg-gold hover:text-ink"
            >
              Subscribe to read
            </Link>
          </div>
        </div>

        {/* Mobile trigger */}
        <button
          type="button"
          className={`ml-auto hidden size-11 cursor-pointer place-items-center content-center gap-[5px] border transition-colors max-[960px]:grid ${
            clear ? 'border-gold-light/50' : 'border-line-strong'
          }`}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="sr-only">Menu</span>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              aria-hidden="true"
              className={`block h-[1.5px] w-[19px] transition-colors ${
                clear ? 'bg-gold-pale' : 'bg-bark-450'
              }`}
            />
          ))}
        </button>
      </div>

      {menuOpen && (
        <div id="mobile-menu" className="flex flex-col bg-bark-600 px-[22px] pt-3.5 pb-[26px]">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="border-b border-[#f0e4cc]/16 py-[15px] font-display text-xl leading-none text-[#f0e4cc]"
            >
              {item.label === 'Visit' ? 'Visit & contact' : item.label}
            </Link>
          ))}
          <HeaderAuth className="py-[15px] font-display text-xl leading-none text-[#f0e4cc]" />
          <Link href="/encyclopedia" className="btn btn-crimson mt-4 block w-full">
            Subscribe to read
          </Link>
        </div>
      )}
    </header>
  )
}
