import { headers as getHeaders } from 'next/headers'
import { getPayload, type Payload } from 'payload'

import config from '@payload-config'

import type { User } from '@/payload-types'

/** The Payload instance, shared across a request. */
export const getPayloadClient = async (): Promise<Payload> => getPayload({ config: await config })

/**
 * The signed-in reader, or null. Reads the Payload auth cookie that both the
 * admin panel and the site's own login form set.
 */
export const getMe = async (): Promise<User | null> => {
  const { user } = await getPayloadAndUser()
  return user
}

/**
 * Payload plus the current reader.
 *
 * Every query made on a reader's behalf must pass BOTH of these along with
 * `overrideAccess: false` — the Local API ignores access control otherwise, which
 * would hand paywalled fields to anyone who asked. See `readAsUser` below.
 */
export const getPayloadAndUser = async (): Promise<{ payload: Payload; user: User | null }> => {
  const payload = await getPayloadClient()
  try {
    const { user } = await payload.auth({ headers: await getHeaders() })
    return { payload, user: (user as User) ?? null }
  } catch {
    // An unreadable cookie means "not signed in", not "fail the page".
    return { payload, user: null }
  }
}

/** The arguments every reader-facing query needs in order to be access-checked. */
export const readAsUser = (user: User | null) => ({
  user: user ?? undefined,
  overrideAccess: false,
})
