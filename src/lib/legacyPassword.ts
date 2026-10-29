/**
 * Accepts the password a reader already had on the old WordPress site.
 *
 * Every account carried over by the migration was created with a random
 * password nobody knows, and the reader's real WordPress hash parked in
 * `legacyPasswordHash`. The first time one of them signs in, Payload's own
 * check fails — and then this runs, verifies what they typed against the old
 * hash, and quietly re-saves it in Payload's format. The legacy hash is cleared
 * in the same write, so each account takes this path exactly once.
 *
 * The scheme below is not a guess. WordPress 6.8 moved to bcrypt but does not
 * bcrypt the password directly — bcrypt silently truncates at 72 bytes, so
 * WordPress first takes an HMAC-SHA384 of the trimmed password under the fixed
 * key `wp-sha384`, base64-encodes that, and bcrypts the result, storing it with
 * a `$wp` marker. It was confirmed against a real account's hash before this
 * file was written; see verify-hash.mjs in src/scripts/migration.
 */
import { createHmac } from 'node:crypto'

import bcrypt from 'bcryptjs'
import type { Payload } from 'payload'

/** The fixed HMAC key WordPress uses when pre-hashing a password. */
const WP_HMAC_KEY = 'wp-sha384'

/** Marks a hash as WordPress-flavoured bcrypt rather than plain bcrypt. */
const WP_MARKER = '$wp'

/**
 * True when `plaintext` is the password behind a WordPress 6.8 hash.
 *
 * Returns false rather than throwing on a malformed or unrecognised hash: a
 * broken record should fail the login, not the request.
 */
export const verifyLegacyPassword = async (
  plaintext: string,
  storedHash: string | null | undefined,
): Promise<boolean> => {
  if (!plaintext || !storedHash?.startsWith(WP_MARKER)) return false

  const preHashed = createHmac('sha384', WP_HMAC_KEY)
    .update(plaintext.trim())
    .digest('base64')

  try {
    return await bcrypt.compare(preHashed, storedHash.slice(WP_MARKER.length))
  } catch {
    return false
  }
}

/**
 * Checks a rejected login against the reader's old WordPress password and, if
 * it matches, moves them onto Payload's own hashing.
 *
 * @returns true when the password was accepted and the account upgraded, so the
 *          caller can retry `payload.login` and expect it to succeed.
 */
export const upgradeLegacyPassword = async (
  payload: Payload,
  email: string,
  password: string,
): Promise<boolean> => {
  const { docs } = await payload.find({
    collection: 'users',
    where: { email: { equals: email.toLowerCase() } },
    limit: 1,
    depth: 0,
    // The hash is hidden from the admin panel and unreadable over the API by
    // design; this is the one place that is allowed to see it.
    showHiddenFields: true,
    overrideAccess: true,
  })

  const user = docs[0] as ({ id: string | number; legacyPasswordHash?: string | null }) | undefined
  if (!user?.legacyPasswordHash) return false

  if (!(await verifyLegacyPassword(password, user.legacyPasswordHash))) return false

  await payload.update({
    collection: 'users',
    id: user.id,
    // Payload hashes `password` on write. Clearing the legacy hash in the same
    // update means a second sign-in never reaches this code, and the old hashes
    // drain out of the database as people return.
    data: { password, legacyPasswordHash: null } as Record<string, unknown>,
    overrideAccess: true,
  })

  payload.logger.info(`Upgraded legacy WordPress password for ${email}`)
  return true
}
