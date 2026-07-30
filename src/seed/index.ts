/**
 * Seeds the content that the redesign prototype was drawn around.
 *
 * Safe to re-run: every document is matched on a natural key and updated rather
 * than duplicated, so this can be used to reset a staging database.
 *
 *   npm run seed
 */
import path from 'path'
import { getPayload } from 'payload'
import type { Payload } from 'payload'
import { fileURLToPath } from 'url'

import config from '../payload.config'

const publicDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../public')

type Seeded = { collection: string; created: number; updated: number }

/**
 * Puts a photograph from /public into the Media collection and returns its ID.
 *
 * Content images go through Media rather than being hardcoded so staff can swap
 * them in the admin panel later. Matched on filename, so re-running the seed
 * reuses the existing document instead of piling up duplicates.
 */
const uploadPhoto = async (
  payload: Payload,
  file: string,
  alt: string,
): Promise<string | undefined> => {
  const { docs } = await payload.find({
    collection: 'media',
    where: { filename: { equals: file } },
    limit: 1,
    depth: 0,
  })
  if (docs[0]) return String(docs[0].id)

  try {
    const doc = await payload.create({
      collection: 'media',
      data: { alt },
      filePath: path.join(publicDir, file),
      disableTransaction: true,
    })
    return String(doc.id)
  } catch (error) {
    payload.logger.warn(
      `Could not upload ${file}: ${error instanceof Error ? error.message : String(error)}`,
    )
    return undefined
  }
}

const upsert = async (
  payload: Payload,
  collection: 'programs' | 'ensembles' | 'plans' | 'articles' | 'ebooks',
  key: 'slug' | 'name',
  rows: Record<string, unknown>[],
): Promise<Seeded> => {
  let created = 0
  let updated = 0

  for (const data of rows) {
    const { docs } = await payload.find({
      collection,
      where: { [key]: { equals: data[key] } },
      limit: 1,
      depth: 0,
    })

    // Versioned collections write the document and its version in one transaction,
    // which Atlas shared tiers routinely abort as a write conflict. Seeding is
    // idempotent, so it does not need the atomicity.
    if (docs[0]) {
      await payload.update({
        collection,
        id: docs[0].id,
        data: data as never,
        disableTransaction: true,
      })
      updated += 1
    } else {
      await payload.create({ collection, data: data as never, disableTransaction: true })
      created += 1
    }
  }

  return { collection, created, updated }
}

/** Lexical needs a document shape, not a string; this builds the minimum valid one. */
const richText = (paragraphs: string[]) => ({
  root: {
    type: 'root',
    format: '' as const,
    indent: 0,
    version: 1,
    direction: 'ltr' as const,
    children: paragraphs.map((text) => ({
      type: 'paragraph',
      format: '' as const,
      indent: 0,
      version: 1,
      direction: 'ltr' as const,
      textFormat: 0,
      children: [
        {
          type: 'text',
          detail: 0,
          format: 0,
          mode: 'normal',
          style: '',
          text,
          version: 1,
        },
      ],
    })),
  },
})

