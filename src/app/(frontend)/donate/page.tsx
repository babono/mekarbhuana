import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Donations',
  description:
    'Donate to Mekar Bhuana via the Indonesian non-profit organisation Semara Gita Bhuana Foundation, which means that your donation should be tax deductible.',
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
          <div className="mb-[22px] font-label text-[14px] leading-snug tracking-[0.01em] text-bone capitalize">
            <Link href="/" className="text-cream">
              Mekar Bhuana
            </Link>{' '}
            / Donations
          </div>
          <h1 className="m-0 mb-5 font-display text-[clamp(31px,4.9vw,64px)] leading-[1.12] text-balance text-parchment">
            Donations
          </h1>
          <p className="m-0 max-w-[560px] font-body text-[clamp(16px,1.5vw,19px)] leading-[1.75] font-normal text-pretty text-parchment/85">
            Donate to Mekar Bhuana via the Indonesian non-profit organisation Semara Gita Bhuana
            Foundation that supports us, which means that your donation should be tax deductible.
          </p>
        </div>
      </section>

      <section className="bg-cream py-20">
        <div className="mx-auto grid max-w-[1000px] grid-cols-[repeat(auto-fit,minmax(300px,1fr))] items-start gap-[26px] px-[26px]">
          <div className="card p-[38px]">
            <div className="kicker mb-[18px]">Option one</div>
            <h2 className="m-0 mb-2.5 font-display text-[20px] leading-tight text-text">
              Bank transfer
            </h2>
            <p className="m-0 mb-[26px] font-body text-[16px] leading-[1.75] font-normal text-crimson">
              Please make sure that these are 100% correct so that your donation is not returned.
            </p>

            <dl className="m-0">
              {BANK_DETAILS.map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between gap-4 border-b border-dotted border-line py-3.5 font-label text-[15px] leading-relaxed last:border-b-0"
                >
                  <dt className="m-0 text-shadow capitalize">{label}</dt>
                  <dd className="m-0 text-right text-text">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="flex flex-col gap-[22px]">
            <div className="bg-bark-450 p-[38px]">
              <div className="mb-[18px] font-label text-[13px] leading-snug font-medium tracking-[0.01em] text-bone capitalize">
                Option two
              </div>
              <h2 className="m-0 mb-3.5 font-display text-[20px] leading-tight text-bone">
                Card or e-wallet
              </h2>
              <p className="m-0 mb-7 font-body text-[16px] leading-[1.8] font-normal text-bone">
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
              <p className="m-0 font-body text-[16px] leading-[1.8] font-normal text-muted">
                Donate to support our projects: restoring our antique gamelan, reconstructing
                ensembles lost to history, and recording previously unrecorded court and archaic style
                gamelan pieces.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
