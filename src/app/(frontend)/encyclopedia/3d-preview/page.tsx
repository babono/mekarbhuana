import type { Metadata } from 'next'
import Link from 'next/link'

import {
  InstrumentFigure,
  InstrumentPreviewProvider,
  InstrumentTerm,
} from '@/components/site/instruments3d/InstrumentPreview'

// Prototype for the client; reachable by URL only.
export const metadata: Metadata = {
  title: '3D Instrument Preview — Prototype',
  robots: { index: false },
}

const page =
  'relative flex flex-col gap-6 bg-[#f6efe4] px-[clamp(22px,4vw,52px)] pt-12 pb-10 text-body'
const runningHead =
  'absolute top-5 inset-x-[clamp(22px,4vw,52px)] flex justify-between font-label text-[9px] tracking-[0.24em] text-shadow uppercase'
const prose = 'm-0 font-body text-[16px] leading-[1.8] text-body text-pretty'
const folio = 'mt-auto pt-4 text-center font-label text-[10px] tracking-[0.2em] text-shadow'

export default function InstrumentPreviewDemo() {
  return (
    <main className="bg-bark-700 px-[26px] pt-14 pb-24">
      <div className="mx-auto max-w-[1200px]">
        <div className="crumb">
          <Link href="/encyclopedia" className="text-gold-light">
            Encyclopedia
          </Link>{' '}
          / 3D preview
        </div>

        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-[640px]">
            <span className="mb-4 inline-block border border-gold-light/50 px-2.5 py-1.5 font-label text-[10px] leading-none tracking-[0.2em] text-gold-light uppercase">
              Prototype
            </span>
            <h1 className="m-0 font-display text-[clamp(30px,4vw,48px)] leading-[1.08] text-parchment">
              See the instruments in 3D as you read
            </h1>
            <p className="mt-4 mb-0 font-body text-[17px] leading-[1.7] text-sand">
              Hover over any photograph or underlined instrument name to see a turning 3D
              model of it. Click to open the model full size and turn it around yourself.
            </p>
          </div>
          <div className="flex flex-col gap-2 font-label text-[10px] tracking-[0.18em] text-dust uppercase">
            <span>Hover · preview</span>
            <span>Click · explore</span>
            <span>Phone · tap</span>
          </div>
        </div>

        <InstrumentPreviewProvider>
          {/* The open book. */}
          <div className="grid grid-cols-2 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.7)] max-[900px]:grid-cols-1">
            <article
              className={`${page} bg-[linear-gradient(to_left,rgba(51,32,23,0.14),transparent_7%)] max-[900px]:bg-none`}
            >
              <div className={runningHead}>
                <span>Encyclopedia of Balinese Gamelan Ensembles</span>
                <span className="max-[560px]:hidden">Bronze</span>
              </div>

              <div>
                <div className="kicker">Ensemble · North Bali, 1910s</div>
                <h2 className="mt-3 mb-0 font-display text-[clamp(28px,3vw,38px)] leading-tight text-text">
                  Gamelan Gong Kebyar
                </h2>
              </div>

              <p className={prose}>
                <span className="float-left mt-1.5 mr-2 font-display text-[54px] leading-[0.8] text-crimson">
                  K
                </span>
                ebyar means “to flare up”, and the style lives up to it: sudden bursts of sound,
                abrupt stops, and fast passages played by the whole ensemble at once. It took
                shape in the villages of north Bali early in the twentieth century and spread
                across the island within a generation.
              </p>

              <InstrumentFigure
                id="gangsa"
                number={1}
                caption="Gangsa players at a Mekar Bhuana class."
                height={260}
              />

              <p className={prose}>
                At the centre of the ensemble sit the <InstrumentTerm id="gangsa">gangsa</InstrumentTerm>,
                bronze-keyed metallophones that carry the elaborate interlocking figuration. Beside
                them, four players share the <InstrumentTerm id="reyong">reyong</InstrumentTerm>, a
                long row of kettle gongs whose sharp accents are one of the signatures of the style.
              </p>

              <div className={folio}>142</div>
            </article>

            <article className={`${page} bg-[linear-gradient(to_right,rgba(51,32,23,0.16),transparent_7%)] max-[900px]:bg-none`}>
              <div className={runningHead}>
                <span className="max-[560px]:hidden">Gamelan Gong Kebyar</span>
                <span>Instruments</span>
              </div>

              <InstrumentFigure
                id="reyong"
                number={2}
                caption="A reyong in the foreground of a rehearsal."
                height={200}
              />

              <p className={prose}>
                The music is organised in cycles. Smaller gongs mark its subdivisions, and each
                cycle closes on a stroke of the <InstrumentTerm id="gong">gong ageng</InstrumentTerm>,
                the largest instrument of all, hung from its own carved stand.
              </p>

              <div className="grid grid-cols-[1fr_1.1fr] items-start gap-6 max-[560px]:grid-cols-1">
                <InstrumentFigure
                  id="gong"
                  number={3}
                  caption="Gongs beneath a carved stand."
                  height={190}
                />
                <aside className="border-l-2 border-gold pl-4">
                  <div className="kicker">Compare</div>
                  <p className="mt-2.5 mb-0 font-body text-[14px] leading-[1.7] text-muted">
                    Far older than kebyar is the{' '}
                    <InstrumentTerm id="selonding">selonding</InstrumentTerm>, whose keys are
                    forged from iron rather than cast in bronze.
                  </p>
                </aside>
              </div>

              <InstrumentFigure
                id="selonding"
                number={4}
                caption="Iron selonding keys, before restringing."
                height={170}
              />

              <div className={folio}>143</div>
            </article>
          </div>
        </InstrumentPreviewProvider>

        <section className="mt-20 grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-8 border-t border-gold-light/20 pt-12">
          {[
            {
              step: '01',
              title: 'Scan',
              body: 'Each instrument in the collection is photographed from every side and turned into a 3D model with KIRI Engine.',
            },
            {
              step: '02',
              title: 'Upload',
              body: 'The model file is uploaded in the admin and linked to its pages in the encyclopedia. No code change per instrument.',
            },
            {
              step: '03',
              title: 'Read',
              body: 'Readers hover or tap the photographs to turn the instrument around, on desktop and phone.',
            },
          ].map((item) => (
            <div key={item.step}>
              <div className="font-label text-[11px] tracking-[0.24em] text-gold">{item.step}</div>
              <h3 className="mt-2 mb-2 font-display text-2xl text-parchment">{item.title}</h3>
              <p className="m-0 font-body text-[15px] leading-[1.7] text-sand">{item.body}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  )
}
