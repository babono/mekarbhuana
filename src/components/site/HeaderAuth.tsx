'use client'

import Link from 'next/link'

import { useMe } from './useMe'

/**
 * The one personalised element in the site chrome.
 *
 * Reading the auth cookie on the server would opt the whole layout — and so every
 * page beneath it — out of static rendering. Fetching the reader here instead
 * keeps the shell static and swaps "Login" for their name once it arrives.
 */
export function HeaderAuth({ className }: { className?: string }) {
  const { user } = useMe()

  return (
    <Link href={user ? '/account' : '/login'} className={className}>
      {user ? (user.name?.split(' ')[0] ?? 'Account') : 'Login'}
    </Link>
  )
}
