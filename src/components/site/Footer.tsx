import Link from 'next/link'

import { Logo } from './Logo'

const EXPLORE = [
  { href: '/programs', label: 'Lessons & workshops' },
  { href: '/hire', label: 'Hire a troupe' },
  { href: '/encyclopedia', label: 'Encyclopedia subscriptions' },
  { href: '/read', label: 'Articles & e-books' },
  { href: '/login', label: 'Member login' },
  { href: '/join', label: 'Become a member' },
  { href: '/donate', label: 'Donations' },
  { href: '/contact', label: 'Contact' },
]

const SOCIAL = ['WA', 'IG', 'YT', 'FB', 'LI', 'TA']

const headingClass =
  'mb-[22px] font-body text-[11px] leading-none font-medium tracking-[0.26em] text-gold uppercase'

export function Footer() {
  return (
    <footer className="relative bg-bark-600 text-[#e6d9c0]">
      <div className="band-weave-thick" />

      <div className="mx-auto grid max-w-shell grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-12 px-[26px] pt-[70px] pb-10">
        <div>
          <div className="mb-[22px] flex items-center gap-[11px]">
            <Logo variant="mark" height={42} className="flex-none" />
            <div className="font-display text-[15px] leading-snug tracking-[0.19em] text-bone">
              MEKAR
              <br />
              BHUANA
            </div>
          </div>

          <p className="mb-5 max-w-[270px] font-body text-sm leading-[1.85] text-clay">
            A family-based gamelan and dance centre in Kesiman Kertalangu — teaching, restoring,
            recording and performing the older music of Bali since 2002.
          </p>

          <div className="font-mono text-[11px] leading-[1.9] tracking-[0.06em] text-smoke uppercase">
            Jl. Gandapura III no. 501X
            <br />
            Kesiman Kertalangu, Denpasar
            <br />
            Bali, Indonesia
            <br />
            Mon–Fri · 09:00–17:00 WITA
          </div>
        </div>

        <div>
          <div className={headingClass}>Explore</div>
          <div className="flex flex-col gap-[13px] font-body text-sm leading-snug">
            {EXPLORE.map((item) => (
              <Link key={item.href} href={item.href} className="text-[#e6d9c0] hover:text-gold-light">
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <div className={headingClass}>Reputation</div>
          <div className="border border-gold-light/35 p-[22px]">
            <strong className="font-display text-[26px] leading-none font-normal text-bone">#9</strong>
            <p className="mt-2 mb-4 font-body text-[13px] leading-relaxed text-clay">
              of 154 classes &amp; workshops in Denpasar — Tripadvisor, 112 reviews
            </p>
            <div className="flex gap-[5px]">
              {[0, 1, 2, 3, 4].map((i) => (
                <i key={i} className="block size-2.5 rounded-full bg-sage" />
              ))}
            </div>
            <div className="mt-4 font-body text-xs leading-[1.7] text-smoke italic">
              “A cultural immersion experience.”
              <br />
              “Learn dancing and play music.”
            </div>
          </div>
        </div>

        <div>
          <div className={headingClass}>Connect</div>
          <div className="mb-[26px] flex flex-wrap gap-2">
            {SOCIAL.map((label) => (
              <a
                key={label}
                href="/contact"
                className="grid size-[38px] place-items-center border border-gold-light/40 font-mono text-[10px] leading-none text-gold-light hover:bg-gold hover:text-bark-600"
              >
                {label}
              </a>
            ))}
          </div>
          <Link href="/donate" className="btn btn-sm btn-gold">
            Support the centre
          </Link>
        </div>
      </div>

      <div className="mx-auto flex max-w-shell flex-wrap justify-between gap-3.5 border-t border-[#e6d9c0]/14 px-[26px] py-[22px] font-mono text-[11px] leading-relaxed tracking-[0.06em] text-shadow uppercase">
        <div>© {new Date().getFullYear()} Mekar Bhuana Centre · Yayasan Semara Gita Bhuana</div>
        <div>No AI training on our archive · Terms</div>
      </div>
    </footer>
  )
}
