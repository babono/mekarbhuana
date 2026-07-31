import type { Metadata } from 'next'
import { Fraunces, Spectral } from 'next/font/google'
import React from 'react'

import { AudioPill } from '@/components/site/AudioPill'
import { Footer } from '@/components/site/Footer'
import { Gate } from '@/components/site/Gate'
import { Header } from '@/components/site/Header'
import { PlayerProvider } from '@/components/site/PlayerProvider'

import './styles.css'

/**
 * Headings and labels both. Requested as a variable font so the optical-size
 * axis is available: `opsz` is what lets one family carry a 90px hero title and
 * a 10px eyebrow without the small setting going spindly.
 *
 * SOFT and WONK are Fraunces' own axes and are not served unless asked for by
 * name — SOFT rounds the terminals, WONK swaps in the splayed, calligraphic
 * alternates. Both are set per-role in styles.css.
 */
const fraunces = Fraunces({
  subsets: ['latin'],
  axes: ['SOFT', 'WONK', 'opsz'],
  variable: '--font-fraunces',
  display: 'swap',
})

/**
 * Body copy. Drawn for long-form reading on screen, which the articles and the
 * encyclopedia need. Only the weights the design actually uses are requested;
 * italics are included because Payload rich text emits <em>.
 */
const spectral = Spectral({
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-spectral',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Mekar Bhuana — Balinese gamelan & dance centre, Denpasar',
    template: '%s — Mekar Bhuana',
  },
  description:
    'A family-based gamelan and dance centre in Kesiman Kertalangu, Denpasar — teaching, restoring, recording and performing the older music of Bali since 2002.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {

  return (
    <html lang="en" className={`${fraunces.variable} ${spectral.variable}`}>
      <head>
        {/* Balinese script is used decoratively throughout; next/font has no
            Latin-subset equivalent, so it is loaded directly. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+Balinese&display=swap"
          rel="stylesheet"
        />
        {/*
          The gate can only be dismissed with JavaScript, so never show it without.
          Written through dangerouslySetInnerHTML because a plain string child of
          <noscript> is escaped on the server but not on the client, which React
          reports as a hydration mismatch. The content is a fixed literal.
        */}
        <noscript
          dangerouslySetInnerHTML={{ __html: '<style>.gate{display:none}</style>' }}
        />
      </head>
      <body>
        <PlayerProvider>
          <Gate />
          <Header />
          {children}
          <Footer />
          <AudioPill />
        </PlayerProvider>
      </body>
    </html>
  )
}
