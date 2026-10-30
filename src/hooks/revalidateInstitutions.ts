import { revalidateTag } from 'next/cache'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

/** Cache tag for the list of accounts that grant access by network address. */
export const INSTITUTIONS_TAG = 'institutions'

type Fields = { institutionIps?: string | null }

const purge = () => {
  try {
    revalidateTag(INSTITUTIONS_TAG, { expire: 0 })
  } catch {
    // Outside a request (seeds, migrations) there is no cache to purge.
  }
}

/**
 * Refresh the cached institution list when an institutional account changes —
 * its addresses, or its membership window when a subscription is renewed.
 * Ordinary readers' accounts are left alone, so a sign-in never purges it.
 */
export const revalidateInstitutionsAfterChange: CollectionAfterChangeHook = ({
  doc,
  previousDoc,
  req,
}) => {
  if (req?.context?.skipRevalidate) return doc
  if ((doc as Fields).institutionIps || (previousDoc as Fields | undefined)?.institutionIps) purge()
  return doc
}

export const revalidateInstitutionsAfterDelete: CollectionAfterDeleteHook = ({ doc, req }) => {
  if (req?.context?.skipRevalidate) return doc
  if ((doc as Fields).institutionIps) purge()
  return doc
}
