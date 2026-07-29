/**
 * Create (or promote) a staff account that can reach the Payload admin panel.
 *
 *   npm run create-admin -- you@example.com 'your-password'
 *
 * Site registration at /join always creates plain members — `roles` is guarded by
 * field-level access so nobody can grant themselves staff rights over the API.
 * This script is the deliberate way in, run by someone with shell access.
 */
import { getPayload } from 'payload'

import config from '../payload.config'

const [email, password] = process.argv.slice(2)

if (!email || !password) {
  console.error("Usage: npm run create-admin -- you@example.com 'your-password'")
  process.exit(1)
}

const payload = await getPayload({ config })

const existing = await payload.find({
  collection: 'users',
  where: { email: { equals: email.toLowerCase() } },
  limit: 1,
  depth: 0,
})

if (existing.docs[0]) {
  await payload.update({
    collection: 'users',
    id: existing.docs[0].id,
    data: { roles: ['admin'], password },
  })
  payload.logger.info(`Promoted ${email} to admin and reset their password.`)
} else {
  await payload.create({
    collection: 'users',
    data: {
      name: email.split('@')[0],
      email: email.toLowerCase(),
      password,
      roles: ['admin'],
      membershipStatus: 'none',
    },
  })
  payload.logger.info(`Created admin ${email}.`)
}

process.exit(0)