const PROGRAMS = [
  {
    slug: 'lessons',
    title: 'Lessons',
    balineseTitle: 'ᬫᬮᬚᬄ',
    summary:
      'Sixty minutes, one instrument, one teacher. Private or in a group you bring yourself.',
    durationLabel: 'From 60 min',
    imageLabel: 'dance lesson in the pavilion',
    ctaLabel: 'Book a lesson',
    order: 1,
    body: [
      {
        text: 'One-off or package lessons with an expert, at our centre or remotely. Each one focuses on a specific gamelan instrument or a specific dance — not a survey.',
      },
      {
        text: 'Practical lessons run 60 minutes; package lessons run 90. If you want the history and sociology behind what you’re playing, book a workshop instead.',
      },
    ],
    note: 'Please note: you need to form your own group. We don’t have groups for you to join.',
  },
  {
    slug: 'workshops',
    title: 'Workshops',
    balineseTitle: 'ᬮᭀᬓᬓᬃᬬ',
    summary: 'Two to four hours with two experts — history, sociology and playing, in that order.',
    durationLabel: '2–4 hours',
    imageLabel: 'four students at gangsa, workshop',
    ctaLabel: 'Book a workshop',
    order: 2,
    body: [
      {
        text: 'Two, three or four hours with two experts, private or in a group you bring. Presentations, video, and local practitioners demonstrating — then you play.',
      },
      {
        text: 'This is the format for people who want to understand why a kotekan interlocks, why the pairs of instruments are deliberately tuned apart, and what the music is actually for.',
      },
    ],
  },
  {
    slug: 'cultural-immersion',
    title: 'Cultural immersion',
    balineseTitle: 'ᬫᭂᬮᬮᬶ',
    summary:
      'Multi-day study-abroad programmes: gamelan, dance, puppetry, cooking, ceremony, a final performance.',
    durationLabel: 'Multi-day',
    imageLabel: 'study-abroad group, mask painting',
    ctaLabel: 'Request the programme PDF',
    order: 3,
    body: [
      {
        text: 'For universities and groups planning a study abroad. We build the programme with you: gamelan, dance, puppetry, mask painting, cooking, tours, in-house rehearsals, a final student performance, a ceremony if the calendar allows, and certificates at the end.',
      },
    ],
    highlights: [
      { label: 'Gamelan & dance' },
      { label: 'Puppetry & masks' },
      { label: 'Ceremony visits' },
      { label: 'Final performance' },
    ],
  },
  {
    slug: 'family-activities',
    title: 'Family activities',
    balineseTitle: 'ᬓᬸᬮᬯᬃᬕ',
    summary:
      'Built for mixed ages — children, teenagers and adults at the same set of instruments.',
    durationLabel: 'All ages',
    imageLabel: 'family group with children at rindik',
    ctaLabel: 'Ask about dates',
    order: 4,
    body: [
      {
        text: 'Inclusive, genuinely fun, and educational without announcing it. Suitable for children, teenagers and adults together, based on minimum participant numbers.',
      },
    ],
  },
]

const ENSEMBLES = [
  {
    name: 'Semara Kirang',
    slug: 'semara-kirang',
    statusLabel: 'Restored 2019',
    location: 'bali',
    featured: true,
    order: 1,
    imageLabel: 'Semara Kirang — angklung set',
    description:
      'A very unusual angklung from Lombok, restored and reconstructed. Its four sweet-toned keys had lost the lowest one entirely — kirang means missing.',
  },
  {
    name: 'Selonding Set 2',
    slug: 'selonding-set-2',
    statusLabel: 'Aotearoa · 2013',
    location: 'aotearoa',
    featured: true,
    order: 2,
    imageLabel: 'Selonding Set 2 — iron keys',
    description:
      'Modelled on the Bugbug formation — 48 keys, smaller and lower than the set in Bali, and the only one of its kind outside Indonesia.',
  },
  {
    name: 'Semara Pagulingan',
    slug: 'semara-pagulingan',
    statusLabel: 'Seven-tone',
    location: 'aotearoa',
    featured: true,
    order: 3,
    imageLabel: 'Seven-tone Semara Pagulingan',
    description:
      'Tuned higher than our Balinese set and built smaller — a different instrument to sit at, though the repertoire is the same.',
  },
]

