import type { Metadata } from 'next'
import { Inter, Katibeh } from 'next/font/google'
import React from 'react'

import { AudioPill } from '@/components/site/AudioPill'
import { Footer } from '@/components/site/Footer'
import { Header } from '@/components/site/Header'
import { PlayerProvider } from '@/components/site/PlayerProvider'
import { WhatsAppWidget } from '@/components/site/WhatsAppWidget'

import './styles.css'

/**
 * Big headings and titles only. Katibeh is a single-weight display face (Latin
 * by Eduardo Tunni) and turns cramped below ~26px, where Inter takes over.
 */
const katibeh = Katibeh({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-katibeh',
  display: 'swap',
})

/**
 * Everything else: body copy, small headings, labels, buttons and forms.
 * Variable, so every weight the design asks for comes from one file.
 */
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
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
    <html lang="en" className={`${katibeh.variable} ${inter.variable}`}>
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
        <PlayerProvider>
          <Header />
          {children}
          <Footer />
          <AudioPill />
          <WhatsAppWidget />
        </PlayerProvider>
      </body>
    </html>
  )
}
