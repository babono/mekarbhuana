import type { CollectionConfig } from 'payload'

import { anyone, isAdmin, isAdminField, isAdminOrSelf } from '@/access'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'name', 'membershipStatus', 'membershipExpiresAt', 'createdAt'],
    group: 'Members',
  },
  auth: {
    tokenExpiration: 60 * 60 * 24 * 30, // 30 days — readers should stay signed in
    verify: false,
    maxLoginAttempts: 8,
    lockTime: 10 * 60 * 1000,
  },
  access: {
    // Registration is open: anyone can create a reading account.
    create: anyone,
    read: isAdminOrSelf,
    update: isAdminOrSelf,
    delete: isAdmin,
    // Only staff reach the Payload admin panel; members use the site itself.
    admin: ({ req }) => Boolean((req.user as { roles?: string[] } | null)?.roles?.includes('admin')),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'country',
      type: 'text',
    },
    {
      name: 'newsletter',
      type: 'checkbox',
      label: 'Email me when new ensembles are added to the encyclopedia',
      defaultValue: false,
    },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      defaultValue: ['member'],
      options: [
        { label: 'Member', value: 'member' },
        { label: 'Admin', value: 'admin' },
      ],
      saveToJWT: true,
      // Without this a member could grant themselves admin by PATCHing their own row.
      access: {
        create: isAdminField,
        update: isAdminField,
      },
      admin: { position: 'sidebar' },
    },
    {
      type: 'collapsible',
      label: 'Membership',
      admin: {
        description:
          'Maintained automatically from this reader’s subscriptions — edit the subscription, not these fields.',
      },
      fields: [
        {
          name: 'membershipStatus',
          type: 'select',
          defaultValue: 'none',
          options: [
            { label: 'None', value: 'none' },
            { label: 'Active', value: 'active' },
            { label: 'Expired', value: 'expired' },
          ],
          access: { create: isAdminField, update: isAdminField },
          admin: { readOnly: true },
        },
        {
          name: 'membershipExpiresAt',
          type: 'date',
          access: { create: isAdminField, update: isAdminField },
          admin: { readOnly: true, date: { pickerAppearance: 'dayOnly' } },
        },
        {
          name: 'membershipEdition',
          type: 'select',
          options: [
            { label: 'English', value: 'en' },
            { label: 'Bahasa Indonesia', value: 'id' },
          ],
          access: { create: isAdminField, update: isAdminField },
          admin: { readOnly: true },
        },
      ],
    },
  ],
  timestamps: true,
}
