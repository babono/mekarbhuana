'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { useEdition } from './useEdition'

type State =
  | { status: 'loading' }
  | { status: 'anonymous' }
  | { status: 'member'; readerUrl?: string }

/**
 * The two parts of the Encyclopedia page that depend on who is reading: the
 * "start reading" link and the active-subscription notice.
 *
 * Kept client-side so the rest of the page — the plans, the covers, the preview —
 * can be statically generated. Security is unaffected: `readerUrl` is stripped by
 * field-level access on the server, so an unentitled reader's request simply
 * comes back without it. Nothing here decides entitlement; it only reflects what
 * the API was willing to return.
 */
export function EncyclopediaCta() {
  const edition = useEdition()
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    const controller = new AbortController()
    const opts = { credentials: 'include' as const, signal: controller.signal }

    const load = async () => {
      const meRes = await fetch('/api/users/me', opts)
      const me = meRes.ok ? await meRes.json() : null
      if (!me?.user) return setState({ status: 'anonymous' })

      const res = await fetch(`/api/ebooks?where[edition][equals]=${edition}&limit=1`, opts)
      const data = res.ok ? await res.json() : null
      const readerUrl = data?.docs?.[0]?.readerUrl as string | undefined
      setState({ status: 'member', readerUrl })
    }

    load().catch(() => setState({ status: 'anonymous' }))
    return () => controller.abort()
  }, [edition])

  const entitled = state.status === 'member' && Boolean(state.readerUrl)

  return (
    <>
      <div className="flex flex-wrap gap-3">
        {entitled ? (
          <a href={state.readerUrl} className="btn btn-gold">
            Start reading
          </a>
        ) : (
          <Link
            href={state.status === 'member' ? '/join' : '/login'}
            className="btn btn-gold"
          >
            {state.status === 'member' ? 'Choose a plan' : 'Login and start reading'}
          </Link>
        )}
        <Link href="#preview" className="btn btn-ghost">
          Preview a chapter
        </Link>
      </div>

      {entitled && (
        <div className="mt-[26px] border-l-[3px] border-sage bg-[#eef3e8] px-4 py-3.5 font-body text-sm leading-relaxed text-[#40602a]">
          Your subscription is active — you already have access to this edition.
        </div>
      )}
    </>
  )
}
