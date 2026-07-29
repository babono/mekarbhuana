import type { CollectionConfig } from 'payload'

import { isAdmin, publishedOrAdmin } from '@/access'
import { isEntitledOrPublicDoc } from '@/access/entitlement'
import { slugField } from '@/fields/slug'

export const ARTICLE_CATEGORIES = [
  { label: 'Research', value: 'research' },
  { label: 'Restoration', value: 'restoration' },
  { label: 'Teaching', value: 'teaching' },
] as const

export const Articles: CollectionConfig = {
  slug: 'articles',
  labels: { singular: 'Article', plural: 'Articles' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'access', 'featured', 'publishedAt'],
    group: 'Content',
    description: 'Field notes — the “Read” section.',
  },
  versions: {
    drafts: true,
  },
  access: {
    read: publishedOrAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    slugField(),
    {
      name: 'category',
      type: 'select',
      required: true,
      defaultValue: 'research',
      options: [...ARTICLE_CATEGORIES],
      index: true,
    },
    {
      name: 'partLabel',
      type: 'text',
      admin: {
        description: 'Optional suffix shown beside the category, e.g. “Part I”.',
      },
    },
    {
      name: 'excerpt',
      type: 'textarea',
      required: true,
      maxLength: 320,
      admin: {
        description: 'Shown on the Read index and above the paywall. Always public.',
      },
    },
    {
      name: 'cover',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'coverLabel',
      type: 'text',
      admin: {
        description:
          'Placeholder caption used until a photograph is uploaded, e.g. “archival photograph, c.1920”.',
      },
    },
    {
      name: 'body',
      type: 'richText',
      // The paywall itself. Public articles return the body to everyone; members-only
      // articles return it only to readers inside their subscription window.
      access: {
        read: isEntitledOrPublicDoc,
      },
    },
    {
      name: 'access',
      type: 'select',
      required: true,
      defaultValue: 'public',
      options: [
        { label: 'Public', value: 'public' },
        { label: 'Members only', value: 'members' },
      ],
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Members-only articles show the excerpt, then a subscribe prompt.',
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Pin to the top of the Read index. The newest featured article wins.',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayOnly' },
      },
      hooks: {
        beforeChange: [
          ({ value, siblingData }) => {
            // Stamp a publish date the first time a draft goes live.
            if (!value && siblingData?._status === 'published') return new Date()
            return value
          },
        ],
      },
    },
    {
      name: 'author',
      type: 'text',
      admin: { position: 'sidebar' },
    },
  ],
  timestamps: true,
}
