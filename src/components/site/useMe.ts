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
  membershipEdition?: string
} | null

export function isUserEntitled(user: MeUser): boolean {
  if (!user) return false
  if (user.roles?.includes('admin')) return true
  if (user.membershipStatus !== 'active') return false
  if (!user.membershipExpiresAt) return false
  return new Date(user.membershipExpiresAt).getTime() > Date.now()
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

  return { user, entitled: isUserEntitled(user), loading }
}
