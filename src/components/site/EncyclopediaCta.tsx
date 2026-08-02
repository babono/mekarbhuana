'use client'

import Link from 'next/link'

import { useEdition } from './useEdition'
import { useMe } from './useMe'

/**
 * The two parts of the Encyclopedia page that depend on who is reading: the
 * "start reading" link and the active-subscription notice.
 */
export function EncyclopediaCta() {
  const edition = useEdition()
  const { user, entitled, loading } = useMe()

  return (
    <>
      <div className="flex flex-wrap gap-3">
        {entitled ? (
          <Link href={`/encyclopedia/read?edition=${edition}`} className="btn btn-gold">
            Read full edition
          </Link>
        ) : (
          <Link
            href={user ? '/join' : '/login'}
            className="btn btn-gold"
          >
            {user ? 'Choose a plan' : 'Login to read full version'}
          </Link>
        )}
        {/* Open to everyone: the reader itself serves a short preview slice to
            anyone without a subscription, so this needs no entitlement check. */}
        <Link href={`/encyclopedia/read?edition=${edition}`} className="btn btn-ghost">
          {entitled ? 'Open flipbook reader' : 'Preview flipbook'}
        </Link>
      </div>

      {!loading && entitled && (
        <div className="mt-[26px] border-l-[3px] border-sage bg-[#eef3e8] px-4 py-3.5 font-body text-sm leading-relaxed text-[#40602a]">
          Your subscription is active — you have full access to both English and Bahasa Indonesia editions.
        </div>
      )}
    </>
  )
}
