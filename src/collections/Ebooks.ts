import type { CollectionConfig } from 'payload'

import { isAdmin, isAdminField, publishedOrAdmin } from '@/access'
import { isEntitledField } from '@/access/entitlement'
import { slugField } from '@/fields/slug'

export const Ebooks: CollectionConfig = {
  slug: 'ebooks',
  labels: { singular: 'E-book', plural: 'E-books' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'edition', 'pageCount', 'publishedAt'],
    group: 'Content',
    description: 'The Encyclopedia and any other long-form work behind the subscription.',
  },
  versions: { drafts: true },
  access: {
    read: publishedOrAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField(),
    {
      name: 'edition',
      type: 'select',
      required: true,
      defaultValue: 'en',
      options: [
        { label: 'English', value: 'en' },
        { label: 'Bahasa Indonesia', value: 'id' },
      ],
      index: true,
    },
    { name: 'summary', type: 'textarea', required: true },
    { name: 'cover', type: 'upload', relationTo: 'media' },
    {
      name: 'coverLabel',
      type: 'text',
      admin: { description: 'Placeholder caption used until a cover image is uploaded.' },
    },
    {
      type: 'row',
      fields: [
        { name: 'pageCount', type: 'number', admin: { width: '50%' } },
        { name: 'ensembleCount', type: 'number', admin: { width: '50%' } },
      ],
    },
    {
      name: 'previewContent',
      type: 'richText',
      admin: { description: 'The free sample chapter. Readable by anyone.' },
    },
    {
      name: 'previewPages',
      type: 'number',
      defaultValue: 12,
      min: 1,
      // Not secret — the reader is told how long the preview is — but it decides
      // how much of the PDF the server will hand to someone without a
      // subscription, so only staff may change it.
      access: { create: isAdminField, update: isAdminField },
      admin: {
        description:
          'How many pages a reader without an active subscription can open in the flipbook.',
      },
    },
    {
      name: 'readerUrl',
      type: 'text',
      // The flipbook link is the product; it must never appear in a public response.
      access: { read: isEntitledField },
      admin: {
        description: 'Flipbook URL. Only ever returned to readers with an active subscription.',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayOnly' } },
    },
  ],
  timestamps: true,
}
