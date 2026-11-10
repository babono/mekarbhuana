import Link from 'next/link'

import { AboutTabs } from '@/components/site/AboutTabs'
import { HeroParallax } from '@/components/site/HeroParallax'
import { HomePopup } from '@/components/site/HomePopup'
import { Plate } from '@/components/site/Plate'
import { getEntryPlan, getFeaturedEnsembles, getHomePopup, getPrograms } from '@/lib/content'
import { planComparePrice, planPrice } from '@/lib/format'
import { photoFor } from '@/lib/photos'
import type { Media } from '@/payload-types'

// Statically generated; the daily window is a backstop — Payload's hooks purge
// this page the moment a program, ensemble or plan is saved.
export const revalidate = 86400

const STATS = [
  { value: '27', label: 'Gamelan sets in our care' },
  { value: '100+', label: 'Ensembles documented' },
  { value: '2000', label: 'Founded' },
  { value: '#9', label: 'of 154 in Denpasar' },
]

const HIRE_CARDS = [
  {
    title: 'Hire a troupe',
    body: 'Our professional and semi-professional troupes are available to perform at festivals, events, launchings, openings, hotels, villas and other occasions.',
    cta: 'Performances →',
    icon: <span className="size-[11px] rotate-45 bg-gold" />,
  },
  {
    title: 'Hire an expert',
    body: 'Hire an expert in Balinese gamelan, dance or Balinese culture in general for your event, seminar or workshop.',
    cta: 'Experts →',
    icon: <span className="size-[11px] rotate-45 border border-gold" />,
  },
  {
    title: 'Record with us',
    body: 'Record your gamelan group, someone else’s group, traditional gamelan music or your latest gamelan composition with us!',
    cta: 'Recording →',
    icon: <span className="h-0.5 w-[11px] bg-gold" />,
  },
]

const PRESERVATION = [
  {
    kicker: 'Current projects',
    accent: 'border-t-crimson text-crimson',
    title: 'Restoring Gender Wayang set #5',
    body: 'We are currently restoring Gender Wayang set #5 which consists of four instruments, but keys only as the original casings no longer exist.',
  },
  {
    kicker: 'Planned projects',
    accent: 'border-t-gold text-brass',
    title: 'A historic Javanese gamelan',
    body: 'We are in the process of trying to get funding to embark on a restoration project of a historic Javanese gamelan with Chinese connections and rare pakurmatan-style instruments that dates back to the early 1800s.',
  },
  {
    kicker: 'Portfolio',
    accent: 'border-t-bark-450 text-soft',
    title: 'Since 2000',
    body: 'We’ve been doing documentation, reconstruction, restoration and repatriation projects as well as performing and creating workshop and cultural immersion programs since 2000.',
  },
]

const sectionHeading = 'font-display text-[clamp(25px,3.3vw,43px)] leading-[1.12] text-balance'
const eyebrow = 'font-label text-[14px] leading-snug font-medium tracking-[0.01em] capitalize'

