import Link from 'next/link'

import { AboutTabs } from '@/components/site/AboutTabs'
import { Plate } from '@/components/site/Plate'
import { getPayloadClient } from '@/lib/auth'
import { planComparePrice, planPrice } from '@/lib/format'
import type { Ensemble, Media, Plan, Program } from '@/payload-types'

export const dynamic = 'force-dynamic'

const STATS = [
  { value: '27', label: 'Gamelan sets in our care' },
  { value: '100+', label: 'Ensembles documented' },
  { value: '24', label: 'Years teaching visitors' },
  { value: '#9', label: 'of 154 in Denpasar' },
]

const HIRE_CARDS = [
  {
    title: 'Hire a troupe',
    body: 'Professional and semi-professional groups for festivals, openings, hotels and villas. Classical and archaic repertoire only — dance always with a full orchestra.',
    cta: 'Performances →',
    icon: <span className="size-[11px] rotate-45 bg-gold" />,
  },
  {
    title: 'Hire an expert',
    body: 'Speakers and consultants on Balinese gamelan, dance and culture for your event, seminar or university module.',
    cta: 'Experts →',
    icon: <span className="size-[11px] rotate-45 border border-gold" />,
  },
  {
    title: 'Record with us',
    body: 'Engineers who know where to put a microphone in front of bronze — multi-track or natural stereo, in our studio or on location.',
    cta: 'Recording →',
    icon: <span className="h-0.5 w-[11px] bg-gold" />,
  },
]

const PRESERVATION = [
  {
    kicker: 'In progress',
    accent: 'border-t-crimson text-crimson',
    title: 'Restoring a Gender Wayang',
    body: 'Four instruments, and only the original keys survive. The resonators, frames and carving all have to be rebuilt from scratch.',
  },
  {
    kicker: 'Seeking funding',
    accent: 'border-t-gold text-brass',
    title: 'A Javanese gamelan from the 1830s',
    body: 'A historic ensemble with Chinese connections and rare instruments dating back to the early nineteenth century, waiting on a restoration budget.',
  },
  {
    kicker: 'Archive',
    accent: 'border-t-bark-450 text-soft',
    title: 'Documentation & repatriation',
    body: 'Recordings, measurements and photographs of ensembles across Bali — including instruments returned to the villages they came from.',
  },
]

const sectionHeading = 'font-display text-[clamp(30px,4vw,52px)] leading-[1.12] text-balance'
const eyebrow = 'font-mono text-[11px] leading-none font-medium tracking-[0.3em] uppercase'

