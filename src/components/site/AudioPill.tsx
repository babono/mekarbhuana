'use client'

import { usePlayer } from './PlayerProvider'

/**
 * The ambient player control from the prototype, wired to the Spotify embed.
 *
 * The pill toggles playback; the caret reveals the real Spotify player docked
 * beneath it, so listeners keep Spotify's own controls and attribution.
 */
export function AudioPill() {
  const { playing, toggle, expanded, setExpanded } = usePlayer()

  return (
    <div className="fixed bottom-[22px] left-[22px] z-120 flex items-center rounded-full border border-gold-light/42 bg-[#1a130e]/90 p-1.5 text-left shadow-[0_10px_34px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-colors hover:border-gold-light">
      <button
        type="button"
        className="flex cursor-pointer items-center gap-3 pl-1.5 pr-2 py-[5px] text-inherit"
        onClick={toggle}
        aria-pressed={playing}
        aria-label={playing ? 'Pause the gamelan' : 'Play the gamelan'}
      >
        <span className="flex h-[17px] w-[19px] items-end gap-[2.5px]" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <i
              key={i}
              className={`h-full flex-1 origin-bottom scale-y-25 bg-gold-light ${playing ? 'animate-eq' : ''}`}
              // Staggered so the four bars never move in lockstep.
              style={playing ? { animationDuration: `${[0.9, 1.3, 0.7, 1.1][i]}s` } : undefined}
            />
          ))}
        </span>
        <span>
          <span className="block font-display text-[12.5px] leading-tight tracking-[0.07em] whitespace-nowrap text-bone">
            This Is Mekar Bhuana
          </span>
          <span className="mt-0.5 block font-mono text-[9px] leading-snug tracking-[0.14em] text-[#a08e72] uppercase">
            {playing ? 'Now playing' : 'Paused'}
          </span>
        </span>
      </button>

      <button
        type="button"
        className="grid size-[30px] flex-none cursor-pointer place-items-center border-l border-gold-light/25 p-0"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-label={expanded ? 'Hide the Spotify player' : 'Show the Spotify player'}
      >
        <span
          aria-hidden="true"
          className={`size-[7px] border-r border-b border-gold-light transition-transform ${
            expanded ? '-mt-[3px] rotate-45' : 'mt-[3px] -rotate-[135deg]'
          }`}
        />
      </button>
    </div>
  )
}