export default async function HomePage() {
  const [programs, ensembles, entryPlan, popup] = await Promise.all([
    getPrograms(),
    getFeaturedEnsembles(),
    getEntryPlan(),
    getHomePopup(),
  ])
  const popupImage = typeof popup?.image === 'object' ? popup.image : null

  return (
    <main>
      {popup?.enabled && popupImage?.url && (
        <HomePopup
          image={{
            url: popupImage.sizes?.wide?.url ?? popupImage.url,
            alt: popupImage.alt,
            width: popupImage.sizes?.wide?.url ? popupImage.sizes.wide.width : popupImage.width,
            height: popupImage.sizes?.wide?.url ? popupImage.sizes.wide.height : popupImage.height,
          }}
          link={popup.link || '/encyclopedia'}
          buttonLabel={popup.buttonLabel}
          delaySeconds={popup.delaySeconds ?? 2}
          hideForDays={popup.hideForDays ?? 3}
          version={popup.updatedAt ?? ''}
        />
      )}
      {/* ---------------------------------------------------------------- Hero */}
      <section className="relative grid min-h-screen place-items-center overflow-hidden bg-bark-700 px-[26px] pt-[140px] pb-[130px]">
        <HeroParallax src="/img-hero.jpg" alt="Legong dancer in full headdress" />
        <div className="absolute inset-0 bg-linear-to-b from-bark-700/72 via-bark-700/50 via-40% to-bark-700/92" />


        <div className="animate-rise-in relative max-w-[820px] text-center">
          <div className="mb-[26px] font-label text-[13px] leading-snug font-medium tracking-[0.01em] text-gold-light capitalize">
            Family based gamelan and dance centre
          </div>
          <h1 className="m-0 mb-[26px] font-display text-[clamp(33px,6.1vw,75px)] leading-[1.12] text-balance text-parchment">
            Mekar Bhuana
          </h1>
          <p className="mx-auto mb-10 max-w-[540px] font-body text-[clamp(16px,1.55vw,20px)] leading-[1.75] font-normal text-pretty text-sand">
            Mekar Bhuana means &ldquo;to blossom around the world&rdquo; &mdash; documenting,
            reconstructing and repatriating Balinese gamelan.
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
              <div className="font-display text-[clamp(23px,2.6vw,33px)] leading-none text-crimson">
                {stat.value}
              </div>
              <div className="mt-2 font-label text-[15px] leading-relaxed tracking-normal text-stone capitalize">
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
            <div className="h-px flex-1 bg-line" />
            <div className="size-2 rotate-45 bg-gold" />
            <div className="size-3 rotate-45 border border-gold" />
            <div className="size-2 rotate-45 bg-gold" />
            <div className="h-px flex-1 bg-line" />
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] items-start gap-14">
            <div>
              <AboutTabs />
            </div>
            <div className="grid grid-cols-2 gap-3.5">
              <Plate label="temple ceremony at night" src="/img-mb-29.jpg" height={210} />
              <Plate label="gamelan gong kebyar, full set" src="/img-mb-4.jpg" height={210} className="mt-[34px]" />
              <Plate label="students in the pavilion" src="/img-mb-10.jpg" height={210} />
              <Plate label="rehearsal, evening" src="/img-mb-6.jpg" height={210} className="mt-[34px]" />
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
            <h2 className={`${sectionHeading} m-0 text-parchment`}>
              Immerse yourself in the beauty of Balinese music and dance
            </h2>
            <p className="m-0 max-w-[460px] font-body text-base leading-[1.8] font-normal text-sand">
              Join our in-depth workshops led by English-speaking experts, including a native
              English-speaking ethnomusicologist. Note that since our centre is family based, we
              don&rsquo;t accept walk-ins. All bookings need to be made at least two weeks in
              advance via email.
            </p>
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(196px,1fr))] gap-[18px]">
            {programs.map((program) => (
              <Link
                key={program.id}
                href="/programs"
                className="block border border-gold-light/22 bg-bark-600 text-parchment transition-colors hover:border-gold-light hover:text-parchment"
              >
                <Plate
                  label={program.imageLabel ?? program.title}
                  image={program.image as Media | null}
                  src={photoFor('programs', program.slug)}
                  height={180}
                  flush
                />
                <div className="p-[26px]">
                  {program.balineseTitle && (
                    <div aria-hidden="true" className="font-balinese text-[19px] leading-[2] text-gold-light">
                      {program.balineseTitle}
                    </div>
                  )}
                  <h3 className="mt-2 mb-3 font-display text-[21px] leading-tight text-bone">
                    {program.title}
                  </h3>
                  <p className="mb-[18px] font-body text-[16px] leading-[1.7] font-normal text-dust">
                    {program.summary}
                  </p>
                  <span className="font-label text-[14px] leading-snug font-medium tracking-[0.01em] text-gold-light capitalize">
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
            <span className={`${eyebrow} text-bark-700`}>03 — Facilities</span>
            <h2 className={`${sectionHeading} mt-[22px] mb-5 text-text`}>
              Facilities
            </h2>
            <p className="mb-[26px] max-w-[440px] font-body text-[16.5px] leading-[1.8] font-normal text-pretty text-text">
              A family based centre, Mekar Bhuana is attached to our home and focussed around our
              garden, pavilion and studio areas.
            </p>
            <div className="flex flex-col gap-[11px] font-label text-[15px] leading-relaxed tracking-normal text-bark-700 capitalize">
              {[
                'Entrance gate',
                'Garden features',
                'Water features',
                'Open-air rehearsal grounds',
                'Outdoor gamelan set-up',
                'Pavilion gamelan set-up',
                'Resting pavilion',
                'Eco-friendly refreshment',
                'Green waste & recycling hub',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <i className="size-1.5 flex-none rotate-45 bg-bark-700" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            <Plate label="open-air rehearsal ground" src="/img-mb-26.jpg" height={260} />
            <Plate label="outdoor gamelan set-up" src="/img-mb-2.jpg" height={260} />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ 04 Collections */}
      <section className="bg-cream py-24">
        <div className="mx-auto max-w-shell px-[26px]">
          <div className="mb-[34px] flex items-center gap-4">
            <span className={`${eyebrow} text-brass`}>04 — Collections</span>
            <div className="h-px flex-1 bg-line" />
          </div>

          <div className="mb-12 grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] items-end gap-12">
            <h2 className={`${sectionHeading} m-0 text-text`}>
              Collections
            </h2>
            <p className="m-0 max-w-[460px] font-body text-base leading-[1.8] font-normal text-pretty text-body">
              We have more than 27 gamelan sets at Mekar Bhuana, with 22 at Mekar Bhuana in Bali and
              five at Mekar Bhuana Aotearoa in New Zealand.
            </p>
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(270px,1fr))] gap-[22px]">
            {ensembles.map((ensemble) => (
              <article key={ensemble.id} className="card">
                <Plate
                  label={ensemble.imageLabel ?? ensemble.name}
                  image={ensemble.image as Media | null}
                  src={photoFor('ensembles', ensemble.slug)}
                  height={210}
                  flush
                />
                <div className="p-[26px]">
                  {ensemble.statusLabel && <div className="kicker">{ensemble.statusLabel}</div>}
                  <h3 className="my-3 font-display text-[22px] leading-tight text-text">
                    {ensemble.name}
                  </h3>
                  <p className="m-0 font-body text-[16px] leading-[1.75] font-normal text-muted">
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
              <Plate label="Encyclopedia cover — English" src="/img-mb-8.jpg" height={360} className="flex-1" />
              <Plate label="Ensiklopedia cover — Bahasa" src="/img-mb-14.jpeg" height={320} className="mt-10 flex-1" />
            </div>

            <div>
              <span className={`${eyebrow} text-gold-light`}>05 — Encyclopedia</span>
              <h2 className={`${sectionHeading} mt-[22px] mb-5 text-parchment`}>
                Encyclopedia of Balinese Gamelan Ensembles
              </h2>
              <p className="mb-[26px] max-w-[470px] font-body text-[16.5px] leading-[1.8] font-normal text-pretty text-sand">
                From ancient to contemporary, popular to extinct: 400+ pages of over 100 different
                ensembles. Available to be read as a 3D flipbook with links to video and audio, in
                English and Indonesian.
              </p>

              <div className="mb-[34px] flex flex-wrap gap-[26px]">
                {[
                  ['400+', 'Pages'],
                  ['100+', 'Ensembles'],
                  ['2', 'Languages'],
                ].map(([value, label]) => (
                  <div key={label}>
                    <strong className="block font-display text-[23px] leading-none text-gold-light">
                      {value}
                    </strong>
                    <span className="mt-[7px] block font-label text-[15px] leading-relaxed tracking-normal text-smoke capitalize">
                      {label}
                    </span>
                  </div>
                ))}
              </div>

              {entryPlan && (
                <div className="mb-[26px] flex flex-wrap items-baseline gap-[18px] border border-gold-light/30 px-6 py-[22px]">
                  {planComparePrice(entryPlan) && (
                    <span className="font-body text-[15px] leading-normal text-dust line-through">
                      {planComparePrice(entryPlan)}
                    </span>
                  )}
                  <span className="font-display text-[23px] leading-none text-parchment">
                    {planPrice(entryPlan)}
                  </span>
                  <span className="font-body text-[14px] leading-normal text-sand">per month</span>
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
              <div className="mb-3.5 font-display text-[24px] leading-tight text-text">{card.title}</div>
              <p className="mb-[22px] flex-1 font-body text-[16px] leading-[1.75] font-normal text-muted">
                {card.body}
              </p>
              <span className="font-label text-[14px] leading-snug font-medium tracking-[0.01em] text-crimson capitalize">
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
            <span className={`${eyebrow} text-brass`}>06 — Projects</span>
            <div className="h-px flex-1 bg-line" />
          </div>

          <h2 className={`${sectionHeading} mt-0 mb-[46px] max-w-[680px] text-text`}>
            Find out about our completed, current and planned projects as well as how you can help
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
                    className={`mb-[18px] font-label text-[13px] leading-snug font-medium tracking-[0.01em] capitalize ${textClass}`}
                  >
                    {item.kicker}
                  </div>
                  <div className="mb-3.5 font-display text-[22px] leading-tight text-text">
                    {item.title}
                  </div>
                  <p className="m-0 font-body text-[16px] leading-[1.75] font-normal text-muted">
                    {item.body}
                  </p>
                  {item.kicker === 'Portfolio' && (
                    <Link
                      href="/read"
                      className="mt-5 inline-block font-label text-[14px] leading-snug font-medium tracking-[0.01em] text-crimson capitalize"
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
              <div className="mb-2 font-display text-[24px] leading-snug text-bone">
                Donate to support our projects
              </div>
              <div className="max-w-[460px] font-body text-[16px] leading-[1.7] font-normal text-bone">
                Donate to Mekar Bhuana via the Indonesian non-profit organisation Semara Gita Bhuana
                Foundation that supports us, which means that your donation should be tax deductible.
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
