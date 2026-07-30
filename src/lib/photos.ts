/**
 * Which photograph in /public belongs to which document, keyed by slug.
 *
 * Serves two purposes from one place:
 *
 *  - `npm run seed` uploads these into Media and attaches them, so staff can
 *    swap any of them in the admin panel.
 *  - The pages fall back to the same file when a document has no Media attached
 *    yet. Without that, a database seeded before the photographs existed — or a
 *    fresh environment that has not been seeded — renders empty placeholders.
 *
 * An attached Media document always wins; see `Plate`.
 */
export type PhotoCollection = 'programs' | 'ensembles' | 'articles' | 'ebooks'

export const PHOTOS: Record<PhotoCollection, Record<string, { file: string; alt: string }>> = {
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

/** Public URL of the fallback photograph for a document, if one is mapped. */
export const photoFor = (
  collection: PhotoCollection,
  slug?: string | null,
): string | undefined => {
  if (!slug) return undefined
  const entry = PHOTOS[collection][slug]
  return entry ? `/${entry.file}` : undefined
}
