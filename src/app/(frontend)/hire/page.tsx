import type { Metadata } from 'next'
import Link from 'next/link'

import { Plate } from '@/components/site/Plate'

export const metadata: Metadata = {
  title: 'Hire',
  description:
    'Performances, experts and recording. We only perform classical and archaic Balinese music and dance.',
}

const heading = 'mb-5 font-display text-[clamp(23px,3vw,38px)] leading-[1.14] text-balance text-text'
const paragraph = 'font-body text-[16.5px] leading-[1.85] font-normal text-pretty text-body'

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
          <h1 className="m-0 mb-5 font-display text-[clamp(31px,4.9vw,64px)] leading-[1.12] text-balance text-parchment">
            Hire
          </h1>
          <p className="m-0 max-w-[540px] font-body text-[clamp(16px,1.5vw,19px)] leading-[1.75] font-normal text-pretty text-sand">
            Performances, experts and recording. We only perform classical and archaic Balinese
            music and dance.
          </p>
        </div>
      </section>

      {/* Performances */}
      <section className="bg-cream px-[26px] py-[88px]">
        <div className="mx-auto grid max-w-shell grid-cols-[repeat(auto-fit,minmax(320px,1fr))] items-start gap-14">
          <div>
            <h2 className={heading}>Performances</h2>
            <p className={paragraph}>
              Mekar Bhuana has both professional and semi-professional troupes, many of which have
              performed at major festivals and events both in Indonesia and overseas. Our troupes are
              available to perform at festivals, events, launchings, openings, hotels, villas and
              other occasions.
            </p>

            <div className="my-[26px] border-l-[3px] border-crimson bg-cream-deep px-[26px] py-6">
              <div className="mb-3.5 font-label text-[14px] leading-snug font-medium tracking-[0.01em] text-crimson capitalize">
                Before you write to us
              </div>
              <p className="m-0 font-body text-[16px] leading-[1.8] font-normal text-body">
                If you are looking for modern gamelan performances, Bali fusion, or just dancers
                using recorded music (which is actually against Indonesian government regulation), we
                don&rsquo;t offer any of these things. We only perform classical and archaic Balinese
                music and dance, and dance is always with a full orchestra, and our prices reflect
                this.
              </p>
            </div>

            <p className={`${paragraph} mb-[30px]`}>
              We also regularly perform at temple ceremonies across Bali. Contact us to see if we are
              performing when you are in Bali (attendance is by donation).
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
              Hire an expert in Balinese gamelan, dance or Balinese culture in general for your
              event, seminar or workshop. Contact us for prices and availability.
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
              Record your gamelan group, someone else&rsquo;s group, traditional gamelan music or your
              latest gamelan composition with us! We have a small, but professional team of audio
              experts who specialize in recording gamelan music. Recording gamelan requires intimate
              knowledge of gamelan instruments and the timbre and harmonics they produce, as well as
              understanding microphone positioning, ambience, recording location and desired
              balancing and sound texture: this is where our service differs from many other
              recording services in Bali.
            </p>
            <p className={`${paragraph} mb-[26px]`}>
              We have two price options: multi-track recording using multiple spot microphones (more
              easily editable); and multi-track recording using only stereo microphones and perhaps
              specific spot microphones (more natural sound but not easily editable).
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
