'use client'

import { useCallback, useEffect, useState } from 'react'

import { Logo } from './Logo'
import { usePlayer } from './PlayerProvider'

type Phase = 'gate' | 'opening' | 'site'

const EMBERS = [
  { left: '12%', size: 3, duration: '9s', delay: '0s', color: '#e0b155' },
  { left: '31%', size: 2, duration: '12s', delay: '1.4s', color: '#e0b155' },
  { left: '52%', size: 3, duration: '10.5s', delay: '3s', color: '#d9a441' },
  { left: '71%', size: 2, duration: '13s', delay: '0.7s', color: '#e0b155' },
  { left: '88%', size: 3, duration: '11s', delay: '2.2s', color: '#d9a441' },
]

/**
 * The entrance from the prototype: two carved panels that draw apart on "Enter".
 *
 * Shown on every full page load and never remembered — the brief was that each
 * visit should arrive here. Client-side navigation between pages does not
 * re-trigger it, because this component stays mounted in the layout.
 */
export function Gate() {
  const [phase, setPhase] = useState<Phase>('gate')
  const { play } = usePlayer()

  const enter = useCallback(
    (withSound: boolean) => {
      if (phase !== 'gate') return
      // Called straight from the click handler, not from inside a state updater:
      // updaters run during render, and starting playback there would set state
      // on the provider mid-render. It also keeps play() inside the user gesture.
      if (withSound) play()
      setPhase('opening')
    },
    [phase, play],
  )

  // The panels take 1.25s to clear the viewport; unmount only once they have.
  useEffect(() => {
    if (phase !== 'opening') return
    const timer = setTimeout(() => setPhase('site'), 1250)
    return () => clearTimeout(timer)
  }, [phase])

  // Enter key opens the gate too, as in the prototype.
  useEffect(() => {
    if (phase !== 'gate') return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Enter') enter(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, enter])

  // Hold the page still while the gate is up.
  useEffect(() => {
    if (phase === 'site') return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [phase])

  if (phase === 'site') return null

  const opening = phase === 'opening'

  return (
    <div className="gate fixed inset-0 z-200 overflow-hidden" role="dialog" aria-label="Enter the site">
      <div
        className={`absolute inset-0 bg-radial-[120%_100%_at_50%_40%] from-[#241a12] from-0% to-[#12100d] to-70% ${
          opening ? 'animate-gate-fade' : ''
        }`}
      />

      <div className="pointer-events-none absolute inset-0 flex" aria-hidden="true">
        <div
          className={`relative flex-1 overflow-hidden border-r border-[#b4832b]/55 bg-linear-[105deg,#1b140e_0%,#332315_62%,#221810_100%] ${
            opening ? 'animate-gate-slide-l' : ''
          }`}
        >
          <div className="gate-weave clip-weave-l absolute top-[9%] bottom-[9%] left-0 w-[min(30%,150px)]" />
          <div className="absolute top-[16%] bottom-[16%] left-[min(31%,158px)] w-px bg-linear-to-b from-transparent via-gold-light/35 to-transparent" />
          <div className="absolute top-1/2 left-[22px] -translate-y-1/2 [writing-mode:vertical-rl] font-balinese text-[clamp(30px,4vw,50px)] text-gold-light/20">
            ᬲᬸᬯᬭ
          </div>
          <div className="absolute inset-y-0 right-0 w-[56%] bg-linear-to-r from-transparent to-[#120e0a]/90" />
        </div>

        <div
          className={`relative flex-1 overflow-hidden border-l border-[#b4832b]/55 bg-linear-[255deg,#1b140e_0%,#332315_62%,#221810_100%] ${
            opening ? 'animate-gate-slide-r' : ''
          }`}
        >
          <div className="gate-weave clip-weave-r absolute top-[9%] right-0 bottom-[9%] w-[min(30%,150px)]" />
          <div className="absolute top-[16%] right-[min(31%,158px)] bottom-[16%] w-px bg-linear-to-b from-transparent via-gold-light/35 to-transparent" />
          <div className="absolute top-1/2 right-[22px] -translate-y-1/2 [writing-mode:vertical-rl] font-balinese text-[clamp(30px,4vw,50px)] text-gold-light/20">
            ᬢᬓ᭄ᬲᬸ
          </div>
          <div className="absolute inset-y-0 left-0 w-[56%] bg-linear-to-l from-transparent to-[#120e0a]/90" />
        </div>
      </div>

      <div
        className={`absolute inset-0 grid place-items-center p-[34px] ${
          opening ? 'animate-gate-content-out' : ''
        }`}
      >
        <div className="relative max-w-[660px] text-center">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-1/2 h-[180%] w-[190%] -translate-x-1/2 -translate-y-1/2 bg-radial-[closest-side] from-[#100c09]/94 from-0% via-[#100c09]/86 via-45% to-transparent to-100%"
          />

          <div className="relative">
            <Logo height={104} className="mx-auto mb-[26px]" />
            <div className="mb-[22px] font-label text-[10px] leading-none font-medium tracking-[0.42em] text-smoke uppercase">
              Denpasar · Bali · Est. 2002
            </div>
            <h1 className="m-0 mb-[26px] font-display text-[clamp(38px,8vw,80px)] leading-[1.02] tracking-[-0.015em] text-gold-pale">
              Mekar Bhuana
            </h1>
            <p className="mx-auto mb-10 max-w-[470px] font-body text-[clamp(15px,1.6vw,19px)] leading-[1.75] font-normal text-pretty text-sand">
              A family compound where bronze that is centuries old is still struck every week. Step
              through — the gamelan is already playing.
            </p>

            <div className="flex flex-col items-center gap-[18px]">
              <button
                type="button"
                onClick={() => enter(true)}
                className="group relative inline-flex cursor-pointer items-center gap-4 border border-gold bg-gold-light/7 px-[46px] py-5 text-gold-pale transition-colors hover:bg-gold hover:text-ink"
              >
                <span className="font-body text-[12px] leading-none font-medium tracking-[0.34em] uppercase">
                  Enter
                </span>
                <span
                  aria-hidden="true"
                  className="size-2 rotate-45 border-t border-r border-current"
                />
                <span
                  aria-hidden="true"
                  className="animate-breathe pointer-events-none absolute -inset-[9px] border border-gold-light/30"
                />
              </button>

              <button
                type="button"
                onClick={() => enter(false)}
                className="cursor-pointer border-none bg-transparent p-0 font-label text-[11px] leading-none tracking-[0.18em] text-[#7e6e59] uppercase underline underline-offset-[5px] hover:text-sand"
              >
                Enter in silence
              </button>

              <div className="mt-2.5 font-label text-[10.5px] leading-[1.7] tracking-[0.1em] text-[#5f5344] uppercase">
                Sound on · This Is Mekar Bhuana
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[34%] overflow-hidden" aria-hidden="true">
        {EMBERS.map((ember) => (
          <span
            key={ember.left}
            className="animate-ember absolute bottom-0 rounded-full"
            style={{
              left: ember.left,
              width: ember.size,
              height: ember.size,
              background: ember.color,
              animationDuration: ember.duration,
              animationDelay: ember.delay,
            }}
          />
        ))}
      </div>
    </div>
  )
}
