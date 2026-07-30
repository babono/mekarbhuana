import type { Metadata } from 'next'
import Link from 'next/link'

import { Plate } from '@/components/site/Plate'

export const metadata: Metadata = {
  title: 'Hire',
  description:
    'Troupes, experts and recording — classical and archaic Balinese repertoire, played live.',
}

const heading = 'mb-5 font-display text-[clamp(28px,3.6vw,46px)] leading-[1.14] text-balance text-text'
const paragraph = 'font-body text-[16.5px] leading-[1.85] font-light text-pretty text-body'

export default function HirePage() {
  return (
    <main>
      <section className="relative overflow-hidden bg-bark-500 px-[26px] pt-[78px] pb-[66px]">
        <div className="mx-auto max-w-shell">
          <div className="crumb">
            <Link href="/" className="text-gold-light">
              Mekar Bhuana
            </Link>{' '}
            / Hire
          </div>
          <h1 className="m-0 mb-5 font-display text-[clamp(38px,6vw,78px)] leading-[1.04] text-balance text-parchment">
            Hire
          </h1>
          <p className="m-0 max-w-[540px] font-body text-[clamp(16px,1.5vw,19px)] leading-[1.75] font-light text-pretty text-sand">
            Troupes, experts and recording — classical and archaic Balinese repertoire, played live.
          </p>
        </div>
      </section>

      {/* Performances */}
      <section className="bg-cream px-[26px] py-[88px]">
        <div className="mx-auto grid max-w-shell grid-cols-[repeat(auto-fit,minmax(320px,1fr))] items-start gap-14">
          <div>
            <h2 className={heading}>Performances</h2>
            <p className={paragraph}>
              We have professional and semi-professional troupes, many of which have performed at
              major festivals in Indonesia and overseas. They&rsquo;re available for festivals,
              events, launches, openings, hotels and villas.
            </p>

            <div className="my-[26px] border-l-[3px] border-crimson bg-cream-deep px-[26px] py-6">
              <div className="mb-3.5 font-mono text-[11px] leading-none font-medium tracking-[0.2em] text-crimson uppercase">
                Before you write to us
              </div>
              <p className="m-0 font-body text-[15px] leading-[1.8] font-light text-body">
                We don&rsquo;t do modern gamelan, Bali fusion, or dancers performing to recorded
                music — the last of which is against Indonesian regulation anyway. Dance is always
                with a full orchestra, and our prices reflect that.
              </p>
            </div>

            <p className={`${paragraph} mb-[30px]`}>
              We also perform regularly at temple ceremonies across Bali. Write to us to find out
              whether we&rsquo;re playing while you&rsquo;re on the island — attendance is by
              donation.
            </p>

            <Link href="/contact" className="btn btn-sm btn-crimson">
              Enquire about a booking
            </Link>
          </div>
          <Plate label="full troupe on stage, festival" src="/img-mb-11.jpg" height={440} />
        </div>
      </section>

      {/* Experts */}
      <section className="bg-cream-deep px-[26px] py-[88px]">
        <div className="mx-auto grid max-w-shell grid-cols-[repeat(auto-fit,minmax(320px,1fr))] items-center gap-14">
          <Plate label="expert giving a talk to a seated group" src="/img-mb-7.jpg" height={380} />
          <div>
            <h2 className={heading}>Experts</h2>
            <p className={`${paragraph} mb-[30px]`}>
              Hire a specialist in Balinese gamelan, dance or culture for your event, seminar,
              university module or workshop — in English or Indonesian, in Bali or remotely.
            </p>
            <Link href="/contact" className="btn btn-sm btn-outline-gold">
              Ask about availability
            </Link>
          </div>
        </div>
      </section>

      {/* Recording */}
      <section className="bg-cream px-[26px] py-[88px]">
        <div className="mx-auto grid max-w-shell grid-cols-[repeat(auto-fit,minmax(320px,1fr))] items-center gap-14">
          <div>
            <h2 className={heading}>Recording</h2>
            <p className={`${paragraph} mb-[18px]`}>
              Bronze is difficult to record. The partials are inharmonic, the paired instruments beat
              against each other on purpose, and a microphone in the wrong place turns all of it to
              mush.
            </p>
            <p className={`${paragraph} mb-[26px]`}>
              Our small team records gamelan and nothing else. Two options: multi-track with spot
              microphones, easier to edit; or stereo with selective spots, more natural but harder to
              fix afterwards.
            </p>
            <Link href="/contact" className="btn btn-sm btn-crimson">
              Get a quote
            </Link>
          </div>
          <Plate label="live recording session, microphones on kendang" src="/img-mb-3.jpg" height={400} />
        </div>
      </section>
    </main>
  )
}
