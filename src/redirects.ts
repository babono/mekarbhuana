import type { Redirect } from 'next/dist/lib/load-custom-routes'

/**
 * Addresses from the old WordPress site, pointed at their new homes so links in
 * search results, bookmarks and old emails keep working after the domain moves.
 *
 * Built from the old site's Yoast sitemaps in October 2026. Old pages with no
 * counterpart yet are handled in `app/(frontend)/[slug]/page.tsx` instead, so a
 * page created later at the same address takes over without a code change.
 */

const ARTICLES: Record<string, string> = {
  'searching-for-sekati-the-mystery-of-a-balinese-gamelan-thought-to-be-extinct':
    'searching-for-sekati',
  'democracy-and-equality-in-balinese-gamelan-part-i': 'democracy-and-equality-in-balinese-gamelan',
  'what-is-the-difference-between-a-lesson-and-a-workshop-at-mekar-bhuana-2': 'lesson-or-workshop',
  'documentation-and-repatriation-of-gambang-from-banjar-bedhe-tabanan':
    'gambang-banjar-bedhe-tabanan',
}

/** Ensemble write-ups were posts on the old site; they now live inside the encyclopedia. */
const ENSEMBLE_POSTS = [
  'angklung',
  'angklung-klentangan',
  'baleganjur',
  'caruk-2',
  'five-tone-semara-pagulingan-2',
  'gambang',
  'gender-wayang',
  'gong-bheri',
  'javanese-gamelan-2',
  'pejogedan',
  'selonding-set-1',
  'selonding-set-2',
  'semara-kirang',
  'semara-patangian-set-1-2',
  'semara-patangian-set-2-2',
  'seven-tone-semara-pagulingan-set-1-2',
  'seven-tone-semara-pagulingan-set-2-2',
  'six-tone-semara-pagulingan-2',
]

const to = (source: string, destination: string): Redirect => ({
  source,
  destination,
  permanent: true,
})

/** The old flipbook plugin served books from the home page, as `/?r3d=<book>`. */
const flipbook = (book: string, destination: string): Redirect => ({
  source: '/',
  has: [{ type: 'query', key: 'r3d', value: book }],
  destination,
  permanent: true,
})

export const legacyRedirects: Redirect[] = [
  // Renamed pages
  to('/donations', '/donate'),
  to('/remote-lessons', '/programs'),
  to('/remote-workshops', '/programs'),

  // Articles
  to('/articles', '/read'),
  ...Object.entries(ARTICLES).map(([from, slug]) => to(`/articles/${from}`, `/read/${slug}`)),

  // Shop and checkout — the plans page replaces all of WooCommerce
  to('/shop', '/encyclopedia'),
  to('/cart', '/encyclopedia'),
  to('/checkout', '/encyclopedia'),
  to('/payment', '/encyclopedia'),
  to('/membership-join', '/encyclopedia'),
  to('/registration', '/join'),
  to('/product/:slug(.*ensiklopedia.*)', '/encyclopedia?edition=id'),
  to('/product/:slug*', '/encyclopedia'),
  to('/product-category/membership-id', '/encyclopedia?edition=id'),
  to('/product-category/:slug*', '/encyclopedia'),

  // The books themselves
  to('/encyclopedias/encyclopedia-of-balinese-gamelan-ensembles', '/encyclopedia/read?edition=en'),
  to('/encyclopedias/komplit-ensiklopedia-ansambel-gamelan-bali', '/encyclopedia/read?edition=id'),
  to('/encyclopedias/:slug*', '/encyclopedia'),
  to('/ebooks/buku-elektronik', '/encyclopedia?edition=id'),
  to('/ebooks/:slug*', '/encyclopedia'),
  flipbook('encyclopedia-of-balinese-gamelan-ensembles-full', '/encyclopedia/read?edition=en'),
  flipbook('ensiklopedia-ansambel-gamelan-bali-komplit', '/encyclopedia/read?edition=id'),
  flipbook('ensiklopedia-ansambel-gamelan-bali-preview', '/encyclopedia?edition=id'),
  flipbook('(.*)', '/encyclopedia'),
  {
    source: '/',
    has: [{ type: 'query', key: 'post_type', value: 'r3d' }],
    destination: '/encyclopedia',
    permanent: true,
  },

  // Ensembles, and the tags and categories that grouped them
  ...ENSEMBLE_POSTS.map((slug) => to(`/${slug}`, '/encyclopedia')),
  to('/tag/:slug*', '/encyclopedia'),
  to('/category/:slug*', '/encyclopedia'),

  // Accounts
  to('/my-account/:path*', '/account'),
  to('/membership-profile', '/account'),
  to('/login-success', '/account'),
  to('/thank-you', '/account'),
  to('/membership-login/password-reset', '/forgot-password'),
  to('/lost-password', '/forgot-password'),
  to('/membership-login', '/login'),
  to('/access-denied', '/login'),
  to('/wp-login.php', '/login'),
  to('/wp-admin/:path*', '/admin'),
]
