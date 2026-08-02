import Link from 'next/link'

import { WHATSAPP_PLAIN_URL } from '@/lib/whatsapp'

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

const SOCIAL = [
  { label: 'WhatsApp', href: WHATSAPP_PLAIN_URL, icon: '/ic-wa.svg' },
  { label: 'Instagram', href: 'https://www.instagram.com/mekarbhuana_centre/', icon: '/ic-ig.svg' },
  { label: 'YouTube', href: 'https://www.youtube.com/@MekarBhuana', icon: '/ic-youtube.svg' },
  { label: 'Facebook', href: 'https://www.facebook.com/MekarBhuanaCentre/', icon: '/ic-fb.svg' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/mekarbhuana/', icon: '/ic-linkedin.svg' },
  { label: 'X', href: 'https://twitter.com/MekarBhuana', icon: '/ic-x.svg' },
  {
    label: 'Spotify',
    href: 'https://open.spotify.com/artist/6uThi6E9IkxVMbhQjd8nZx',
    icon: '/ic-spotify.svg',
  },
]

/** Masked rather than drawn, so it reads on the dark panel. See `mask-icon`. */
const maskStyle = (icon: string) => ({ maskImage: `url('${icon}')`, WebkitMaskImage: `url('${icon}')` })

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

          <div className="font-label text-[11px] leading-[1.9] tracking-[0.06em] text-smoke uppercase">
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
          <div className="rounded-xl border-2 border-[#00AA6C] bg-white p-5 text-[#002B11] shadow-sm transition-all hover:shadow-md font-sans">
            <a
              href="https://www.tripadvisor.com/Attraction_Review-g297694-d3793345-Reviews-Mekar_Bhuana_Centre-Denpasar_Bali.html"
              target="_blank"
              rel="noopener noreferrer"
              className="group block text-[#002B11]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-trip-advisor.svg"
                alt="Tripadvisor"
                width={140}
                height={30}
                className="mb-3.5 block h-[26px] w-auto"
              />
              <div className="flex items-baseline gap-1.5">
                <strong className="font-sans text-2xl font-bold tracking-tight text-[#002B11]">
                  #9
                </strong>
                <span className="font-sans text-xs font-medium text-gray-700">
                  of 154 classes &amp; workshops in Denpasar
                </span>
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                <div className="flex gap-1" aria-label="5 out of 5 rating bubbles">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <span key={i} className="block size-3 rounded-full bg-[#00AA6C]" />
                  ))}
                </div>
                <span className="font-sans text-xs font-semibold text-[#00AA6C] group-hover:underline">
                  112 reviews
                </span>
              </div>
              <div className="mt-3.5 border-t border-gray-100 pt-3 font-sans text-xs leading-relaxed text-gray-600 italic">
                “A cultural immersion experience.”
                <br />
                “Learn dancing and play music.”
              </div>
            </a>
          </div>
        </div>

        <div>
          <div className={headingClass}>Connect</div>
          {/* Fixed four across rather than left to wrap: seven icons in this
              column break 6 + 1, which reads as an accident. */}
          <div className="mb-[26px] grid w-fit grid-cols-4 gap-2">
            {SOCIAL.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={item.label}
                className="grid size-[38px] place-items-center border border-gold-light/40 text-gold-light transition-colors hover:bg-gold hover:text-bark-600"
              >
                <span className="mask-icon size-[17px]" style={maskStyle(item.icon)} />
              </a>
            ))}
          </div>
          <Link href="/donate" className="btn btn-sm btn-gold">
            Support the centre
          </Link>
        </div>
      </div>

      <div className="mx-auto flex max-w-shell flex-wrap justify-between gap-3.5 border-t border-[#e6d9c0]/14 px-[26px] py-[22px] font-label text-[11px] leading-relaxed tracking-[0.06em] text-shadow uppercase">
        <div>© {new Date().getFullYear()} Mekar Bhuana Centre · Yayasan Semara Gita Bhuana</div>
        <div>No AI training on our archive · Terms</div>
      </div>
    </footer>
  )
}
