import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access'

export const ENQUIRY_TOPICS = [
  { label: 'Lessons or workshops', value: 'lessons' },
  { label: 'Cultural immersion / study abroad', value: 'immersion' },
  { label: 'Hiring a troupe or expert', value: 'hire' },
  { label: 'Recording', value: 'recording' },
  { label: 'Encyclopedia subscription', value: 'subscription' },
  { label: 'Donations', value: 'donations' },
] as const

export const Enquiries: CollectionConfig = {
  slug: 'enquiries',
  labels: { singular: 'Enquiry', plural: 'Enquiries' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'topic', 'handled', 'createdAt'],
    group: 'Members',
    description: 'Messages from the contact form.',
  },
  access: {
    // Submissions arrive through a server action that supplies the payload directly,
    // so nothing here needs to be creatable by an unauthenticated client.
    create: () => false,
    read: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'email', type: 'email', required: true },
    {
      name: 'topic',
      type: 'select',
      required: true,
      options: [...ENQUIRY_TOPICS],
    },
    { name: 'message', type: 'textarea', required: true },
    {
      name: 'handled',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Tick once someone has replied.' },
    },
  ],
  timestamps: true,
}
