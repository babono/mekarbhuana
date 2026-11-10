import type { Metadata } from 'next'
import { Lato, Montserrat } from 'next/font/google'
import React from 'react'

import { AudioPill } from '@/components/site/AudioPill'
import { Footer } from '@/components/site/Footer'
import { Header } from '@/components/site/Header'
import { PlayerProvider } from '@/components/site/PlayerProvider'
import { WhatsAppWidget } from '@/components/site/WhatsAppWidget'

import './styles.css'

/**
 * Headings and titles. Variable, so every weight comes from one file. The
 * traditional character comes from the photography and the Balinese script,
 * so the type itself stays clean and modern.
 */
const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
})

/**
 * Everything else: body copy, labels, buttons and forms. Lato is static, so
 * only the weights the design uses are loaded (medium resolves to 400,
 * semibold to 700).
 */
const lato = Lato({
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-lato',
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
    <html lang="en" className={`${montserrat.variable} ${lato.variable}`}>
      <head>
        {/* Balinese script is used decoratively throughout; next/font has no
            Latin-subset equivalent, so it is loaded directly. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+Balinese&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {/* WCAG 2.4.1: keyboard users can jump past the header navigation. */}
        <a
          href="#content"
          className="sr-only z-200 bg-bark-450 px-5 py-3 font-body text-[15px] font-semibold text-bone focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:px-5 focus:py-3"
        >
          Skip to content
        </a>
        <PlayerProvider>
          <Header />
          <div id="content" tabIndex={-1} className="outline-none">
            {children}
          </div>
          <Footer />
          <AudioPill />
          <WhatsAppWidget />
        </PlayerProvider>
      </body>
    </html>
  )
}
