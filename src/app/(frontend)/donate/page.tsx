import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Donations',
  description:
    'Donations reach us through Yayasan Semara Gita Bhuana, the Indonesian non-profit that supports the centre.',
}

const BANK_DETAILS = [
  ['Bank', 'PT. Bank Mandiri (Persero) Tbk.'],
  ['Account name', 'Semara Gita Bhuana'],
  ['Account no.', '1450016157980'],
  ['SWIFT', 'BMRIIDJA'],
  ['Bank code', '008'],
  ['Branch', 'Jl. By Pass Ngurah Rai 104, Denpasar Sanur 80228'],
]

export default function DonatePage() {
  return (
    <main>
      <section className="relative overflow-hidden bg-crimson px-[26px] pt-[78px] pb-[66px]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -bottom-[60px] font-balinese text-[190px] leading-none text-cream/8"
        >
          ᬪᬓ᭄ᬢᬶ
        </div>

        <div className="relative mx-auto max-w-shell">
          <div className="mb-[22px] font-label text-[11px] leading-none tracking-[0.2em] text-cream/65 uppercase">
            <Link href="/" className="text-cream">
              Mekar Bhuana
            </Link>{' '}
            / Donations
          </div>
          <h1 className="m-0 mb-5 font-display text-[clamp(38px,6vw,78px)] leading-[1.04] text-balance text-parchment">
            Keep the bronze playing
          </h1>
          <p className="m-0 max-w-[560px] font-body text-[clamp(16px,1.5vw,19px)] leading-[1.75] font-normal text-pretty text-parchment/85">
            Donations reach us through Yayasan Semara Gita Bhuana, the Indonesian non-profit that
            supports the centre — which also means your gift should be tax deductible.
          </p>
        </div>
      </section>

      <section className="bg-cream py-20">
        <div className="mx-auto grid max-w-[1000px] grid-cols-[repeat(auto-fit,minmax(300px,1fr))] items-start gap-[26px] px-[26px]">
          <div className="card p-[38px]">
            <div className="kicker mb-[18px]">Option one</div>
            <h2 className="m-0 mb-2.5 font-display text-[26px] leading-tight text-text">
              Bank transfer
            </h2>
            <p className="m-0 mb-[26px] font-body text-[14.5px] leading-[1.75] font-normal text-crimson">
              Please check every line — an incorrect detail means the transfer comes back to you.
            </p>

            <dl className="m-0">
              {BANK_DETAILS.map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between gap-4 border-b border-dotted border-[#d3c4a8] py-3.5 font-label text-[13px] leading-relaxed last:border-b-0"
                >
                  <dt className="m-0 text-shadow uppercase">{label}</dt>
                  <dd className="m-0 text-right text-text">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="flex flex-col gap-[22px]">
            <div className="bg-bark-450 p-[38px]">
              <div className="mb-[18px] font-label text-[10px] leading-none font-medium tracking-[0.2em] text-gold-light uppercase">
                Option two
              </div>
              <h2 className="m-0 mb-3.5 font-display text-[26px] leading-tight text-bone">
                Card or e-wallet
              </h2>
              <p className="m-0 mb-7 font-body text-[15px] leading-[1.8] font-normal text-clay">
                Faster, and it works from anywhere. Write to us and we will send a payment link for
                the amount you choose.
              </p>
              <Link href="/contact" className="btn btn-gold block w-full">
                Ask for a payment link
              </Link>
            </div>

            <div className="border border-line p-[30px]">
              <div className="mb-3 font-display text-[19px] leading-snug text-text">
                Where it goes
              </div>
              <p className="m-0 font-body text-[14.5px] leading-[1.8] font-normal text-muted">
                Restoration materials and smithing, instructor fees, documentation trips, and
                returning instruments to the villages that made them.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
