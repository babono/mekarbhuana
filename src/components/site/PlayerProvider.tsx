'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

/** "This Is Mekar Bhuana" — the centre's own Spotify artist playlist. */
export const PLAYLIST_URI = 'spotify:playlist:37i9dQZF1DZ06evO3PWQBZ'

const IFRAME_API_SRC = 'https://open.spotify.com/embed/iframe-api/v1'

type EmbedController = {
  play: () => void
  pause: () => void
  togglePlay: () => void
  addListener: (event: string, cb: (e: { data: { isPaused?: boolean } }) => void) => void
  destroy?: () => void
}

type SpotifyIFrameApi = {
  createController: (
    element: HTMLElement,
    options: { uri: string; width: string | number; height: string | number },
    callback: (controller: EmbedController) => void,
  ) => void
}

declare global {
  interface Window {
    onSpotifyIframeApiReady?: (api: SpotifyIFrameApi) => void
  }
}

type PlayerContextValue = {
  ready: boolean
  playing: boolean
  play: () => void
  toggle: () => void
  expanded: boolean
  setExpanded: (value: boolean) => void
}

const PlayerContext = createContext<PlayerContextValue | null>(null)

export const usePlayer = (): PlayerContextValue => {
  const context = useContext(PlayerContext)
  if (!context) throw new Error('usePlayer must be used inside <PlayerProvider>')
  return context
}

/**
 * Owns the Spotify embed for the whole site.
 *
 * The iframe is mounted once, up front, so that the gate's "Enter" click can call
 * `play()` inside the same user gesture — browsers block audio that starts any
 * other way, and a player created on demand would arrive too late to count.
 */
export function PlayerProvider({ children }: { children: ReactNode }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const controllerRef = useRef<EmbedController | null>(null)
  const [ready, setReady] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [expanded, setExpanded] = useState(false)
  // A play() issued before the controller exists is remembered, not dropped.
  const pendingPlayRef = useRef(false)

  useEffect(() => {
    let cancelled = false

    const build = (api: SpotifyIFrameApi) => {
      if (cancelled || !hostRef.current || controllerRef.current) return

      api.createController(
        hostRef.current,
        { uri: PLAYLIST_URI, width: '100%', height: 152 },
        (controller) => {
          if (cancelled) return
          controllerRef.current = controller
          setReady(true)

          controller.addListener('playback_update', (event) => {
            if (typeof event?.data?.isPaused === 'boolean') setPlaying(!event.data.isPaused)
          })

          if (pendingPlayRef.current) {
            pendingPlayRef.current = false
            controller.play()
          }
        },
      )
    }

    window.onSpotifyIframeApiReady = build

    if (!document.querySelector(`script[src="${IFRAME_API_SRC}"]`)) {
      const script = document.createElement('script')
      script.src = IFRAME_API_SRC
      script.async = true
      document.body.appendChild(script)
    }

    return () => {
      cancelled = true
      controllerRef.current?.destroy?.()
      controllerRef.current = null
    }
  }, [])

  const play = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.play()
    } else {
      // The API script has not finished loading; play as soon as it does.
      pendingPlayRef.current = true
    }
    setPlaying(true)
  }, [])

  const toggle = useCallback(() => {
    if (!controllerRef.current) {
      pendingPlayRef.current = true
      setPlaying(true)
      return
    }
    controllerRef.current.togglePlay()
  }, [])

  const value = useMemo(
    () => ({ ready, playing, play, toggle, expanded, setExpanded }),
    [ready, playing, play, toggle, expanded],
  )

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <div
        className={`fixed bottom-[74px] left-[22px] z-119 w-[min(360px,calc(100vw-44px))] overflow-hidden transition-[max-height,opacity] duration-300 ease-out ${
          expanded ? 'max-h-50 opacity-100' : 'pointer-events-none max-h-0 opacity-0'
        }`}
      >
        <div className="overflow-hidden rounded-xl shadow-[0_12px_38px_rgba(0,0,0,0.45)] [&_iframe]:block [&_iframe]:w-full [&_iframe]:border-0">
          {/* Spotify replaces this node with its iframe. */}
          <div ref={hostRef} />
        </div>
      </div>
    </PlayerContext.Provider>
  )
}
