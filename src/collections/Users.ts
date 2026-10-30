import type { CollectionConfig } from 'payload'

import { anyone, isAdmin, isAdminField, isAdminOrSelf } from '@/access'
import {
  revalidateInstitutionsAfterChange,
  revalidateInstitutionsAfterDelete,
} from '@/hooks/revalidateInstitutions'
import { resetEmailHTML } from '@/lib/resetEmail'

/** One IPv4 or IPv6 address. Ranges are deliberately not accepted. */
const IP =
  /^(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)$|^[0-9a-f:]*:[0-9a-f:.]*$/i

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    defaultColumns: [
      'email',
      'name',
      'membershipStatus',
      'membershipExpiresAt',
      'legacyNeedsReview',
      'createdAt',
    ],
    group: 'Members',
  },
  auth: {
    tokenExpiration: 60 * 60 * 24 * 30, // 30 days — readers should stay signed in
    verify: false,
    maxLoginAttempts: 8,
    lockTime: 10 * 60 * 1000,
    forgotPassword: {
      expiration: 60 * 60 * 1000,
      generateEmailSubject: () => 'Reset your Mekar Bhuana password',
      generateEmailHTML: (args) =>
        resetEmailHTML({
          token: args?.token ?? '',
          name: (args?.user as { name?: string } | undefined)?.name,
        }),
    },
  },
  hooks: {
    beforeValidate: [
      ({ data, operation, originalDoc }) => {
        // A password chosen by any route retires the WordPress hash. Otherwise
        // someone who still knew the old password — the very reason a reader
        // might reset it — could sign in with it and overwrite the new one.
        // The reset-link flow writes the raw record without an originalDoc,
        // which is how it is recognised here.
        const isPasswordReset = operation === 'update' && !originalDoc && Boolean(data?.hash)
        if (data && (data.password || isPasswordReset)) data.legacyPasswordHash = null
        return data
      },
    ],
    afterChange: [revalidateInstitutionsAfterChange],
    afterDelete: [revalidateInstitutionsAfterDelete],
  },
  access: {
    // Registration is open: anyone can create a reading account.
    create: anyone,
    read: isAdminOrSelf,
    update: isAdminOrSelf,
    delete: isAdmin,
    // Only staff reach the Payload admin panel; members use the site itself.
    admin: ({ req }) =>
      Boolean((req.user as { roles?: string[] } | null)?.roles?.includes('admin')),
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
        // The two editions are sold separately, so each has its own window.
        {
          name: 'englishAccessUntil',
          type: 'date',
          label: 'English edition until',
          access: { create: isAdminField, update: isAdminField },
          admin: { readOnly: true, date: { pickerAppearance: 'dayOnly' } },
        },
        {
          name: 'indonesianAccessUntil',
          type: 'date',
          label: 'Bahasa Indonesia edition until',
          access: { create: isAdminField, update: isAdminField },
          admin: { readOnly: true, date: { pickerAppearance: 'dayOnly' } },
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Institutional access',
      admin: {
        initCollapsed: true,
        description:
          'For a library or university that subscribes for all its readers. Anyone arriving from these addresses can read the encyclopedia without signing in, for as long as this account’s subscription runs and in its edition.',
      },
      fields: [
        {
          name: 'institutionName',
          type: 'text',
          access: { create: isAdminField, update: isAdminField },
          admin: {
            description:
              'Shown to those readers, e.g. “University of Kentucky”. Falls back to the account name.',
          },
        },
        {
          name: 'institutionIps',
          type: 'textarea',
          label: 'IP addresses',
          access: { create: isAdminField, update: isAdminField, read: isAdminField },
          admin: {
            description:
              'One per line. Exact addresses only, as given by the library — usually their proxy servers. Never add a shared service’s address (such as OpenAthens), which other institutions use too.',
          },
          validate: (value: string | null | undefined) => {
            const bad = (value ?? '')
              .split(/[\s,]+/)
              .filter(Boolean)
              .filter((ip) => !IP.test(ip))
            return bad.length ? `Not an IP address: ${bad.join(', ')}` : true
          },
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Imported from the old site',
      admin: {
        condition: (data) => Boolean(data?.legacyMemberId),
        description:
          'Only present on accounts carried over from WordPress. Nothing here affects access — it exists so a migrated record can be traced back, and so the first sign-in can accept the password the reader already had.',
      },
      fields: [
        {
          name: 'legacyMemberId',
          type: 'number',
          index: true,
          access: { create: isAdminField, update: isAdminField, read: isAdminField },
          admin: { readOnly: true, description: 'member_id in the old wp_swpm_members_tbl.' },
        },
        {
          name: 'legacyPasswordHash',
          type: 'text',
          // Never leaves the server: a member can read their own user document,
          // and this must not travel with it.
          access: { create: isAdminField, update: isAdminField, read: () => false },
          admin: { hidden: true },
        },
        {
          name: 'legacyNeedsReview',
          type: 'checkbox',
          label: 'Staff / agency / test account — review before keeping',
          defaultValue: false,
          access: { create: isAdminField, update: isAdminField },
          admin: {
            description:
              'Set during the import for addresses belonging to Mekar Bhuana, its agencies, or testing. Filter on this to clear them out, then untick what should stay.',
          },
        },
      ],
    },
  ],
  timestamps: true,
}