export default async function HomePage() {
  const payload = await getPayloadClient()

  const [programs, ensembles, plans] = await Promise.all([
    payload.find({ collection: 'programs', sort: 'order', limit: 4, depth: 1 }),
    payload.find({
      collection: 'ensembles',
      where: { featured: { equals: true } },
      sort: 'order',
      limit: 3,
      depth: 1,
    }),
    payload.find({
      collection: 'plans',
      where: { active: { equals: true }, edition: { equals: 'en' } },
      sort: 'durationMonths',
      limit: 1,
      depth: 0,
    }),
  ])

  const entryPlan = (plans.docs as Plan[])[0] ?? null

  return (
    <main>
      {/* ---------------------------------------------------------------- Hero */}
      <section className="relative grid min-h-[680px] place-items-center overflow-hidden bg-bark-700 px-[26px] pt-[90px] pb-[130px]">
        <Plate label="hero film still — Legong dancer, close crop" fill />
        <div className="absolute inset-0 bg-linear-to-b from-[#1c130d]/72 via-[#1c130d]/50 via-40% to-[#1c130d]/92" />

        <div className="hero-panel-weave clip-panel-l absolute inset-y-0 left-0 w-[15%] min-w-[74px] border-r border-gold-light/45 bg-linear-[100deg,#1b140e,#3a2718]" />
        <div className="hero-panel-weave clip-panel-r absolute inset-y-0 right-0 w-[15%] min-w-[74px] border-l border-gold-light/45 bg-linear-[260deg,#1b140e,#3a2718]" />

        <div className="animate-rise-in relative max-w-[820px] text-center">
          <div className="mb-[26px] font-mono text-[10px] leading-none font-medium tracking-[0.4em] text-gold-light uppercase">
            Family-based gamelan &amp; dance centre
          </div>
          <h1 className="m-0 mb-[26px] font-display text-[clamp(40px,7.4vw,92px)] leading-[1.02] tracking-[-0.02em] text-balance text-parchment">
            Bronze that still
            <br />
            remembers Bali
          </h1>
          <p className="mx-auto mb-10 max-w-[540px] font-body text-[clamp(16px,1.55vw,20px)] leading-[1.75] font-light text-pretty text-[#d3c3a8]">
            Twenty-seven gamelan sets live in our family compound in Kesiman. Some of them were
            nearly lost. All of them are still played.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/programs" className="btn btn-gold">
              Learn with us
            </Link>
            <Link href="/encyclopedia" className="btn btn-ghost">
              Read the encyclopedia
            </Link>
          </div>
        </div>

        <div className="band-weave absolute inset-x-0 bottom-0" />
      </section>

      {/* --------------------------------------------------------------- Stats */}
      <section className="border-b border-line bg-cream-deep">
        <div className="mx-auto grid max-w-shell grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-[26px] px-[26px] py-[34px]">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <div className="font-display text-[clamp(28px,3.2vw,40px)] leading-none text-crimson">
                {stat.value}
              </div>
              <div className="mt-2 font-mono text-xs leading-relaxed tracking-[0.1em] text-stone uppercase">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------- 01 Who we are */}
      <section id="about" className="bg-cream py-24">
        <div className="mx-auto max-w-shell px-[26px]">
          <div className="mb-11 flex items-center gap-4">
            <span className={`${eyebrow} text-brass`}>01 — Who we are</span>
            <div className="h-px flex-1 bg-[#d8cbb2]" />
            <div className="size-2 rotate-45 bg-gold" />
            <div className="size-3 rotate-45 border border-gold" />
            <div className="size-2 rotate-45 bg-gold" />
            <div className="h-px flex-1 bg-[#d8cbb2]" />
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] items-start gap-14">
            <div>
              <AboutTabs />
            </div>
            <div className="grid grid-cols-2 gap-3.5">
              <Plate label="temple ceremony at night" height={210} />
              <Plate label="gamelan gong kebyar, full set" height={210} className="mt-[34px]" />
              <Plate label="students in the pavilion" height={210} />
              <Plate label="rehearsal, evening" height={210} className="mt-[34px]" />
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- 02 Programs */}
      <section className="relative overflow-hidden bg-bark-500 py-25">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-[150px] -bottom-20 font-balinese text-[210px] leading-none text-gold-light/3"
        >
          ᬫᬮᬚᬄ
        </div>

        <div className="relative mx-auto max-w-shell px-[26px]">
          <div className="mb-[34px] flex items-center gap-4">
            <span className={`${eyebrow} text-gold-light`}>02 — Programs</span>
            <div className="h-px flex-1 bg-gold-light/28" />
          </div>

          <div className="mb-14 grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] items-end gap-12">
            <h2 className={`${sectionHeading} m-0 text-parchment`}>Come and put your hands on it</h2>
            <p className="m-0 max-w-[460px] font-body text-base leading-[1.8] font-light text-sand">
              Every session is led by working musicians and dancers, with an English-speaking
              ethnomusicologist to explain what you&rsquo;re hearing. Book at least two weeks ahead —
              we&rsquo;re a home, not a venue.
            </p>
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(196px,1fr))] gap-[18px]">
            {(programs.docs as Program[]).map((program) => (
              <Link
                key={program.id}
                href="/programs"
                className="block border border-gold-light/22 bg-bark-600 text-parchment transition-colors hover:border-gold-light hover:text-parchment"
              >
                <Plate
                  label={program.imageLabel ?? program.title}
                  image={program.image as Media | null}
                  height={180}
                  flush
                />
                <div className="p-[26px]">
                  {program.balineseTitle && (
                    <div className="font-balinese text-[19px] leading-[2] text-gold">
                      {program.balineseTitle}
                    </div>
                  )}
                  <h3 className="mt-2 mb-3 font-display text-[21px] leading-tight text-bone">
                    {program.title}
                  </h3>
                  <p className="mb-[18px] font-body text-sm leading-[1.7] font-light text-dust">
                    {program.summary}
                  </p>
                  <span className="font-mono text-[11px] leading-none font-medium tracking-[0.16em] text-gold-light uppercase">
                    {program.durationLabel ?? 'Read more'} →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------- 03 The compound */}
      <section className="relative bg-gold">
        <div className="mx-auto grid max-w-shell grid-cols-[repeat(auto-fit,minmax(320px,1fr))] items-center gap-13 px-[26px] py-[88px]">
          <div>
            <span className={`${eyebrow} text-[#452d0e]`}>03 — The compound</span>
            <h2 className={`${sectionHeading} mt-[22px] mb-5 text-text`}>
              Open-air, half garden, entirely lived in
            </h2>
            <p className="mb-[26px] max-w-[440px] font-body text-[16.5px] leading-[1.8] font-light text-pretty text-[#3a2a14]">
              A pavilion, a walled garden, a studio and an outdoor rehearsal ground — attached to our
              house. Frangipani drops onto the gongs. The neighbours know the repertoire.
            </p>
            <div className="flex flex-col gap-[11px] font-mono text-[13px] leading-relaxed tracking-[0.06em] text-[#452d0e] uppercase">
              {[
                'Open-air rehearsal grounds',
                'Outdoor gamelan set-up',
                'Recording studio & archive',
                'Garden pavilion for performances',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <i className="size-1.5 flex-none rotate-45 bg-bark-700" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            <Plate label="open-air rehearsal ground" height={260} />
            <Plate label="outdoor gamelan set-up" height={260} />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ 04 Collections */}
      <section className="bg-cream py-24">
        <div className="mx-auto max-w-shell px-[26px]">
          <div className="mb-[34px] flex items-center gap-4">
            <span className={`${eyebrow} text-brass`}>04 — Collections</span>
            <div className="h-px flex-1 bg-[#d8cbb2]" />
          </div>

          <div className="mb-12 grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] items-end gap-12">
            <h2 className={`${sectionHeading} m-0 text-text`}>
              Twenty-seven sets, each with a reason to exist
            </h2>
            <p className="m-0 max-w-[460px] font-body text-base leading-[1.8] font-light text-pretty text-body">
              Twenty-two in Bali, five in Aotearoa. Several were rebuilt from a handful of surviving
              keys; one is the only ensemble of its kind outside Indonesia.
            </p>
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(270px,1fr))] gap-[22px]">
            {(ensembles.docs as Ensemble[]).map((ensemble) => (
              <article key={ensemble.id} className="card">
                <Plate
                  label={ensemble.imageLabel ?? ensemble.name}
                  image={ensemble.image as Media | null}
                  height={210}
                  flush
                />
                <div className="p-[26px]">
                  {ensemble.statusLabel && <div className="kicker">{ensemble.statusLabel}</div>}
                  <h3 className="my-3 font-display text-[22px] leading-tight text-text">
                    {ensemble.name}
                  </h3>
                  <p className="m-0 font-body text-[14.5px] leading-[1.75] font-light text-muted">
                    {ensemble.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------- 05 Encyclopedia */}
      <section className="relative overflow-hidden bg-bark-700 py-24">
        <div className="band-weave-vertical absolute inset-y-0 left-0 w-[9px]" />
        <div className="mx-auto max-w-shell px-[26px]">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] items-center gap-15">
            <div className="flex gap-4">
              <Plate label="Encyclopedia cover — English" height={360} className="flex-1" />
              <Plate label="Ensiklopedia cover — Bahasa" height={320} className="mt-10 flex-1" />
            </div>

            <div>
              <span className={`${eyebrow} text-gold-light`}>05 — Encyclopedia</span>
              <h2 className={`${sectionHeading} mt-[22px] mb-5 text-parchment`}>
                Every Balinese gamelan we could find, written down
              </h2>
              <p className="mb-[26px] max-w-[470px] font-body text-[16.5px] leading-[1.8] font-light text-pretty text-sand">
                Four hundred pages. More than a hundred ensembles — ancient to contemporary, popular
                to extinct — each with links to video and audio, read as a flipbook in English or
                Bahasa Indonesia.
              </p>

              <div className="mb-[34px] flex flex-wrap gap-[26px]">
                {[
                  ['400+', 'Pages'],
                  ['100+', 'Ensembles'],
                  ['2', 'Languages'],
                ].map(([value, label]) => (
                  <div key={label}>
                    <strong className="block font-display text-[30px] leading-none font-normal text-gold-light">
                      {value}
                    </strong>
                    <span className="mt-[7px] block font-mono text-[11px] leading-relaxed tracking-[0.1em] text-shadow uppercase">
                      {label}
                    </span>
                  </div>
                ))}
              </div>

              {entryPlan && (
                <div className="mb-[26px] flex flex-wrap items-baseline gap-[18px] border border-gold-light/30 px-6 py-[22px]">
                  {planComparePrice(entryPlan) && (
                    <span className="font-body text-sm leading-normal text-dust line-through">
                      {planComparePrice(entryPlan)}
                    </span>
                  )}
                  <span className="font-display text-[30px] leading-none text-parchment">
                    {planPrice(entryPlan)}
                  </span>
                  <span className="font-body text-[13px] leading-normal text-sand">per month</span>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <Link href="/encyclopedia" className="btn btn-gold">
                  See all plans
                </Link>
                <Link href="/encyclopedia" className="btn btn-ghost">
                  Read a preview
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- Hire trio */}
      <section className="bg-cream py-24">
        <div className="mx-auto grid max-w-shell grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-[22px] px-[26px]">
          {HIRE_CARDS.map((card) => (
            <Link
              key={card.title}
              href="/hire"
              className="flex flex-col border border-line bg-paper p-[38px] text-inherit transition-colors hover:border-gold hover:text-inherit"
            >
              <div className="mb-[26px] grid size-11 place-items-center rounded-full border border-gold">
                {card.icon}
              </div>
              <div className="mb-3.5 font-display text-2xl leading-tight text-text">{card.title}</div>
              <p className="mb-[22px] flex-1 font-body text-[15px] leading-[1.75] font-light text-muted">
                {card.body}
              </p>
              <span className="font-mono text-[11px] leading-none font-medium tracking-[0.16em] text-crimson uppercase">
                {card.cta}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------- 06 Preservation */}
      <section className="border-t border-line bg-cream-deep py-24">
        <div className="mx-auto max-w-shell px-[26px]">
          <div className="mb-[34px] flex items-center gap-4">
            <span className={`${eyebrow} text-brass`}>06 — Preservation</span>
            <div className="h-px flex-1 bg-[#d3c4a8]" />
          </div>

          <h2 className={`${sectionHeading} mt-0 mb-[46px] max-w-[680px] text-text`}>
            Some of this music has four players left
          </h2>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-[22px]">
            {PRESERVATION.map((item) => {
              const [borderClass, textClass] = item.accent.split(' ')
              return (
                <div
                  key={item.title}
                  className={`border-t-[3px] bg-cream p-[34px] ${borderClass}`}
                >
                  <div
                    className={`mb-[18px] font-mono text-[10px] leading-none font-medium tracking-[0.2em] uppercase ${textClass}`}
                  >
                    {item.kicker}
                  </div>
                  <div className="mb-3.5 font-display text-[22px] leading-tight text-text">
                    {item.title}
                  </div>
                  <p className="m-0 font-body text-[15px] leading-[1.75] font-light text-muted">
                    {item.body}
                  </p>
                  {item.kicker === 'Archive' && (
                    <Link
                      href="/read"
                      className="mt-5 inline-block font-mono text-[11px] leading-none font-medium tracking-[0.16em] text-crimson uppercase"
                    >
                      Read the field notes →
                    </Link>
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-[34px] flex flex-wrap items-center justify-between gap-[26px] bg-bark-450 p-[38px]">
            <div>
              <div className="mb-2 font-display text-2xl leading-snug text-bone">
                Restoration is paid for by people, not grants
              </div>
              <div className="max-w-[460px] font-body text-[15px] leading-[1.7] font-light text-clay">
                Donations go through Yayasan Semara Gita Bhuana and should be tax deductible.
              </div>
            </div>
            <Link href="/donate" className="btn btn-gold">
              Donate
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
