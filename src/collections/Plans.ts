import type { CollectionConfig } from 'payload'

import { anyone, isAdmin } from '@/access'
import { slugField } from '@/fields/slug'

export const Plans: CollectionConfig = {
  slug: 'plans',
  labels: { singular: 'Plan', plural: 'Plans' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'edition', 'durationMonths', 'price', 'active'],
    group: 'Members',
    description: 'Encyclopedia subscription tiers shown on /encyclopedia.',
  },
  access: {
    read: anyone,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: { description: 'Shown as the term, e.g. “6 months” or “6 bulan”.' },
    },
    slugField('name'),
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
    {
      name: 'durationMonths',
      type: 'number',
      required: true,
      min: 1,
      admin: { description: 'How long access lasts once the subscription is activated.' },
    },
    {
      name: 'currency',
      type: 'select',
      required: true,
      defaultValue: 'USD',
      options: [
        { label: 'USD', value: 'USD' },
        { label: 'IDR', value: 'IDR' },
      ],
    },
    {
      name: 'price',
      type: 'number',
      required: true,
      min: 0,
    },
    {
      name: 'compareAtPrice',
      type: 'number',
      min: 0,
      admin: { description: 'Struck-through “was” price. Leave blank when not on promotion.' },
    },
    {
      name: 'promoEndsAt',
      type: 'date',
      admin: {
        date: { pickerAppearance: 'dayOnly' },
        description: 'Shown as “until …” under a promotional price.',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
    },
    {
      name: 'badge',
      type: 'text',
      admin: { description: 'Corner ribbon, e.g. “Most taken”. Leave blank for none.' },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Draws the red border and the darker Subscribe button.' },
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar', description: 'Uncheck to retire a tier without deleting it.' },
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
