import type { Access, FieldAccess } from 'payload'

import type { User } from '@/payload-types'

/** `req.user` is only typed as a generic user; narrow it once here. */
export const asUser = (user: unknown): User | null => (user as User) ?? null

export const isAdmin: Access = ({ req }) => Boolean(asUser(req.user)?.roles?.includes('admin'))

export const isAdminField: FieldAccess = ({ req }) =>
  Boolean(asUser(req.user)?.roles?.includes('admin'))

export const isAdminOrSelf: Access = ({ req }) => {
  const user = asUser(req.user)
  if (!user) return false
  if (user.roles?.includes('admin')) return true
  return { id: { equals: user.id } }
}

export const anyone: Access = () => true

export const isAuthenticated: Access = ({ req }) => Boolean(req.user)

/**
 * Public reads see published documents only; admins see everything so they can
 * preview drafts in the admin panel.
 */
export const publishedOrAdmin: Access = ({ req }) => {
  if (asUser(req.user)?.roles?.includes('admin')) return true
  return { _status: { equals: 'published' } }
}
