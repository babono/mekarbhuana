'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { whatsappUrl } from '@/lib/whatsapp'

/**
 * Openers offered as one-tap chips. Most enquiries are one of these three, and
 * a visitor who does not have to compose a sentence is far likelier to send.
 * Picking one fills the box rather than sending, so it can still be edited.
 */
const PROMPTS = [
  { label: 'Workshop availability', text: 'May I know the detail for availability of the workshop?' },
  { label: 'Lessons', text: 'I would like to ask about gamelan and dance lessons.' },
  { label: 'Hire a troupe', text: 'I would like to enquire about hiring a troupe for an event.' },
]

const FALLBACK = 'Hello Mekar Bhuana, I would like to ask about your programs.'

function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0 0 20.465 3.488" />
    </svg>
  )
}

/**
 * The WhatsApp enquiry launcher, docked opposite the audio pill.
 *
 * Composing happens here rather than on WhatsApp itself so the visitor commits
 * to a question before they are handed off — the same pattern the centre's old
 * site used. Pressing send opens WhatsApp's click-to-chat page with the text
 * pre-filled; it does not send anything on the visitor's behalf.
 */
export function WhatsAppWidget() {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  // Rendered only after mount: a timestamp computed during SSR would disagree
  // with the client's clock and trip a hydration mismatch.
  const [time, setTime] = useState('')

  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return

    setTime(new Intl.DateTimeFormat([], { hour: '2-digit', minute: '2-digit' }).format(new Date()))
    inputRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    // `pointerdown` rather than `click`, so a drag that starts outside still
    // dismisses, and the panel closes before any underlying control activates.
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close()
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open, close])

  const send = () => {
    const text = message.trim() || FALLBACK
    window.open(whatsappUrl(text), '_blank', 'noopener,noreferrer')
    setMessage('')
    setOpen(false)
  }

  return (
    <div ref={rootRef} className="fixed right-[22px] bottom-[22px] z-120">
      {open && (
        <div
          role="dialog"
          aria-label="Send an enquiry on WhatsApp"
          className="absolute right-0 bottom-full mb-3 w-[min(23rem,calc(100vw-44px))] origin-bottom-right animate-pop-in overflow-hidden border border-line-strong bg-cream shadow-[0_18px_50px_rgba(28,19,16,0.32)]"
        >
          <div className="flex items-start gap-3 bg-bark-600 px-[18px] py-4">
            <span className="grid size-9 flex-none place-items-center rounded-full bg-[#25d366] text-bark-700">
              <WhatsAppGlyph className="size-[21px]" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-display text-[15px] leading-tight text-parchment">
                Chat with the centre
              </div>
              <div className="mt-1 font-label text-[9.5px] leading-none tracking-[0.16em] text-gold-light uppercase">
                Replies Mon–Fri · 09:00–17:00 WITA
              </div>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Close the WhatsApp panel"
              className="-mt-1 -mr-1 grid size-8 flex-none cursor-pointer place-items-center text-sand transition-colors hover:text-parchment"
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
          </div>

          <div className="px-[18px] pt-[18px] pb-4">
            <div className="max-w-[15.5rem] border border-line bg-paper px-[15px] py-3">
              <p className="mb-0 font-body text-[14px] leading-[1.6] text-text">
                Om Swastiastu 🙏 How can we help — lessons, workshops, or hiring a troupe?
              </p>
              <span className="mt-1.5 block font-label text-[9px] leading-none tracking-[0.14em] text-shadow uppercase">
                {time}
              </span>
            </div>

            <div className="mt-3.5 flex flex-wrap gap-1.5">
              {PROMPTS.map((prompt) => (
                <button
                  key={prompt.label}
                  type="button"
                  onClick={() => {
                    setMessage(prompt.text)
                    inputRef.current?.focus()
                  }}
                  className="cursor-pointer border border-line-strong bg-transparent px-2.5 py-1.5 font-label text-[9.5px] leading-none tracking-[0.13em] text-soft uppercase transition-colors hover:border-gold hover:text-crimson"
                >
                  {prompt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-line-faint bg-paper px-[18px] py-[15px]">
            <label htmlFor="wa-message" className="sr-only">
              Your message
            </label>
            <textarea
              id="wa-message"
              ref={inputRef}
              rows={2}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                // Enter sends; Shift+Enter keeps its usual newline.
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  send()
                }
              }}
              placeholder="Write your message…"
              className="field resize-none px-3.5 py-2.5 text-[14px]"
            />
            <button type="button" onClick={send} className="btn btn-sm btn-crimson mt-2.5 flex w-full items-center justify-center gap-2">
              <WhatsAppGlyph className="size-3.5" />
              Send on WhatsApp
            </button>
            <p className="mt-2.5 mb-0 text-center font-label text-[9px] leading-snug tracking-[0.1em] text-shadow uppercase">
              Opens WhatsApp — you still press send there
            </p>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? 'Close the WhatsApp panel' : 'Enquire on WhatsApp'}
        className="flex cursor-pointer items-center gap-2.5 rounded-full border border-gold-light/42 bg-[#1a130e]/90 py-1.5 pr-[18px] pl-1.5 text-left shadow-[0_10px_34px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-colors hover:border-gold-light max-[560px]:gap-0 max-[560px]:pr-1.5"
      >
        <span className="grid size-[34px] flex-none place-items-center rounded-full bg-[#25d366] text-[#0b3d24]">
          <WhatsAppGlyph className="size-5" />
        </span>
        <span className="max-[560px]:hidden">
          <span className="block font-display text-[12.5px] leading-tight tracking-[0.07em] whitespace-nowrap text-bone">
            Chat with us
          </span>
          <span className="mt-0.5 block font-label text-[9px] leading-snug tracking-[0.14em] text-[#a08e72] uppercase">
            WhatsApp
          </span>
        </span>
      </button>
    </div>
  )
}
