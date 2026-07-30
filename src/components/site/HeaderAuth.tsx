'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type Me = { name?: string | null } | null

/**
 * The one personalised element in the site chrome.
 *
 * Reading the auth cookie on the server would opt the whole layout — and so every
 * page beneath it — out of static rendering. Fetching the reader here instead
 * keeps the shell static and swaps "Login" for their name once it arrives.
 *
 * It renders "Login" first, which is also the correct state for the large
 * majority of visitors, so there is rarely a visible change.
 */
export function HeaderAuth({ className }: { className?: string }) {
  const [me, setMe] = useState<Me>(null)

  useEffect(() => {
    const controller = new AbortController()

    fetch('/api/users/me', { credentials: 'include', signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setMe(data?.user ?? null))
      .catch(() => {
        // Not signed in, offline, or aborted — "Login" stays correct.
      })

    return () => controller.abort()
  }, [])

  return (
    <Link href={me ? '/account' : '/login'} className={className}>
      {me ? (me.name?.split(' ')[0] ?? 'Account') : 'Login'}
    </Link>
  )
}
