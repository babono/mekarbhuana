import type { Metadata } from 'next'
import { IBM_Plex_Mono, Karla, Marcellus } from 'next/font/google'
import React from 'react'

import { AudioPill } from '@/components/site/AudioPill'
import { Footer } from '@/components/site/Footer'
import { Gate } from '@/components/site/Gate'
import { Header } from '@/components/site/Header'
import { PlayerProvider } from '@/components/site/PlayerProvider'

import './styles.css'

const marcellus = Marcellus({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-marcellus',
  display: 'swap',
})

const karla = Karla({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-karla',
  display: 'swap',
})

const plexMono = IBM_Plex_Mono({
  weight: ['400', '500'],
  subsets: ['latin'],
  variable: '--font-plex-mono',
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
    <html lang="en" className={`${marcellus.variable} ${karla.variable} ${plexMono.variable}`}>
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
