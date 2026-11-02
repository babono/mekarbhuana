'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'

type HomePopupProps = {
  image: { url: string; alt: string; width?: number | null; height?: number | null }
  link: string
  buttonLabel?: string | null
  delaySeconds: number
  hideForDays: number
  /** Changes whenever an editor saves the pop-up, so a new campaign shows again. */
  version: string
}

const STORAGE_KEY = 'mb:home-popup'

/** Storage can throw in private windows or with site data blocked. */
const readDismissal = (): { version: string; until: number } | null => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const writeDismissal = (version: string, days: number) => {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version, until: Date.now() + days * 86_400_000 }),
    )
  } catch {
    // Without storage the pop-up simply returns on the next visit.
  }
}

/**
 * A one-image promotional pop-up over the home page, managed from the
 * "Home pop-up" global in the admin panel.
 *
 * It waits a moment before appearing so the hero gets seen first, and once
 * closed stays away for `hideForDays` — unless the editor has since saved a new
 * version, which shows it to everyone again.
 */
export function HomePopup({
  image,
  link,
  buttonLabel,
  delaySeconds,
  hideForDays,
  version,
}: HomePopupProps) {
  const [open, setOpen] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)
  const external = /^https?:\/\//.test(link)

  useEffect(() => {
    const dismissed = readDismissal()
    if (dismissed && dismissed.version === version && dismissed.until > Date.now()) return

    const timer = window.setTimeout(() => setOpen(true), Math.max(0, delaySeconds) * 1000)
    return () => window.clearTimeout(timer)
  }, [version, delaySeconds])

  const close = useCallback(() => {
    setOpen(false)
    writeDismissal(version, hideForDays)
  }, [version, hideForDays])

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    // Keep the page behind from scrolling while the pop-up is up.
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = overflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, close])

  if (!open) return null

  // Following the link counts as a dismissal too: they have seen it.
  const linkProps = {
    href: link,
    onClick: close,
    ...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {}),
  }

  return (
    <div
      className="fixed inset-0 z-130 grid place-items-center bg-bark-800/70 p-4 backdrop-blur-sm"
      onPointerDown={(event) => {
        // Only a press on the backdrop itself, not on the card.
        if (event.target === event.currentTarget) close()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={image.alt}
        className="relative w-full max-w-[min(32rem,calc(100vw-32px))] animate-pop-in border border-gold-light/40 bg-cream shadow-[0_24px_70px_rgba(0,0,0,0.5)]"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute -top-3.5 -right-3.5 z-10 grid size-9 cursor-pointer place-items-center rounded-full border border-gold-light/60 bg-bark-700 text-parchment shadow-[0_6px_18px_rgba(0,0,0,0.35)] transition-colors hover:bg-crimson max-[560px]:top-2 max-[560px]:right-2"
        >
          <svg viewBox="0 0 14 14" className="size-3.5" aria-hidden="true">
            <path
              d="M1 1l12 12M13 1L1 13"
              stroke="currentColor"
              strokeWidth="1.6"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <Link {...linkProps} className="block">
          <img
            src={image.url}
            alt={image.alt}
            width={image.width ?? undefined}
            height={image.height ?? undefined}
            className="block h-auto max-h-[78vh] w-full object-contain"
          />
        </Link>

        {buttonLabel && (
          <div className="border-t border-line bg-paper p-3.5">
            <Link {...linkProps} className="btn btn-crimson flex w-full justify-center">
              {buttonLabel}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
