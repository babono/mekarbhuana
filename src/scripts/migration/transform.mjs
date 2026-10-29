#!/usr/bin/env node
/**
 * WordPress → Payload: transform step.
 *
 * Reads the phpMyAdmin CSV export of the member/expiry query and produces
 * import-ready JSON. Pure data work — no Payload, no database, no dependencies.
 *
 *   node src/scripts/migration/transform.mjs members.csv
 *
 * Writes members.import.json beside the input.
 *
 * The CSV is expected to have these columns (the query in the migration notes):
 *   member_id, user_name, email, account_state, membership_level,
 *   alias, subscription_starts, access_until
 *
 * Optionally also `password` — the WordPress hash. Include it if first sign-in
 * should accept the password the reader already had; leave it out and everyone
 * resets instead. Delete the generated JSON once the import has run either way.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'

// ---------------------------------------------------------------------------
// Legacy membership levels → edition + plan shape
//
// Taken from wp_swpm_membership_tbl. Levels 1, 6 and 7 are not real
// subscriptions: 1 is SWPM's internal protection level, 6 is a staff account,
// 7 is the default assigned at signup before anyone pays.
// ---------------------------------------------------------------------------
const LEVELS = {
  1:  { kind: 'system', label: 'Content Protection' },
  2:  { kind: 'plan', edition: 'en', months: 6,  label: '6 months' },
  3:  { kind: 'plan', edition: 'en', months: 1,  label: '1 month' },
  4:  { kind: 'plan', edition: 'en', months: 12, label: '1 year' },
  5:  { kind: 'plan', edition: 'en', months: 1,  label: '1 month trial', trial: true },
  6:  { kind: 'staff', label: 'Administrator full access' },
  7:  { kind: 'signup', label: 'New Member (never completed)' },
  8:  { kind: 'plan', edition: 'en', months: 3,  label: '90 days' },
  9:  { kind: 'plan', edition: 'id', months: 1,  label: '1 bulan' },
  10: { kind: 'plan', edition: 'id', months: 6,  label: '6 bulan' },
  11: { kind: 'plan', edition: 'id', months: 12, label: '1 tahun' },
  12: { kind: 'plan', edition: 'id', months: 3,  label: '3 bulan' },
  13: { kind: 'plan', edition: 'en', months: 3,  label: '3 months' },
  14: { kind: 'plan', edition: 'id', months: 1,  label: '1 bulan (bundle)', bundle: true },
}

// Accounts belonging to Mekar Bhuana, its agencies, or testing. Flagged rather
// than dropped — Vaughn decides what to delete once he can see the list.
const INTERNAL_PATTERNS = [
  /@mekarbhuana\.com$/i,
  /@balimusicanddance\.com$/i,
  /@inbeez\.id$/i,
  /firestone\.stdo@/i,
  /baliwebdesign\.id@/i,
  /^institutional_/i,
]
const INTERNAL_USERNAMES = new Set([
  'mekarbhuanatrial',
  'tes.kupon',
])

// ---------------------------------------------------------------------------

/** Minimal RFC-4180 CSV parser. phpMyAdmin quotes fields and escapes "" inside. */
function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false

  for (let i = 0; i < text.length; i++) {
    const c = text[i]

    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ }
        else quoted = false
      } else field += c
      continue
    }

    if (c === '"') quoted = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\r') { /* ignore */ }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = '' }
    else field += c
  }

  if (field.length || row.length) { row.push(field); rows.push(row) }
  return rows.filter((r) => r.some((cell) => cell !== ''))
}

/** MySQL datetime → ISO, with the zero-date turned into null. */
function toIso(value) {
  if (!value) return null
  const v = value.trim()
  if (!v || v.startsWith('0000-00-00')) return null
  const iso = new Date(v.replace(' ', 'T') + 'Z')
  return Number.isNaN(iso.getTime()) ? null : iso.toISOString()
}

function isInternal(email, userName) {
  if (INTERNAL_USERNAMES.has(userName)) return true
  return INTERNAL_PATTERNS.some((re) => re.test(email) || re.test(userName))
}

/** A display name, since Payload's users.name is required. */
function deriveName(row) {
  const parts = [row.first_name, row.last_name].filter(Boolean).map((s) => s.trim())
  if (parts.length) return parts.join(' ')
  const user = (row.user_name || '').trim()
  if (user && !user.includes('@')) return user
  return (row.email || '').split('@')[0] || 'Member'
}

// ---------------------------------------------------------------------------

const inputPath = process.argv[2]
if (!inputPath) {
  console.error('usage: node transform.mjs <members.csv>')
  process.exit(1)
}

