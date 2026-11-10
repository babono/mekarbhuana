'use client'

import Link from 'next/link'
import { useState } from 'react'

const PANELS = [
  {
    tab: 'The centre',
    heading: 'Mekar Bhuana Centre',
    paragraphs: [
      'Mekar Bhuana means “to blossom around the world”, symbolizing the hope that the ancient music and dance music of Bali will be better known again not just in Bali but also in the rest of the world.',
      'Mekar Bhuana educates about the intrinsic value of Balinese art-forms which more than a millennium ago were inspired by the natural beauty of the island’s tropical surroundings. Mekar Bhuana does this by teaching about their roots in agriculture and how this agrarian lifestyle gave birth to the complex art-forms that Bali is famous for today.',
      'Note that since our centre is family based, we don’t accept walk-ins. All bookings need to be made at least two weeks in advance via email.',
    ],
  },
  {
    tab: 'Mekar Bhuana Aotearoa',
    heading: 'Mekar Bhuana Aotearoa',
    paragraphs: [
      'In March 2022, Vaughan and Evie founded Mekar Bhuana Aotearoa in Wellington, New Zealand with the aim of further spreading the beauty of rare classical and archaic Balinese music around the world.',
      'Mekar Bhuana Aotearoa offered both gamelan and dance courses at Miramar & Maupuia Community Centre, Wellington. Watch this space should we offer courses again in the future.',
    ],
  },
  {
    tab: 'Founders & team',
    heading: 'Meet our founders and teams',
    paragraphs: [
      'Vaughan Hatch established the gamelan side of Mekar Bhuana in 2000 and Putu Evie added the dance side in 2004.',
      'While studying classical gamelan in Bali on a Dharmasiswa scholarship between 1997 and 1999, Vaughan became aware of how negatively mass tourism was affecting traditional performing art forms. Few classical gamelan ensembles had been recorded and many gamelan were either no longer played or had been melted down. In the year 2000, Vaughan chanced upon purchasing and restoring a disused antique Semara Pagulingan gamelan and came up with the concept of Mekar Bhuana, with the aim of documenting, reconstructing and repatriating endangered classical gamelan and its extensive repertoire.',
      'In 2002 he met Putu Evie Suyadnyani, a talented Legong dancer and singer who is now his wife, who also shared the vision. Together they combined the music and dance aspects, professionalizing Mekar Bhuana in 2004. As well as running the centre and Mekar Bhuana Sourcing, they enjoy playing Selonding, Angklung, Semara Kirang and Gender Wayang together with their family group at ceremonies around Bali.',
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
            aria-pressed={index === active}
            onClick={() => setActive(index)}
            className={`cursor-pointer border px-6 py-[15px] font-body text-[13px] leading-none font-medium tracking-[0.01em] capitalize transition-colors ${
              index === active
                ? 'border-bark-450 bg-bark-450 text-bone'
                : 'border-line-strong text-soft hover:border-gold hover:text-crimson'
            }`}
          >
            {item.tab}
          </button>
        ))}
      </div>

      <div aria-live="polite">
        <h2 className="mb-6 font-display text-[clamp(23px,3vw,38px)] leading-[1.14] text-balance text-text">
          {panel.heading}
        </h2>

        <div className="flex flex-col gap-5">
          {panel.paragraphs.map((text) => (
            <p
              key={text.slice(0, 40)}
              className="font-body text-[17px] leading-[1.85] font-normal text-pretty text-body"
            >
              {text}
            </p>
          ))}
        </div>
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
