import type { CollectionConfig } from 'payload'

import { anyone, isAdmin } from '@/access'
import { slugField } from '@/fields/slug'

export const Programs: CollectionConfig = {
  slug: 'programs',
  labels: { singular: 'Program', plural: 'Programs' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'durationLabel', 'order'],
    group: 'Content',
    description: 'Lessons, workshops, cultural immersion and family activities.',
  },
  access: {
    read: anyone,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField(),
    {
      name: 'balineseTitle',
      type: 'text',
      admin: { description: 'Balinese script shown above the heading, e.g. ᬫᬮᬚᬄ.' },
    },
    {
      name: 'summary',
      type: 'textarea',
      required: true,
      admin: { description: 'Short version, used on the home page card.' },
    },
    {
      name: 'durationLabel',
      type: 'text',
      admin: { description: 'Card footer, e.g. “From 60 min” or “Multi-day”.' },
    },
    {
      name: 'body',
      type: 'array',
      labels: { singular: 'Paragraph', plural: 'Paragraphs' },
      admin: { description: 'Full description shown on the Programs page.' },
      fields: [{ name: 'text', type: 'textarea', required: true }],
    },
    {
      name: 'note',
      type: 'textarea',
      admin: { description: 'Highlighted caveat, e.g. “you need to form your own group”.' },
    },
    {
      name: 'highlights',
      type: 'array',
      labels: { singular: 'Highlight', plural: 'Highlights' },
      admin: { description: 'Small boxed labels, e.g. “Gamelan & dance”.' },
      fields: [{ name: 'label', type: 'text', required: true }],
    },
    { name: 'image', type: 'upload', relationTo: 'media' },
    {
      name: 'imageLabel',
      type: 'text',
      admin: { description: 'Placeholder caption used until a photograph is uploaded.' },
    },
    {
      name: 'ctaLabel',
      type: 'text',
      defaultValue: 'Book a lesson',
      admin: { position: 'sidebar' },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar', description: 'Lower numbers sort first.' },
    },
  ],
  timestamps: true,
}
