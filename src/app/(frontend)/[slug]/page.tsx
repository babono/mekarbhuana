import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { getPage } from '@/lib/content'
import { formatDate } from '@/lib/format'

export const revalidate = 86400

/**
 * Pages of the old WordPress site that have no counterpart here yet. They send
 * visitors home rather than to a dead end — temporarily, so that creating a page
 * with one of these slugs in the admin panel brings the address back to life.
 */
const RETIRED = new Set([
  'founders',
  'gallery',
  'links',
  'mekar-bhuana',
  'mekar-bhuana-aotearoa',
  'portfolio',
  'projects',
  'recordings',
  'tuning-library',
])

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const page = await getPage(slug)
  if (!page) return { title: 'Not found' }
  return { title: page.title, description: page.intro ?? undefined }
}

export default async function StandalonePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const page = await getPage(slug)

  if (!page) {
    if (RETIRED.has(slug)) redirect('/')
    notFound()
  }

  return (
    <main>
      <section className="relative overflow-hidden bg-bark-500 px-[26px] pt-[78px] pb-[66px]">
        <div className="mx-auto max-w-shell">
          <div className="crumb">
            <Link href="/" className="text-gold-light">
              Mekar Bhuana
            </Link>{' '}
            / {page.title}
          </div>
          <h1 className="m-0 mb-5 max-w-[900px] font-display text-[clamp(38px,6vw,78px)] leading-[1.04] text-balance text-parchment">
            {page.title}
          </h1>
          {page.intro && (
            <p className="m-0 max-w-[640px] font-body text-[clamp(16px,1.5vw,19px)] leading-[1.75] font-normal text-pretty text-sand">
              {page.intro}
            </p>
          )}
        </div>
      </section>

      <section className="bg-cream py-20">
        <div className="mx-auto max-w-shell px-[26px]">
          <div
            className="max-w-[720px] font-body text-[17px] leading-[1.85] font-normal text-body
              [&_a]:text-crimson [&_a]:underline [&_a]:underline-offset-4
              [&_h2]:mt-13 [&_h2]:mb-[18px] [&_h2]:font-display [&_h2]:text-[30px] [&_h2]:leading-tight [&_h2]:text-text
              [&_h3]:mt-10 [&_h3]:mb-3.5 [&_h3]:font-display [&_h3]:text-[22px] [&_h3]:leading-tight [&_h3]:text-text
              [&_li]:mb-2.5 [&_ol]:mb-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-6 [&_p]:text-pretty [&_strong]:text-text [&_ul]:mb-6 [&_ul]:list-disc [&_ul]:pl-6"
          >
            <RichText data={page.body} />
          </div>

          <p className="mt-14 mb-0 font-label text-[11px] leading-[1.7] tracking-[0.06em] text-shadow uppercase">
            Last updated {formatDate(page.updatedAt)}
          </p>
        </div>
      </section>
    </main>
  )
}
