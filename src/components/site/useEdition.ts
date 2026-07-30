'use client'

import { useSearchParams } from 'next/navigation'

/**
 * Which Encyclopedia edition the reader is looking at, from `?edition=`.
 *
 * Read on the client rather than from a server component's `searchParams`, which
 * would opt /encyclopedia out of static rendering. Anything unrecognised falls
 * back to English.
 */
export const useEdition = (): 'en' | 'id' => {
  const params = useSearchParams()
  return params.get('edition') === 'id' ? 'id' : 'en'
}