const PLANS = [
  {
    name: '1 month',
    slug: 'en-1-month',
    edition: 'en',
    durationMonths: 1,
    currency: 'USD',
    price: 5,
    compareAtPrice: 7.5,
    promoEndsAt: '2026-08-07',
    order: 1,
    active: true,
    description: 'A month of access to the English edition — 400+ pages, 100+ ensembles.',
  },
  {
    name: '6 months',
    slug: 'en-6-months',
    edition: 'en',
    durationMonths: 6,
    currency: 'USD',
    price: 27.5,
    compareAtPrice: 41.25,
    promoEndsAt: '2026-08-07',
    badge: 'Most taken',
    featured: true,
    order: 2,
    active: true,
    description: 'Six months — long enough to actually work through it, chapter by chapter.',
  },
  {
    name: '1 year',
    slug: 'en-1-year',
    edition: 'en',
    durationMonths: 12,
    currency: 'USD',
    price: 50,
    compareAtPrice: 75,
    promoEndsAt: '2026-08-07',
    order: 3,
    active: true,
    description: 'A full year, for researchers and university libraries citing it regularly.',
  },
  {
    name: '1 bulan',
    slug: 'id-1-bulan',
    edition: 'id',
    durationMonths: 1,
    currency: 'IDR',
    price: 40000,
    order: 1,
    active: true,
    description:
      'Akses satu bulan ke Ensiklopedia Ansambel Gamelan Bali — 400+ halaman, 100+ ansambel.',
  },
  {
    name: '6 bulan',
    slug: 'id-6-bulan',
    edition: 'id',
    durationMonths: 6,
    currency: 'IDR',
    price: 220000,
    featured: true,
    order: 2,
    active: true,
    description: 'Enam bulan akses penuh ke versi Bahasa Indonesia.',
  },
  {
    name: '1 tahun',
    slug: 'id-1-tahun',
    edition: 'id',
    durationMonths: 12,
    currency: 'IDR',
    price: 400000,
    order: 3,
    active: true,
    description: 'Satu tahun akses — untuk peneliti dan perpustakaan kampus.',
  },
]

const ARTICLES = [
  {
    slug: 'searching-for-sekati',
    title: 'Searching for Sekati — the mystery of a Balinese gamelan thought to be extinct',
    category: 'research',
    featured: true,
    access: 'public',
    author: 'Mekar Bhuana',
    publishedAt: '2026-06-18',
    coverLabel: 'Searching for Sekati — archival photograph, c.1920',
    excerpt:
      'Bali has an astounding number of ensemble types, and the number keeps growing. Somewhere in that richness, one of the oldest may still be sitting in a village storeroom.',
    _status: 'published',
    body: richText([
      'Bali has an astounding number of gamelan ensemble types, and the number keeps growing as villages revive, adapt and recombine what they have. Somewhere in that richness, one of the oldest may still be sitting in a storeroom behind a temple, unplayed and unlisted.',
      'Sekati is documented in Javanese court records and in a handful of Balinese palm-leaf sources, but no complete set has been confirmed on the island in living memory. What survives are fragments: a pair of keys here, a resonator frame there, and the memory of an old man who says he heard it as a boy.',
      'This is an account of four years of looking — the villages we visited, the measurements we took, and what we think the evidence adds up to.',
    ]),
  },
  {
    slug: 'lesson-or-workshop',
    title: 'What is the difference between a lesson and a workshop?',
    category: 'teaching',
    access: 'public',
    author: 'Mekar Bhuana',
    publishedAt: '2026-05-02',
    coverLabel: 'students with instruments, group photo',
    excerpt:
      'The question we get more than any other from people writing in for the first time.',
    _status: 'published',
    body: richText([
      'The question we get more than any other from people writing in for the first time. The short answer: a lesson puts an instrument in your hands; a workshop explains why the instrument is built the way it is.',
      'A practical lesson runs sixty minutes and focuses on one instrument or one dance. You will not get a survey of Balinese music — you will get a piece, or part of a piece, and the technique it demands.',
      'A workshop runs two to four hours with two experts. There is presentation, video, and demonstration by local practitioners before you play anything. It is the right format if you want the history and the sociology as well as the notes.',
    ]),
  },
  {
    slug: 'democracy-and-equality-in-balinese-gamelan',
    title: 'Democracy and equality in Balinese gamelan',
    category: 'research',
    partLabel: 'Part I',
    access: 'members',
    author: 'Mekar Bhuana',
    publishedAt: '2026-04-11',
    coverLabel: 'dancers and gamelan, ceremony',
    excerpt:
      'Bali still has a deeply traditional society — the late Made Wijaya went as far as calling it mediaeval, and functioning.',
    _status: 'published',
    body: richText([
      'Bali still has a deeply traditional society — the late Made Wijaya went as far as calling it mediaeval, and functioning. The banjar, the village council, meets and decides in ways that would be recognisable several centuries ago.',
      'Gamelan sits inside that structure rather than beside it. A gong kebyar ensemble has no conductor and no first chair; the drummer leads, but by cue rather than authority, and the parts interlock in a way that makes any single player’s absence audible.',
      'That is the argument this series takes up: that the ensemble is not a metaphor for Balinese social organisation but an instance of it, with the same mechanisms for consensus and the same tolerance for friction.',
    ]),
  },
  {
    slug: 'gambang-banjar-bedhe-tabanan',
    title: 'Documentation and repatriation of gambang from Banjar Bedhe, Tabanan',
    category: 'restoration',
    access: 'public',
    author: 'Mekar Bhuana',
    publishedAt: '2026-03-06',
    coverLabel: 'gambang instrument in storage, dusty',
    excerpt:
      'Measuring, photographing and returning a set that had not been played in living memory.',
    _status: 'published',
    body: richText([
      'Measuring, photographing and returning a set that had not been played in living memory. The gambang at Banjar Bedhe had been in storage long enough that nobody in the banjar could say when it was last used in a ceremony.',
      'Our work there was documentation first: dimensions of every key and resonator, photographs of the carving, and recordings of each pitch so the tuning could be analysed rather than guessed at.',
      'The set went back to the banjar. That is the point of the exercise — the instruments belong where they were made, and a measured, photographed, recorded set is far more likely to be played again than one nobody has looked at in fifty years.',
    ]),
  },
]

