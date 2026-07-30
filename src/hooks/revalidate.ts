import { revalidatePath, revalidateTag } from 'next/cache'
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionConfig,
} from 'payload'

import type { ContentTag } from '@/lib/content'

/**
 * Purge the statically rendered pages that depend on a collection.
 *
 * Payload runs inside the same Next.js process, so a save can invalidate the
 * cache directly — no webhook, no deploy. Pages then rebuild on the next request
 * rather than on a timer, which is what makes a long revalidate window safe on a
 * site that changes a few times a year.
 */
const purge = (tag: ContentTag, paths: string[]) => {
  try {
    // `{ expire: 0 }` drops the entry now rather than after a named cache
    // profile's window — an editor pressing Save expects to see the change.
    revalidateTag(tag, { expire: 0 })
    // Tags cover the cached queries; the paths cover the rendered routes.
    for (const path of paths) revalidatePath(path)
  } catch {
    // Seeds and scripts run outside a request, where Next has no cache to purge.
    // Failing here would abort an otherwise valid write, so it is ignored.
  }
}

export const revalidateAfterChange =
  (tag: ContentTag, paths: string[]): CollectionAfterChangeHook =>
  ({ doc, req }) => {
    // Skip while seeding or migrating: those run outside a request and would
    // otherwise call revalidate hundreds of times for no benefit.
    if (req?.context?.skipRevalidate) return doc
    purge(tag, paths)
    return doc
  }

export const revalidateAfterDelete =
  (tag: ContentTag, paths: string[]): CollectionAfterDeleteHook =>
  ({ doc, req }) => {
    if (req?.context?.skipRevalidate) return doc
    purge(tag, paths)
    return doc
  }

/**
 * Attach both hooks to a collection, preserving anything already registered.
 */
export const withRevalidation = (
  collection: CollectionConfig,
  tag: ContentTag,
  paths: string[],
): CollectionConfig => ({
  ...collection,
  hooks: {
    ...collection.hooks,
    afterChange: [...(collection.hooks?.afterChange ?? []), revalidateAfterChange(tag, paths)],
    afterDelete: [...(collection.hooks?.afterDelete ?? []), revalidateAfterDelete(tag, paths)],
  },
})
