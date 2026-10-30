import type { FieldAccess } from 'payload'

import type { User } from '@/payload-types'

import { asUser } from './index'

export type Edition = 'en' | 'id'

type Membership = Pick<
  User,
  | 'roles'
  | 'membershipStatus'
  | 'membershipExpiresAt'
  | 'englishAccessUntil'
  | 'indonesianAccessUntil'
>

/**
 * A reader is entitled when their denormalised membership window is still open.
 *
 * The window lives on the user document (maintained by the Subscriptions hooks in
 * `src/collections/Subscriptions.ts`) rather than being joined at read time —
 * Payload resolves `req.user` from the database on every request, so this stays
 * fresh, and gating never costs an extra query.
 */
export const isEntitled = (user: Membership | null | undefined): boolean => {
  if (!user) return false
  if (user.roles?.includes('admin')) return true
  if (user.membershipStatus !== 'active') return false
  if (!user.membershipExpiresAt) return false
  return new Date(user.membershipExpiresAt).getTime() > Date.now()
}

/**
 * Whether a reader may open the full book in one edition. The editions are sold
 * separately, so a subscription to one does not open the other; members-only
 * articles still need only `isEntitled`.
 */
export const hasEdition = (user: Membership | null | undefined, edition: Edition): boolean => {
  if (!isEntitled(user)) return false
  if (user!.roles?.includes('admin')) return true
  const until = edition === 'en' ? user!.englishAccessUntil : user!.indonesianAccessUntil
  return Boolean(until) && new Date(until!).getTime() > Date.now()
}

/**
 * Field-level guard for paywalled content.
 *
 * Fails closed: when the surrounding document is not available (some read
 * contexts do not pass `doc`) an unentitled reader is refused rather than
 * assumed to be looking at a public document.
 */
export const isEntitledOrPublicDoc: FieldAccess = ({ req, doc }) => {
  if (isEntitled(asUser(req.user))) return true
  return doc?.access === 'public'
}

/** Guard for fields that are always members-only, regardless of the document. */
export const isEntitledField: FieldAccess = ({ req }) => isEntitled(asUser(req.user))
