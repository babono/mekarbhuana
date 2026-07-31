import type { Metadata } from 'next'
import Link from 'next/link'

import { ContactForm } from '@/components/site/ContactForm'
import { Plate } from '@/components/site/Plate'

export const metadata: Metadata = {
  title: 'Visit & contact',
  description:
    'We’re a home as much as a centre, so everything is by appointment — two weeks’ notice for anything you want to sit in on.',
}

const detail = 'mb-6 font-body text-base leading-[1.85] font-normal text-text not-italic'

export default function ContactPage() {
  return (
    <main>
      <section className="relative overflow-hidden bg-bark-500 px-[26px] pt-[78px] pb-[66px]">
        <div className="mx-auto max-w-shell">
          <div className="crumb">
            <Link href="/" className="text-gold-light">
              Mekar Bhuana
            </Link>{' '}
            / Visit
          </div>
          <h1 className="m-0 mb-5 font-display text-[clamp(38px,6vw,78px)] leading-[1.04] text-balance text-parchment">
            Come and find us
          </h1>
          <p className="m-0 max-w-[540px] font-body text-[clamp(16px,1.5vw,19px)] leading-[1.75] font-normal text-pretty text-sand">
            We&rsquo;re a home as much as a centre, so everything is by appointment — two
            weeks&rsquo; notice for anything you want to sit in on.
          </p>
        </div>
      </section>

      <section className="bg-cream py-20">
        <div className="mx-auto grid max-w-[1120px] grid-cols-[repeat(auto-fit,minmax(300px,1fr))] items-start gap-14 px-[26px]">
          <div>
            <h2 className="mb-[26px] font-display text-[30px] leading-tight text-text">
              Write to us
            </h2>
            <ContactForm />
          </div>

          <div>
            <Plate label="map — Kesiman Kertalangu, Denpasar" src="/img-mb-27.jpg" height={240} />

            <div className="card mt-[22px] p-8">
              <div className="kicker mb-5">The centre</div>
              <address className={detail}>
                Jl. Gandapura III, no. 501X
                <br />
                Kesiman Kertalangu, Denpasar
                <br />
                Bali — Indonesia
              </address>

              <div className="mb-6 h-px bg-line-faint" />

              <div className="kicker mb-3.5">WhatsApp</div>
              <div className={detail}>
                +62 81 999 191104
                <br />
                +62 81 246 877087
              </div>

              <div className="mb-6 h-px bg-line-faint" />

              <div className="kicker mb-3.5">Open</div>
              <div className="font-body text-base leading-[1.85] font-normal text-text">
                Monday – Friday, 09:00 – 17:00 WITA
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
