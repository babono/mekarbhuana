import type { GlobalConfig, TextFieldSingleValidation } from 'payload'

import { anyone, isAdmin } from '@/access'
import { revalidateGlobalAfterChange } from '@/hooks/revalidate'

/** A site path (`/encyclopedia`) or a full web address (`https://…`). */
const validateLink: TextFieldSingleValidation = (value) => {
  if (!value) return 'A link is required.'
  if (value.startsWith('/') || /^https?:\/\//.test(value)) return true
  return 'Start with "/" for a page on this site, or "https://" for another site.'
}

/**
 * The promotional pop-up shown over the home page — a single image that links
 * somewhere, used to point new visitors at the Encyclopedia.
 *
 * Swapping the image or link counts as a new campaign: visitors who closed the
 * previous one see the new one, because the dismissal is keyed to `updatedAt`.
 */
export const HomePopup: GlobalConfig = {
  slug: 'home-popup',
  label: 'Home pop-up',
  admin: {
    group: 'Content',
    description:
      'An image pop-up shown once to visitors of the home page. Closing it hides it for the number of days below; saving changes here shows it to everyone again.',
  },
  access: {
    read: anyone,
    update: isAdmin,
  },
  hooks: {
    afterChange: [revalidateGlobalAfterChange('home-popup', ['/'])],
  },
  fields: [
    {
      name: 'enabled',
      type: 'checkbox',
      label: 'Show the pop-up',
      defaultValue: false,
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description:
          'The whole pop-up is this picture, so put any text on the image itself. A portrait or square image around 1080 px wide works best on phones.',
      },
      validate: (value: unknown, { siblingData }: { siblingData: { enabled?: boolean } }) =>
        siblingData?.enabled && !value ? 'Upload an image before turning the pop-up on.' : true,
    },
    {
      name: 'link',
      type: 'text',
      required: true,
      defaultValue: '/encyclopedia',
      validate: validateLink,
      admin: {
        description:
          'Where a click on the image goes, e.g. /encyclopedia or https://example.com.',
      },
    },
    {
      name: 'buttonLabel',
      type: 'text',
      admin: {
        description:
          'Optional button under the image, e.g. "Explore the Encyclopedia". Leave empty for image only.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'delaySeconds',
          type: 'number',
          label: 'Delay (seconds)',
          defaultValue: 2,
          min: 0,
          max: 60,
          admin: {
            width: '50%',
            description: 'How long after the page loads before the pop-up appears.',
          },
        },
        {
          name: 'hideForDays',
          type: 'number',
          label: 'Hide after closing (days)',
          defaultValue: 3,
          min: 0,
          max: 365,
          admin: {
            width: '50%',
            description: '0 shows it again on every visit.',
          },
        },
      ],
    },
  ],
}
