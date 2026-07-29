import type { CollectionConfig } from 'payload'

import { anyone, isAdmin } from '@/access'
import { slugField } from '@/fields/slug'

export const Ensembles: CollectionConfig = {
  slug: 'ensembles',
  labels: { singular: 'Ensemble', plural: 'Ensembles' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'location', 'statusLabel', 'order'],
    group: 'Content',
    description: 'The gamelan sets in the centre’s care — the “Collections” section.',
  },
  access: {
    read: anyone,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField('name'),
    {
      name: 'statusLabel',
      type: 'text',
      admin: { description: 'Kicker above the name, e.g. “Restored 2019” or “Seven-tone”.' },
    },
    {
      name: 'location',
      type: 'select',
      defaultValue: 'bali',
      options: [
        { label: 'Bali', value: 'bali' },
        { label: 'Aotearoa', value: 'aotearoa' },
      ],
    },
    { name: 'description', type: 'textarea', required: true },
    { name: 'image', type: 'upload', relationTo: 'media' },
    {
      name: 'imageLabel',
      type: 'text',
      admin: { description: 'Placeholder caption used until a photograph is uploaded.' },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Show on the home page.' },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar' },
    },
  ],
  timestamps: true,
}
