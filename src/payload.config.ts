import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Articles } from './collections/Articles'
import { Ebooks } from './collections/Ebooks'
import { Enquiries } from './collections/Enquiries'
import { Ensembles } from './collections/Ensembles'
import { Media } from './collections/Media'
import { Plans } from './collections/Plans'
import { Programs } from './collections/Programs'
import { Subscriptions } from './collections/Subscriptions'
import { Users } from './collections/Users'
import { withRevalidation } from './hooks/revalidate'
import { cloudinaryAdapter } from './storage/cloudinaryAdapter'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const cloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET,
)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' — Mekar Bhuana',
    },
  },
  collections: [
    // Content collections purge the cache of the pages that render them, so an
    // edit in the admin panel shows up on the static site within seconds.
    withRevalidation(Articles, 'articles', ['/read', '/']),
    withRevalidation(Ebooks, 'ebooks', ['/encyclopedia']),
    withRevalidation(Programs, 'programs', ['/programs', '/']),
    withRevalidation(Ensembles, 'ensembles', ['/']),
    Media,
    withRevalidation(Plans, 'plans', ['/encyclopedia', '/']),
    Subscriptions,
    Enquiries,
    Users,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URL || '',
  }),
  sharp,
  plugins: [
    // Only takes over when Cloudinary is configured. Without the credentials the
    // Media collection keeps writing to ./media, so a fresh clone still works and
    // local development needs no cloud account.
    ...(cloudinaryConfigured
      ? [
          cloudStoragePlugin({
            collections: {
              media: {
                adapter: cloudinaryAdapter({
                  cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
                  apiKey: process.env.CLOUDINARY_API_KEY!,
                  apiSecret: process.env.CLOUDINARY_API_SECRET!,
                  folder: process.env.CLOUDINARY_FOLDER || 'mekar-bhuana',
                }),
                disableLocalStorage: true,
              },
            },
          }),
        ]
      : []),
  ],
})
