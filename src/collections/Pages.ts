import type { CollectionConfig, Field, TextFieldSingleValidation } from 'payload'

import { anyone, isAdmin } from '@/access'
import { slugField } from '@/fields/slug'

/** Addresses the site's own routes already answer; a page there would never be seen. */
const RESERVED = new Set([
  'account',
  'admin',
  'api',
  'contact',
  'donate',
  'encyclopedia',
  'forgot-password',
  'hire',
  'join',
  'login',
  'programs',
  'read',
  'reset-password',
])

/**
 * Standalone pages that do not belong to any other collection: terms, help,
 * and whatever else staff want to publish at a top-level address.
 *
 * A page is live at `/<slug>` the moment it is saved. Several addresses from
 * the old WordPress site are kept here on purpose, so links to them still work.
 */
export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Page', plural: 'Pages' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'updatedAt'],
    group: 'Content',
    description:
      'Terms, help and other standalone pages. Each one appears at the address in its slug, e.g. /terms-conditions.',
  },
  access: {
    read: anyone,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      ...slugField('title'),
      validate: ((value) =>
        value && RESERVED.has(value)
          ? `"/${value}" is already a page on the site — choose another slug.`
          : true) satisfies TextFieldSingleValidation,
    } as Field,
    {
      name: 'intro',
      type: 'textarea',
      admin: { description: 'One or two sentences under the title. Also used by search engines.' },
    },
    { name: 'body', type: 'richText', required: true },
  ],
  timestamps: true,
}
