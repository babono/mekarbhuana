'use client'

import Link from 'next/link'
import { useState } from 'react'

const PANELS = [
  {
    tab: 'The centre',
    heading: 'A house that happens to be full of bronze',
    paragraphs: [
      'Mekar Bhuana is not an institution. It is a family compound — a garden, a pavilion, a kitchen, and rehearsal space that fills with sound most evenings. Guests sit on the same mats the players do.',
      'We work on the older and rarer end of Balinese music: archaic ensembles, seven-tone tunings, instruments that had gone quiet in their own villages. Much of what we teach explains why the music sounds the way it does — the rice calendar, the ceremonies, the agrarian year that shaped it.',
      'Because we are family-based, we do not take walk-ins. Everything is booked at least two weeks ahead, by email.',
    ],
  },
  {
    tab: 'Mekar Bhuana Aotearoa',
    heading: 'Five sets, twelve thousand kilometres away',
    paragraphs: [
      'Mekar Bhuana Aotearoa holds five of our gamelan sets in New Zealand, including a Selonding and a seven-tone Semara Pagulingan tuned a little higher than its sibling in Bali.',
      'It exists so that students in the southern hemisphere can sit at real instruments rather than recordings — and so that Balinese teachers have somewhere to travel to.',
    ],
  },
  {
    tab: 'Founders & team',
    heading: 'An ethnomusicologist, a dancer, and a village of teachers',
    paragraphs: [
      'The centre is run by its founders — a native English-speaking ethnomusicologist and a Balinese dancer and teacher — alongside instructors drawn from villages across the island, each with their own regional style and repertoire.',
      'That means explanations in fluent English, and playing that is unmistakably local.',
    ],
  },
]

export function AboutTabs() {
  const [active, setActive] = useState(0)
  const panel = PANELS[active]

  return (
    <>
      <div className="mb-[46px] flex flex-wrap gap-2">
        {PANELS.map((item, index) => (
          <button
            key={item.tab}
            type="button"
            onClick={() => setActive(index)}
            className={`cursor-pointer border px-6 py-[15px] font-body text-[12px] leading-none font-medium tracking-[0.13em] uppercase transition-colors ${
              index === active
                ? 'border-bark-450 bg-bark-450 text-bone'
                : 'border-line-strong text-soft hover:border-gold hover:text-crimson'
            }`}
          >
            {item.tab}
          </button>
        ))}
      </div>

      <h2 className="mb-6 font-display text-[clamp(28px,3.6vw,46px)] leading-[1.14] text-balance text-text">
        {panel.heading}
      </h2>

      <div className="flex flex-col gap-5">
        {panel.paragraphs.map((text) => (
          <p key={text.slice(0, 40)} className="font-body text-[17px] leading-[1.85] font-light text-pretty text-body">
            {text}
          </p>
        ))}
      </div>

      <div className="mt-[34px] flex flex-wrap gap-3">
        <Link href="/contact" className="btn btn-sm btn-dark">
          Visit the centre
        </Link>
        <Link href="/programs" className="btn btn-sm btn-outline">
          See the calendar
        </Link>
      </div>
    </>
  )
}
