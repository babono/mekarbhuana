import type { Metadata } from 'next'
import Link from 'next/link'

import { Plate } from '@/components/site/Plate'
import { getPayloadAndUser, readAsUser } from '@/lib/auth'
import type { Media, Program } from '@/payload-types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Learn with us',
  description:
    'Four ways in — from a single hour at a gangsa to a two-week study-abroad programme. All bookings need two weeks’ notice.',
}

export default async function ProgramsPage() {
  const { payload, user } = await getPayloadAndUser()

  const { docs } = await payload.find({
    collection: 'programs',
    sort: 'order',
    limit: 20,
    depth: 1,
    ...readAsUser(user),
  })

  const programs = docs as Program[]

  return (
    <main>
      <section className="relative overflow-hidden bg-bark-500 px-[26px] pt-[78px] pb-[66px]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-[60px] -bottom-[70px] font-balinese text-[200px] leading-none text-gold-light/6"
        >
          ᬫᬮᬚᬄ
        </div>

        <div className="relative mx-auto max-w-shell">
          <div className="crumb">
            <Link href="/" className="text-gold-light">
              Mekar Bhuana
            </Link>{' '}
            / Programs
          </div>
          <h1 className="m-0 mb-5 font-display text-[clamp(38px,6vw,78px)] leading-[1.04] text-balance text-parchment">
            Learn with us
          </h1>
          <p className="m-0 max-w-[540px] font-body text-[clamp(16px,1.5vw,19px)] leading-[1.75] font-light text-pretty text-sand">
            Four ways in — from a single hour at a gangsa to a two-week study-abroad programme. All
            bookings need two weeks&rsquo; notice.
          </p>
        </div>
      </section>

      {programs.length === 0 && (
        <section className="bg-cream py-20">
          <div className="mx-auto max-w-shell px-[26px]">
            <p className="font-body text-[17px] leading-[1.8] font-light text-muted">
              Programs will be listed here once they are added in the admin panel.
            </p>
          </div>
        </section>
      )}

      {programs.map((program, index) => {
        const flipped = index % 2 === 1
        const image = (
          <Plate
            label={program.imageLabel ?? program.title}
            image={program.image as Media | null}
            height={420}
          />
        )
        const body = (
          <div>
            {program.balineseTitle && (
              <div className="font-balinese text-2xl leading-[2] text-gold">
                {program.balineseTitle}
              </div>
            )}
            <h2 className="mt-1.5 mb-5 font-display text-[clamp(28px,3.6vw,46px)] leading-[1.14] text-balance text-text">
              {program.title}
            </h2>

            <div className="flex flex-col gap-[18px]">
              {(program.body ?? []).map((block) => (
                <p
                  key={block.id ?? block.text.slice(0, 40)}
                  className="font-body text-[16.5px] leading-[1.85] font-light text-pretty text-body"
                >
                  {block.text}
                </p>
              ))}
              {(program.body ?? []).length === 0 && (
                <p className="font-body text-[16.5px] leading-[1.85] font-light text-pretty text-body">
                  {program.summary}
                </p>
              )}
            </div>

            {program.note && (
              <p className="mt-[18px] mb-[30px] border-l-2 border-gold pl-4 font-body text-[14.5px] leading-[1.8] font-light text-crimson">
                {program.note}
              </p>
            )}

            {(program.highlights ?? []).length > 0 && (
              <div className="mt-[30px] mb-[30px] grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3">
                {(program.highlights ?? []).map((item) => (
                  <div
                    key={item.id ?? item.label}
                    className="border border-line p-3.5 font-mono text-xs leading-normal tracking-[0.06em] text-soft uppercase"
                  >
                    {item.label}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-[30px] flex flex-wrap gap-3">
              <Link href="/contact" className="btn btn-sm btn-crimson">
                {program.ctaLabel ?? 'Book a lesson'}
              </Link>
              <Link href="/contact" className="btn btn-sm btn-outline">
                Check availability
              </Link>
            </div>
          </div>
        )

        return (
          <section
            key={program.id}
            className={`px-[26px] py-[88px] ${flipped ? 'bg-cream-deep' : 'bg-cream'}`}
          >
            <div className="mx-auto grid max-w-shell grid-cols-[repeat(auto-fit,minmax(320px,1fr))] items-center gap-14">
              {flipped ? (
                <>
                  {image}
                  {body}
                </>
              ) : (
                <>
                  {body}
                  {image}
                </>
              )}
            </div>
          </section>
        )
      })}

      <section className="bg-bark-500 px-[26px] py-[88px]">
        <div className="mx-auto max-w-shell">
          <div className="mb-11 grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] items-center gap-12">
            <div>
              <span className="font-mono text-[11px] leading-none font-medium tracking-[0.3em] text-gold-light uppercase">
                Instructors
              </span>
              <h2 className="mt-5 mb-[18px] font-display text-[clamp(28px,3.6vw,44px)] leading-[1.14] text-balance text-parchment">
                Teachers from a dozen different villages
              </h2>
              <p className="m-0 max-w-[460px] font-body text-base leading-[1.8] font-light text-sand">
                Each brings their own regional style. Several have taught foreign students for two
                decades; all of them still play in their own banjar.
              </p>
            </div>
            <Plate label="instructor teaching a foreign student" src="/img-mb-22.jpeg" height={300} />
          </div>

          <div className="border border-gold-light/28 bg-bark-600 p-[34px]">
            <div className="mb-[26px] flex flex-wrap items-center justify-between gap-[18px]">
              <div className="font-display text-[22px] leading-snug text-bone">Centre schedule</div>
              <div className="font-mono text-[11px] leading-relaxed tracking-[0.1em] text-shadow uppercase">
                GMT+08 · Central Indonesia Time
              </div>
            </div>
            <Plate label="embedded booking calendar — month view" height={300} />
            <div className="mt-[26px] flex flex-wrap gap-3">
              <Link href="/contact" className="btn btn-sm btn-gold">
                Book
              </Link>
              <Link href="/contact" className="btn btn-sm btn-ghost">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
