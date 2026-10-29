/**
 * WordPress → Payload: import step.
 *
 * Takes the JSON produced by transform.mjs and writes it into Payload through
 * the Local API, so every collection hook runs exactly as it would for a record
 * created by hand. In particular, the Subscriptions afterChange hook derives
 * each reader's membershipStatus and membershipExpiresAt — this script never
 * sets those directly.
 *
 *   node src/scripts/migration/transform.mjs members.csv
 *   DRY_RUN=1 npm run payload run src/scripts/migration/import.ts
 *   npm run payload run src/scripts/migration/import.ts
 *
 * Safe to re-run: users are matched on email and subscriptions on their
 * reference (`wp-<member_id>`), so a second pass updates rather than duplicates.
 *
 * Three deliberate choices worth knowing about:
 *
 *   Expiry dates come from the old site, not from the plan. A reader who paid
 *   for a year in September keeps the date they were promised, even if the
 *   matching plan's length is later changed.
 *
 *   Imported plans are created inactive with a price of zero. Several legacy
 *   tiers were retired before the move and inventing prices for them would put
 *   fiction in the admin panel. Set prices on the tiers you intend to sell and
 *   tick Active; leave the rest switched off.
 *
 *   Nothing is emailed. The users collection has verify: false and Payload
 *   sends nothing on create, but it is worth being explicit: firing 68 welcome
 *   messages at addresses that include two former agencies would be a poor way
 *   to announce the new site.
 */
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { getPayload } from 'payload'
import type { Payload } from 'payload'

import config from '../../payload.config'

// ---------------------------------------------------------------------------
// Shapes written by transform.mjs
// ---------------------------------------------------------------------------

type ImportPlan = {
  key: string
  edition: 'en' | 'id'
  durationMonths: number
  label: string
  count: number
}

type ImportSubscription = {
  edition: 'en' | 'id'
  months: number
  planLabel: string
  startsAt: string | null
  expiresAt: string
  status: 'active' | 'expired'
}

type ImportMember = {
  legacyMemberId: number
  email: string
  name: string
  legacyUserName: string
  legacyLevelId: number
  legacyLevelAlias: string
  legacyAccountState: string
  internal: boolean
  legacyPasswordHash: string | null
  // Matches the generated User type: Payload narrows this to the literal union.
  roles: ('member' | 'admin')[]
  subscription: ImportSubscription | null
}

/**
 * Payload returns document ids in whatever type the database adapter uses —
 * integers on Postgres, ObjectId strings on Mongo. Carrying them untouched
 * keeps this script working on either.
 */
type DocId = string | number

type ImportFile = {
  generatedAt: string
  source: string
  plans: ImportPlan[]
  members: ImportMember[]
  skipped: unknown[]
}

// ---------------------------------------------------------------------------
// Arguments
//
// `payload run` passes its own arguments through, so position is unreliable —
// pick the JSON path and the flag out of argv by shape instead.
// ---------------------------------------------------------------------------

const here = path.dirname(fileURLToPath(import.meta.url))

// `payload run` swallows unrecognised flags before the script sees argv, so the
// environment variable is the reliable switch. The flag is kept as a courtesy
// for anyone running this file directly with node.
const dryRun = process.env.DRY_RUN === '1' || process.argv.includes('--dry-run')
const jsonArg = process.argv.slice(2).find((a) => a.endsWith('.json'))
const jsonPath = path.resolve(jsonArg ?? path.join(here, 'members.import.json'))

let data: ImportFile
try {
  data = JSON.parse(readFileSync(jsonPath, 'utf8')) as ImportFile
} catch {
  console.error(`Could not read ${jsonPath}`)
  console.error('Run transform.mjs first, or pass the path as an argument.')
  process.exit(1)
}

const payload = await getPayload({ config })
const log = payload.logger

log.info(`Importing from ${path.basename(jsonPath)} (generated ${data.generatedAt})`)
log.info(`${data.members.length} members, ${data.plans.length} plan shapes`)
if (dryRun) log.info('DRY RUN — nothing will be written')

// ---------------------------------------------------------------------------
// Plans
// ---------------------------------------------------------------------------

const EDITION_LABEL = { en: 'English', id: 'Bahasa Indonesia' } as const

/**
 * Finds the plan matching an edition and length, or creates a placeholder.
 *
 * An existing plan always wins: if these tiers have already been built for the
 * new site, the import attaches to them rather than making near-duplicates.
 */
