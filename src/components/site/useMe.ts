'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export type MeUser = {
  id?: string
  name?: string | null
  email?: string
  roles?: string[]
  membershipStatus?: string
  membershipExpiresAt?: string | null
  englishAccessUntil?: string | null
  indonesianAccessUntil?: string | null
} | null

type Edition = 'en' | 'id'

export function isUserEntitled(user: MeUser): boolean {
  if (!user) return false
  if (user.roles?.includes('admin')) return true
  if (user.membershipStatus !== 'active') return false
  if (!user.membershipExpiresAt) return false
  return new Date(user.membershipExpiresAt).getTime() > Date.now()
}

/** Mirrors `hasEdition` on the server: each edition is subscribed to separately. */
export function hasEditionAccess(user: MeUser, edition: Edition): boolean {
  if (!isUserEntitled(user)) return false
  if (user!.roles?.includes('admin')) return true
  const until = edition === 'en' ? user!.englishAccessUntil : user!.indonesianAccessUntil
  return Boolean(until) && new Date(until!).getTime() > Date.now()
}

/** The edition a subscriber should land on: English if they have it, else Indonesian. */
export function readableEdition(user: MeUser): Edition | null {
  if (hasEditionAccess(user, 'en')) return 'en'
  if (hasEditionAccess(user, 'id')) return 'id'
  return null
}

export function useMe() {
  const pathname = usePathname()
  const [user, setUser] = useState<MeUser>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()

    fetch('/api/users/me', { credentials: 'include', signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setUser(data?.user ?? null)
        setLoading(false)
      })
      .catch(() => {
        setUser(null)
        setLoading(false)
      })

    return () => controller.abort()
  }, [pathname])

  return {
    user,
    entitled: isUserEntitled(user),
    hasEdition: (edition: Edition) => hasEditionAccess(user, edition),
    readableEdition: readableEdition(user),
    loading,
  }
}
