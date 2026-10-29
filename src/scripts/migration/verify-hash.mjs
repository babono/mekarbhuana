#!/usr/bin/env node
/**
 * Works out how to verify a WordPress 6.8 password hash, by trying every
 * plausible scheme against a real hash and a password only you know.
 *
 * A first pass assumed WordPress pre-hashed with plain SHA-384. It doesn't —
 * it uses HMAC-SHA384 with a fixed key — so this version tries a matrix of
 * pre-processors against both bcrypt prefix forms, and self-tests the bcrypt
 * library first so a library problem can't be mistaken for an algorithm one.
 *
 *   npm i bcryptjs
 *   read -rs PW && echo -n "$PW" | node src/scripts/migration/verify-hash.mjs you@example.com; unset PW
 *
 * The password is read from stdin so it stays out of your shell history, and is
 * never written anywhere.
 */
import { createHash, createHmac } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

let bcrypt
try {
  const mod = await import('bcryptjs')
  bcrypt = mod.default ?? mod
} catch {
  console.error('bcryptjs is not installed.  npm i bcryptjs')
  process.exit(1)
}

const email = (process.argv[2] || '').toLowerCase()
if (!email) {
  console.error('usage: … | node verify-hash.mjs you@example.com')
  process.exit(1)
}

const here = path.dirname(fileURLToPath(import.meta.url))
const data = JSON.parse(readFileSync(path.join(here, 'members.import.json'), 'utf8'))
const member = data.members.find((m) => m.email === email)

if (!member?.legacyPasswordHash) {
  console.error(`No hash for ${email} in members.import.json`)
  process.exit(1)
}

const stored = member.legacyPasswordHash

const password = await new Promise((resolve) => {
  let buf = ''
  process.stdin.setEncoding('utf8')
  process.stdin.on('data', (d) => (buf += d))
  process.stdin.on('end', () => resolve(buf.replace(/\r?\n$/, '')))
})

if (!password) {
  console.error('No password on stdin — see the usage line above.')
  process.exit(1)
}

// ---------------------------------------------------------------------------
// 0. Does bcryptjs work at all, and does it accept a $2y$ hash?
//
// Several bcrypt ports only handle $2a$/$2b$ and choke on PHP's $2y$. If that
// is the problem, every scheme below would fail for a reason that has nothing
// to do with WordPress.
// ---------------------------------------------------------------------------

console.log('\n── library self-test ──')
const selfHash = await bcrypt.hash('correct horse battery staple', 10)
const selfOk = await bcrypt.compare('correct horse battery staple', selfHash)
console.log(`  bcryptjs round-trip:      ${selfOk ? 'ok' : 'FAILED'}`)

const as2y = selfHash.replace(/^\$2[ab]\$/, '$2y$')
let accepts2y = false
try {
  accepts2y = await bcrypt.compare('correct horse battery staple', as2y)
} catch {
  accepts2y = false
}
console.log(`  accepts a $2y$ prefix:    ${accepts2y ? 'yes' : 'NO — will substitute $2a$'}`)

// ---------------------------------------------------------------------------
// 1. Structure of the stored hash, without printing its contents
// ---------------------------------------------------------------------------

const body = stored.startsWith('$wp') ? stored.slice(3) : stored
const parts = body.split('$').filter(Boolean)

console.log('\n── stored hash shape ──')
console.log(`  total length:             ${stored.length}`)
console.log(`  marker:                   ${stored.slice(0, 3)}`)
console.log(`  algorithm:                $${parts[0] ?? '?'}$`)
console.log(`  cost:                     ${parts[1] ?? '?'}`)
console.log(`  salt+digest length:       ${(parts[2] ?? '').length}  (expected 53)`)

// ---------------------------------------------------------------------------
// 2. The matrix
// ---------------------------------------------------------------------------

const b64 = (buf) => Buffer.from(buf).toString('base64')
const sha384 = (s) => b64(createHash('sha384').update(s).digest())
const hmac384 = (s, key) => b64(createHmac('sha384', key).update(s).digest())

const preprocessors = [
  ['raw password', (p) => p],
  ["hmac-sha384, key 'wp-sha384'", (p) => hmac384(p, 'wp-sha384')],
  ["hmac-sha384, key 'wp-sha384', trimmed", (p) => hmac384(p.trim(), 'wp-sha384')],
  ['plain sha384', (p) => sha384(p)],
  ['plain sha384, trimmed', (p) => sha384(p.trim())],
  ["hmac-sha384, key 'wp'", (p) => hmac384(p, 'wp')],
  ['hmac-sha384, empty key', (p) => hmac384(p, '')],
]

const hashForms = [
  ['as stored, $wp stripped', body],
  ...(accepts2y ? [] : [['$wp stripped, $2y$ → $2a$', body.replace(/^\$2y\$/, '$2a$')]]),
]

console.log('\n── schemes ──')
let matched = null

for (const [hashLabel, hashValue] of hashForms) {
  for (const [preLabel, fn] of preprocessors) {
    let ok = false
    try {
      ok = await bcrypt.compare(fn(password), hashValue)
    } catch (e) {
      console.log(`  !  ${preLabel}  ×  ${hashLabel}`)
      console.log(`       ${e instanceof Error ? e.message : String(e)}`)
      continue
    }
    console.log(`  ${ok ? '✓' : '·'}  ${preLabel}  ×  ${hashLabel}`)
    if (ok && !matched) matched = `${preLabel}  ×  ${hashLabel}`
  }
}

if (matched) {
  console.log(`\nMATCH — ${matched}`)
  console.log('That is the scheme to implement in loginAction.\n')
} else {
  console.log(`
Nothing matched.

Most likely explanations, in order:

  1. The password typed is not the one that account used on the old site.
     Easily checked — try signing in at balimusicanddance.com/membership-login
     with the same password and see whether WordPress accepts it.

  2. The hash was altered between the database and the CSV. The shape printed
     above should read: marker $wp, algorithm $2y$, cost 10, salt+digest 53.
     Anything else means the export mangled it.

  3. WordPress is doing something none of these schemes cover, in which case
     the answer is in wp-includes/pluggable.php — wp_hash_password().
`)
}

process.exit(matched ? 0 : 1)