const resolvePlan = async (
  p: ImportPlan,
  cache: Map<string, DocId>,
): Promise<DocId | null> => {
  if (cache.has(p.key)) return cache.get(p.key)!

  const { docs } = await payload.find({
    collection: 'plans',
    where: {
      and: [
        { edition: { equals: p.edition } },
        { durationMonths: { equals: p.durationMonths } },
      ],
    },
    limit: 1,
    depth: 0,
  })

  if (docs[0]) {
    const id = docs[0].id
    cache.set(p.key, id)
    log.info(`  plan ${p.key.padEnd(7)} → existing "${(docs[0] as { name: string }).name}"`)
    return id
  }

  if (dryRun) {
    log.info(`  plan ${p.key.padEnd(7)} → would create placeholder "${p.label}"`)
    cache.set(p.key, `dry-${p.key}`)
    return `dry-${p.key}`
  }

  const created = await payload.create({
    collection: 'plans',
    data: {
      name: p.label,
      edition: p.edition,
      durationMonths: p.durationMonths,
      currency: 'IDR',
      price: 0,
      description: `${EDITION_LABEL[p.edition]} edition, ${p.durationMonths} month${
        p.durationMonths === 1 ? '' : 's'
      }. Imported from the old site — set a price before making this active.`,
      active: false,
      order: (p.edition === 'en' ? 0 : 100) + p.durationMonths,
    },
  })

  const id = created.id
  cache.set(p.key, id)
  log.info(`  plan ${p.key.padEnd(7)} → created placeholder "${p.label}" (inactive)`)
  return id
}

const planCache = new Map<string, DocId>()
log.info('\nPlans:')
for (const p of data.plans) await resolvePlan(p, planCache)

// ---------------------------------------------------------------------------
// Members and their subscriptions
// ---------------------------------------------------------------------------

const stats = {
  usersCreated: 0,
  usersUpdated: 0,
  subsCreated: 0,
  subsUpdated: 0,
  failed: 0,
}

const failures: { email: string; error: string }[] = []

const findUserId = async (email: string): Promise<DocId | null> => {
  const { docs } = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    limit: 1,
    depth: 0,
  })
  return docs[0] ? docs[0].id : null
}

const findSubscriptionId = async (reference: string): Promise<DocId | null> => {
  const { docs } = await payload.find({
    collection: 'subscriptions',
    where: { reference: { equals: reference } },
    limit: 1,
    depth: 0,
  })
  return docs[0] ? docs[0].id : null
}

log.info('\nMembers:')

for (const m of data.members) {
  try {
    const existingId = await findUserId(m.email)

    // A random password keeps Payload's auth happy. Members sign in either with
    // the password they already had — once the legacy-hash check is wired into
    // login — or by using the reset link. Nobody is ever told this value.
    const userData = {
      name: m.name,
      roles: m.roles,
      legacyMemberId: m.legacyMemberId,
      legacyNeedsReview: m.internal,
      ...(m.legacyPasswordHash ? { legacyPasswordHash: m.legacyPasswordHash } : {}),
    }

    let userId = existingId

    if (dryRun) {
      log.info(`  ${existingId ? 'update' : 'create'} user ${m.email}`)
      userId = existingId ?? `dry-${m.legacyMemberId}`
      existingId ? stats.usersUpdated++ : stats.usersCreated++
    } else if (existingId) {
      await payload.update({ collection: 'users', id: existingId, data: userData })
      stats.usersUpdated++
    } else {
      const created = await payload.create({
        collection: 'users',
        data: { ...userData, email: m.email, password: randomUUID() },
      })
      userId = created.id
      stats.usersCreated++
    }

    if (!m.subscription || !userId) continue

    const reference = `wp-${m.legacyMemberId}`
    const planId = planCache.get(`${m.subscription.edition}:${m.subscription.months}`)
    if (!planId) {
      throw new Error(`no plan for ${m.subscription.edition}:${m.subscription.months}`)
    }

    const subData = {
      // Cast rather than coerce: these came straight out of Payload and go
      // straight back in, but the generated types are adapter-specific.
      user: userId as number,
      plan: planId as number,
      status: m.subscription.status,
      startsAt: m.subscription.startsAt,
      // Set explicitly so the beforeChange hook leaves it alone: this is the
      // date the reader was actually sold, not one derived from plan length.
      expiresAt: m.subscription.expiresAt,
      reference,
      notes: `Imported from WordPress. Level ${m.legacyLevelId} — ${m.legacyLevelAlias}. Account state on the old site: ${m.legacyAccountState}.`,
    }

    if (dryRun) {
      log.info(
        `    sub ${reference} ${m.subscription.status} until ${m.subscription.expiresAt.slice(0, 10)}`,
      )
      stats.subsCreated++
      continue
    }

    const existingSub = await findSubscriptionId(reference)
    if (existingSub) {
      await payload.update({ collection: 'subscriptions', id: existingSub, data: subData })
      stats.subsUpdated++
    } else {
      await payload.create({ collection: 'subscriptions', data: subData })
      stats.subsCreated++
    }
  } catch (error) {
    stats.failed++
    failures.push({ email: m.email, error: error instanceof Error ? error.message : String(error) })
  }
}

// ---------------------------------------------------------------------------

log.info('\n────────────────────────────')
log.info(`users created   ${stats.usersCreated}`)
log.info(`users updated   ${stats.usersUpdated}`)
log.info(`subs created    ${stats.subsCreated}`)
log.info(`subs updated    ${stats.subsUpdated}`)
log.info(`failed          ${stats.failed}`)

if (failures.length) {
  log.error('\nFailures:')
  for (const f of failures) log.error(`  ${f.email} — ${f.error}`)
}

if (!dryRun && stats.failed === 0) {
  log.info('\nNext: open the admin panel, filter users on "Staff / agency / test account"')
  log.info('and clear out whatever should not be there before going live.')
}

process.exit(stats.failed > 0 ? 1 : 0)
