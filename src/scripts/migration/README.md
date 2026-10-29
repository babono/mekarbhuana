# WordPress → Payload member migration

Moves the 68 members of the old WordPress site (balimusicanddance.com, Simple
Membership plugin) into this application, and lets them sign in with the
password they already had.

Written 29–30 October 2026. Everything below was verified against the real
database rather than assumed — where something is still unproven it says so.

---

## The three scripts

| File | Runs | Purpose |
|---|---|---|
| `transform.mjs` | plain node | CSV export → `members.import.json`. No dependencies, no database. |
| `import.ts` | `payload run` | Writes that JSON into Payload via the Local API. |
| `verify-hash.mjs` | plain node | Proves which hashing scheme the old site used. Already served its purpose; kept as the record. |

```bash
node src/scripts/migration/transform.mjs src/scripts/migration/members.csv
DRY_RUN=1 npm run payload run src/scripts/migration/import.ts
npm run payload run src/scripts/migration/import.ts
```

**Use `DRY_RUN=1`, not `--dry-run`.** The `payload run` CLI swallows unknown
flags before the script sees `process.argv`; this was discovered the hard way
by running a "dry run" that wrote 68 records.

---

## Where the data came from

A single query against the WordPress database, exported from phpMyAdmin as CSV
with column names in the first row:

```sql
SELECT m.member_id, m.user_name, m.email,
       m.first_name, m.last_name,
       m.password,
       m.account_state, m.membership_level, l.alias,
       m.subscription_starts,
       CASE l.subscription_duration_type
         WHEN 0 THEN NULL
         WHEN 1 THEN DATE_ADD(m.subscription_starts, INTERVAL l.subscription_period DAY)
         WHEN 3 THEN DATE_ADD(m.subscription_starts, INTERVAL l.subscription_period MONTH)
         WHEN 4 THEN DATE_ADD(m.subscription_starts, INTERVAL l.subscription_period YEAR)
       END AS access_until
FROM wp_swpm_members_tbl m
JOIN wp_swpm_membership_tbl l ON l.id = m.membership_level
ORDER BY access_until DESC;
```

Simple Membership's `subscription_duration_type` decodes as **0 = no expiry,
1 = days, 3 = months, 4 = years**. Confirmed, not guessed: the 24 members this
formula computes as expired are exactly the 24 that SWPM's own `account_state`
column already marks expired. If the mapping were wrong those numbers would
diverge.

### What the export contains

- **68 member records.** Note this is not the same as the 42 WordPress *users*
  Site Health reports — Simple Membership keeps its own table, and the two
  populations only partly overlap.
- **36 active windows, 24 expired, 8 with no subscription** (2 legacy staff
  accounts, 6 signups that never activated).
- **No recurring subscriptions at all** — `subscr_id` is empty on every row, so
  nothing was billing automatically and nothing can silently stop or double-bill.
- **No duplicate email addresses**, so email is safe as the natural key.
- **11 accounts flagged `legacyNeedsReview`** — Mekar Bhuana's own addresses,
  two former agencies, a coupon test, and the six dormant signups.

---

## The password scheme

WordPress 6.8 moved from phpass to bcrypt, but does **not** bcrypt the password
directly — bcrypt truncates at 72 bytes, so WordPress pre-hashes:

```
bcrypt.compare(
  base64( hmac_sha384( password.trim(), 'wp-sha384' ) ),
  storedHash.slice(3)          // strip the "$wp" marker
)
```

A stored hash is 63 characters: `$wp` + a standard 60-character `$2y$10$…`
bcrypt string.

This was **proven against a real account** before any of it went near the login
route — an earlier assumption that WordPress used plain SHA-384 was wrong, and
`verify-hash.mjs` is what caught it. If this ever needs revisiting, that script
tries a matrix of schemes and reports which matches.

`src/lib/legacyPassword.ts` implements it. `loginAction` in
`src/app/(frontend)/actions.ts` calls it only when Payload's own check has
already failed, upgrades the account in place, and clears the legacy hash — so
each account takes that path exactly once and the old hashes drain out of the
database as people return.

**Verified working end to end** on a real member account against MongoDB. Not
yet re-verified against Postgres.

---

## Design decisions worth not re-litigating

**Expiry dates come from the old site, never recomputed.** Someone who bought a
year in September keeps the date they were sold, even if the matching plan's
length changes later. The import sets `expiresAt` explicitly, which makes the
Subscriptions `beforeChange` hook leave it alone.

**Imported plans are created inactive with a price of zero.** Several legacy
tiers were retired before the move; inventing prices for them would put fiction
in the admin panel. Set real prices on the tiers you intend to sell.

**No admin rights are inherited.** The old site had an "Administrator full
access" membership level held by an outside agency — a finding from the August
audit of the WordPress site. Staff rights are granted deliberately with
`npm run create-admin`, never carried across by the importer.

**Nothing is emailed.** The users collection has `verify: false` and no email
adapter is configured, so nothing could send even if it tried. Worth keeping
that way during any import: 68 welcome messages to a list that includes two
former agencies would be a poor way to announce the new site.

**Everything goes through the Payload Local API**, not raw SQL. That is why the
scripts survived the project moving from MongoDB to Neon Postgres without
changes beyond the id type.

---

## Still open

**Plan matching is dimensional, not semantic.** The importer matches an existing
plan on `edition` + `durationMonths` only. On the dev branch this attached the
eleven one-year English members to a plan named *"Staff full access"*, which is
dimensionally right and obviously wrong. **Check the Plans collection before
importing anywhere.**

**The schema migration must run before the import** on any database that has not
had it. The three `legacy*` columns are added by
`20261029_172945_add_legacy_member_fields`. Payload pushes schema automatically
under `next dev` but not when running a script, which is why the first Postgres
dry run failed with 68 identical query errors.

**Production has not been touched.** The import has only ever run against local
MongoDB and the Neon `dev` branch.

**Before importing into production:** take a Neon branch from `main` as a
restore point first. It is instant, copy-on-write, and the only safety net
available.

---

## Handling of the data itself

`members.csv` and `members.import.json` contain 68 real customers' email
addresses and their password hashes. Both are working files, not artefacts —
delete them once an import has succeeded, and keep them out of the repository
and out of chat logs.
