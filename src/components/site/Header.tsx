'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import type { User } from '@/payload-types'

import { Logo } from './Logo'

const NAV = [
  { href: '/', label: 'About' },
  { href: '/programs', label: 'Programs' },
  { href: '/hire', label: 'Hire' },
  { href: '/read', label: 'Read' },
  { href: '/encyclopedia', label: 'Encyclopedia' },
  { href: '/contact', label: 'Visit' },
]

const navLink =
  'font-body text-[12px] leading-none font-medium tracking-[0.08em] uppercase whitespace-nowrap ' +
  'px-[9px] py-[9px] border-b-2 transition-colors'

export function Header({ user }: { user: User | null }) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  // The menu is an overlay, not a route — leaving the page should close it.
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))

  return (
    <header className="sticky top-0 z-60 border-b border-line-soft bg-cream/93 backdrop-blur-[14px]">
      <div className="mx-auto flex max-w-shell flex-wrap items-center gap-x-[18px] gap-y-3 px-[26px] py-[13px]">
        <Link href="/" className="flex flex-none items-center gap-[11px] text-inherit hover:text-inherit">
          <Logo variant="mark" height={40} className="flex-none" />
          <div>
            <div className="font-display text-[15px] leading-none tracking-[0.19em] text-bark-600">
              MEKAR BHUANA
            </div>
            <div className="mt-1 font-mono text-[8.5px] leading-snug tracking-[0.19em] text-brass uppercase">
              Gamelan &amp; Dance · Denpasar
            </div>
          </div>
        </Link>

        {/* Desktop navigation */}
        <div className="contents max-[960px]:hidden">
          <nav className="flex flex-wrap items-center gap-0.5">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`${navLink} ${
                  isActive(item.href)
                    ? 'border-gold text-crimson'
                    : 'border-transparent text-body hover:border-gold hover:text-crimson'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2.5">
            <Link
              href={user ? '/account' : '/login'}
              className="px-1 py-[9px] font-body text-[12px] leading-none font-medium tracking-[0.11em] whitespace-nowrap text-soft uppercase hover:text-crimson"
            >
              {user ? (user.name?.split(' ')[0] ?? 'Account') : 'Login'}
            </Link>
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
          className="ml-auto hidden size-11 cursor-pointer place-items-center content-center gap-[5px] border border-line-strong max-[960px]:grid"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="sr-only">Menu</span>
          <span aria-hidden="true" className="block h-[1.5px] w-[19px] bg-bark-450" />
          <span aria-hidden="true" className="block h-[1.5px] w-[19px] bg-bark-450" />
          <span aria-hidden="true" className="block h-[1.5px] w-[19px] bg-bark-450" />
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
          <Link
            href={user ? '/account' : '/login'}
            className="py-[15px] font-display text-xl leading-none text-[#f0e4cc]"
          >
            {user ? 'My account' : 'Member login'}
          </Link>
          <Link href="/encyclopedia" className="btn btn-crimson mt-4 block w-full">
            Subscribe to read
          </Link>
        </div>
      )}
    </header>
  )
}