const rows = parseCsv(readFileSync(inputPath, 'utf8'))
const header = rows.shift().map((h) => h.trim().replace(/^﻿/, ''))
const records = rows.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])))

const now = Date.now()
const out = []
const skipped = []
const plansNeeded = new Map()

for (const row of records) {
  const levelId = Number(row.membership_level)
  const level = LEVELS[levelId]
  const email = (row.email || '').trim().toLowerCase()

  if (!email) {
    skipped.push({ member_id: row.member_id, reason: 'no email' })
    continue
  }

  if (!level) {
    skipped.push({ member_id: row.member_id, email, reason: `unknown level ${levelId}` })
    continue
  }

  const startsAt = toIso(row.subscription_starts)
  const expiresAt = toIso(row.access_until)

  // Never-activated signups have no access window to preserve, but the address
  // is worth keeping. Imported dormant and flagged, so Vaughn decides whether
  // someone who registered and never finished belongs on the list.
  const neverActivated =
    level.kind === 'signup' && row.account_state === 'activation_required'

  const internal =
    isInternal(email, row.user_name || '') || level.kind === 'staff' || neverActivated
  const hasWindow = level.kind === 'plan' && Boolean(expiresAt)
  const stillValid = hasWindow && new Date(expiresAt).getTime() > now

  const entry = {
    legacyMemberId: Number(row.member_id),
    email,
    name: deriveName(row),
    legacyUserName: (row.user_name || '').trim(),
    legacyLevelId: levelId,
    legacyLevelAlias: (row.alias || '').trim(),
    legacyAccountState: (row.account_state || '').trim(),
    internal,
    legacyPasswordHash: (row.password || '').trim() || null,
    // Deliberately NOT ['member','admin'] for the old "Administrator full access"
    // level. Staff rights are granted on purpose with npm run create-admin, not
    // inherited from a WordPress row — the August audit found an outside agency
    // holding admin on the old site, and that should not survive the move.
    roles: ['member'],
    subscription: hasWindow
      ? {
          edition: level.edition,
          months: level.months,
          planLabel: level.label,
          startsAt,
          expiresAt,
          status: stillValid ? 'active' : 'expired',
        }
      : null,
  }

  if (hasWindow) {
    const key = `${level.edition}:${level.months}`
    if (!plansNeeded.has(key)) {
      plansNeeded.set(key, {
        key,
        edition: level.edition,
        durationMonths: level.months,
        label: level.label,
        count: 0,
      })
    }
    plansNeeded.get(key).count++
  }

  out.push(entry)
}

const result = {
  generatedAt: new Date().toISOString(),
  source: basename(inputPath),
  plans: [...plansNeeded.values()].sort(
    (a, b) => a.edition.localeCompare(b.edition) || a.durationMonths - b.durationMonths,
  ),
  members: out,
  skipped,
}

const outPath = join(dirname(inputPath), 'members.import.json')
writeFileSync(outPath, JSON.stringify(result, null, 2))

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
const active = out.filter((m) => m.subscription?.status === 'active')
const expired = out.filter((m) => m.subscription?.status === 'expired')
const noSub = out.filter((m) => !m.subscription)
const internalCount = out.filter((m) => m.internal).length

console.log(`\nRead ${records.length} rows from ${basename(inputPath)}`)
console.log(`Wrote ${outPath}\n`)
console.log(`  importable:        ${out.length}`)
console.log(`    active window:   ${active.length}`)
console.log(`    expired window:  ${expired.length}`)
console.log(`    no subscription: ${noSub.length}`)
console.log(`    flagged internal:${internalCount}`)
console.log(`  skipped:           ${skipped.length}`)

const withHash = out.filter((m) => m.legacyPasswordHash).length
console.log(
  withHash
    ? `  password hashes:   ${withHash} (first sign-in can accept the old password)`
    : `  password hashes:   none in export — every member will have to reset`,
)

if (result.plans.length) {
  console.log('\n  plans needed:')
  for (const p of result.plans) {
    console.log(`    ${p.edition}  ${String(p.durationMonths).padStart(2)} months  (${p.count} members)  "${p.label}"`)
  }
}

if (skipped.length) {
  console.log('\n  skipped detail:')
  for (const s of skipped) console.log(`    #${s.member_id} ${s.email ?? ''} — ${s.reason}`)
}

if (active.length) {
  const soonest = active
    .slice()
    .sort((a, b) => new Date(a.subscription.expiresAt) - new Date(b.subscription.expiresAt))[0]
  console.log(`\n  earliest active expiry: ${soonest.subscription.expiresAt.slice(0, 10)} (${soonest.email})`)
}
console.log('')