const EBOOKS = [
  {
    slug: 'encyclopedia-of-balinese-gamelan-ensembles',
    title: 'Encyclopedia of Balinese Gamelan Ensembles',
    edition: 'en',
    pageCount: 400,
    ensembleCount: 100,
    coverLabel: 'cover — English edition',
    publishedAt: '2026-01-15',
    _status: 'published',
    summary:
      'From ancient to contemporary, popular to extinct. Over a hundred ensembles across four hundred pages, each with links to video and audio.',
    previewContent: richText([
      'The angklung of Bali is not the shaken bamboo instrument of West Java that shares its name. It is a bronze ensemble, usually four-tone, and it is the sound most Balinese associate with cremation.',
      'This entry covers the four-tone and five-tone variants, the regional differences in tuning between north and south, and the repertoire that survives in each.',
    ]),
  },
  {
    slug: 'ensiklopedia-ansambel-gamelan-bali',
    title: 'Ensiklopedia Ansambel Gamelan Bali',
    edition: 'id',
    pageCount: 400,
    ensembleCount: 100,
    coverLabel: 'sampul — edisi Bahasa Indonesia',
    publishedAt: '2026-01-15',
    _status: 'published',
    summary:
      'Dari kuno hingga kontemporer, populer hingga punah. Lebih dari seratus ansambel dalam empat ratus halaman.',
    previewContent: richText([
      'Angklung Bali bukanlah instrumen bambu yang digoyang seperti di Jawa Barat meskipun namanya sama. Ini adalah ansambel perunggu, biasanya bernada empat, dan merupakan suara yang diasosiasikan orang Bali dengan ngaben.',
      'Entri ini mencakup varian empat nada dan lima nada, perbedaan laras antara Bali utara dan selatan, serta repertoar yang masih bertahan di masing-masing daerah.',
    ]),
  },
]

/**
 * Photographs shipped in /public, matched to the document that should carry them.
 * Keyed by slug so a re-run reattaches the same image without duplicating it.
 */
