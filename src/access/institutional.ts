import { unstable_cache } from 'next/cache'
import { headers as getHeaders } from 'next/headers'

import { INSTITUTIONS_TAG } from '@/hooks/revalidateInstitutions'
import { getPayloadClient } from '@/lib/auth'
import type { User } from '@/payload-types'

import { isEntitled } from './entitlement'

/**
 * Institutional access to the Encyclopedia, granted by network address.
 *
 * A university library buys one subscription for its whole campus, and its
 * readers arrive through the library's proxy, so every request carries one of
 * a handful of addresses. Access is decided on that instead of a login: nobody
 * from the institution ever sees a sign-in form.
 *
 * The institution is an ordinary account with a subscription, plus a list of
 * addresses (`institutionIps`, edited in the admin panel). A request from one
 * of those addresses is entitled exactly when that account is — so access ends
 * when their subscription does, a renewal is recorded the usual way, and a new
 * institution needs no code change.
 *
 * This deliberately does NOT sign the visitor in. The WordPress version did,
 * which meant a shared password and a login-limit setting that had to stay off.
 */

type Edition = 'en' | 'id'

type InstitutionAccount = Pick<
  User,
  'roles' | 'membershipStatus' | 'membershipExpiresAt' | 'membershipEdition'
> & { name: string; ips: string[] }

export type Institution = { name: string }

/** Split the admin field into addresses: one per line, blank lines and spaces ignored. */
export const parseIps = (value: string | null | undefined): string[] =>
  (value ?? '')
    .split(/[\s,]+/)
    .map((ip) => ip.trim())
    .filter(Boolean)

/**
 * Every account with addresses attached. Tiny, read on every anonymous visit to
 * the reader and on every page the reader fetches, so it is cached and purged
 * by the Users hooks. Expiry is still checked per request, below.
 */
const getInstitutionAccounts = unstable_cache(
  async (): Promise<InstitutionAccount[]> => {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'users',
      where: { institutionIps: { exists: true } },
      pagination: false,
      depth: 0,
    })
    return docs
      .map((doc) => ({
        name: doc.institutionName || doc.name,
        ips: parseIps(doc.institutionIps),
        roles: doc.roles,
        membershipStatus: doc.membershipStatus,
        membershipExpiresAt: doc.membershipExpiresAt,
        membershipEdition: doc.membershipEdition,
      }))
      .filter((account) => account.ips.length > 0)
  },
  ['institution-accounts'],
  // The hourly refresh is only a backstop in case a purge is ever missed.
  { tags: [INSTITUTIONS_TAG], revalidate: 3600 },
)

/**
 * The visitor's address as the platform reports it.
 *
 * Only headers the hosting platform sets are trusted. Vercel's edge overwrites
 * `x-forwarded-for` and sets `x-vercel-forwarded-for` itself rather than
 * passing on whatever the client sent, which is what makes them safe to read.
 * Behind any other host a visitor could set these and let themselves in.
 */
export const getClientIp = async (): Promise<string | null> => {
  const h = await getHeaders()
  const forwarded = h.get('x-vercel-forwarded-for') ?? h.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]!.trim()
  return h.get('x-real-ip')?.trim() ?? null
}

/**
 * The institution whose subscription covers this request, or null.
 *
 * @param edition Only match an institution whose subscription is for that
 *                edition — a library that bought the English book does not
 *                thereby get the Indonesian one.
 */
export const institutionForRequest = async (edition: Edition): Promise<Institution | null> => {
  const ip = await getClientIp()
  if (!ip) return null

  for (const account of await getInstitutionAccounts()) {
    if (!account.ips.includes(ip)) continue
    if (!isEntitled(account)) continue
    if (account.membershipEdition && account.membershipEdition !== edition) continue
    return { name: account.name }
  }
  return null
}