const PHOTOS: Record<string, Record<string, { file: string; alt: string }>> = {
  programs: {
    lessons: { file: 'img-mb-17.jpeg', alt: 'Hands playing a gangsa with a mallet' },
    workshops: { file: 'img-mb-20.jpg', alt: 'Students seated at gamelan instruments' },
    'cultural-immersion': {
      file: 'img-mb-19.jpg',
      alt: 'Study-abroad group making offerings together',
    },
    'family-activities': {
      file: 'img-mb-18.webp',
      alt: 'Family group with dancers in full costume',
    },
  },
  ensembles: {
    'semara-kirang': { file: 'img-mb-5.jpg', alt: 'Bamboo angklung instruments' },
    'selonding-set-2': { file: 'img-mb-12.jpg', alt: 'Iron selonding keys resting on stones' },
    'semara-pagulingan': { file: 'img-mb-13.jpeg', alt: 'A red gamelan set in its store room' },
  },
  articles: {
    'searching-for-sekati': {
      file: 'img-mb-9.jpeg',
      alt: 'Instrument keys laid out for measuring',
    },
    'lesson-or-workshop': { file: 'img-mb-25.jpg', alt: 'A mixed-age group at bamboo instruments' },
    'democracy-and-equality-in-balinese-gamelan': {
      file: 'img-mb-16.jpg',
      alt: 'A dancer performing in front of the gamelan',
    },
    'gambang-banjar-bedhe-tabanan': {
      file: 'img-mb-15.jpg',
      alt: 'Bronze keys on their wooden frames',
    },
  },
  ebooks: {
    'encyclopedia-of-balinese-gamelan-ensembles': {
      file: 'img-mb-8.jpg',
      alt: 'Carved gamelan panel and gongs',
    },
    'ensiklopedia-ansambel-gamelan-bali': {
      file: 'img-mb-14.jpeg',
      alt: 'Young players in costume at the instruments',
    },
  },
}

/** The field each collection stores its photograph in. */
const PHOTO_FIELD: Record<string, string> = {
  programs: 'image',
  ensembles: 'image',
  articles: 'cover',
  ebooks: 'cover',
}

/** Attach the photographs, then point each document at its Media row. */
const attachPhotos = async (payload: Payload): Promise<void> => {
  for (const [collection, bySlug] of Object.entries(PHOTOS)) {
    const field = PHOTO_FIELD[collection]

    for (const [slug, photo] of Object.entries(bySlug)) {
      const mediaId = await uploadPhoto(payload, photo.file, photo.alt)
      if (!mediaId) continue

      const { docs } = await payload.find({
        collection: collection as 'programs',
        where: { slug: { equals: slug } },
        limit: 1,
        depth: 0,
      })
      if (!docs[0]) continue

      await payload.update({
        collection: collection as 'programs',
        id: docs[0].id,
        data: { [field]: mediaId } as never,
        disableTransaction: true,
      })
    }
  }
}

const seed = async () => {
  const payload = await getPayload({ config })

  // Sequential on purpose: the versioned collections take a transaction per write,
  // and running these concurrently makes MongoDB abort them as write conflicts.
  const results: Seeded[] = [
    await upsert(payload, 'programs', 'slug', PROGRAMS),
    await upsert(payload, 'ensembles', 'slug', ENSEMBLES),
    await upsert(payload, 'plans', 'slug', PLANS as Record<string, unknown>[]),
    await upsert(payload, 'articles', 'slug', ARTICLES as Record<string, unknown>[]),
    await upsert(payload, 'ebooks', 'slug', EBOOKS as Record<string, unknown>[]),
  ]

  await attachPhotos(payload)
  payload.logger.info('photographs attached from /public')

  for (const result of results) {
    payload.logger.info(
      `${result.collection}: ${result.created} created, ${result.updated} updated`,
    )
  }

  const admins = await payload.find({
    collection: 'users',
    where: { roles: { contains: 'admin' } },
    limit: 1,
    depth: 0,
  })

  if (admins.docs.length === 0) {
    payload.logger.info(
      'No admin user exists yet — create one at /admin, then re-run this to keep content in step.',
    )
  }

  process.exit(0)
}

// Awaited at the top level: `payload run` exits as soon as the module settles, so
// a floating promise here would terminate the process before anything is written.
await seed()
