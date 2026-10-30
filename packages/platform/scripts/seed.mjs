#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Seed the demo store (run after `pnpm db:migrate`; idempotent)
// ---------------------------------------------------------------------------
// Usage (from the repo root): pnpm db:seed
//
// Seeds the `org_demo` organization, countries and the demo catalog. When
// ADMIN_EMAIL and ADMIN_PASSWORD are set, also creates a platform admin user
// with a credential login who owns the demo organization.
// ---------------------------------------------------------------------------

import { randomBytes, randomUUID, scrypt } from 'node:crypto'
import { sql } from 'drizzle-orm'
import { closeDrizzle, getDb, initDrizzle } from '../dist/database/drizzle/client.js'
import { DEMO_ORG_ID, seedDrizzle } from '../dist/database/drizzle/seed.js'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL is required')
  process.exit(1)
}

/** Better Auth credential hash format (@better-auth/utils/password). */
async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const key = await new Promise((resolve, reject) => {
    scrypt(
      password.normalize('NFKC'),
      salt,
      64,
      { N: 16384, r: 16, p: 1, maxmem: 128 * 16384 * 16 * 2 },
      (err, derived) => (err ? reject(err) : resolve(derived)),
    )
  })
  return `${salt}:${key.toString('hex')}`
}

/** Platform admin with a credential login, owner of the demo organization. */
async function seedAdmin(email, password) {
  const db = getDb()
  const { rows } = await db.execute(sql`
    INSERT INTO "user" ("id", "name", "email", "email_verified", "role")
    VALUES (${randomUUID()}, 'Demo Admin', ${email}, true, 'admin')
    ON CONFLICT ("email") DO UPDATE SET "role" = 'admin'
    RETURNING "id"
  `)
  const userId = rows[0].id
  await db.execute(sql`
    INSERT INTO "account" ("id", "account_id", "provider_id", "user_id", "password")
    SELECT ${randomUUID()}, ${userId}, 'credential', ${userId}, ${await hashPassword(password)}
    WHERE NOT EXISTS (
      SELECT 1 FROM "account" WHERE "user_id" = ${userId} AND "provider_id" = 'credential'
    )
  `)
  await db.execute(sql`
    INSERT INTO "member" ("id", "organization_id", "user_id", "role")
    SELECT ${randomUUID()}, ${DEMO_ORG_ID}, ${userId}, 'owner'
    WHERE NOT EXISTS (
      SELECT 1 FROM "member" WHERE "organization_id" = ${DEMO_ORG_ID} AND "user_id" = ${userId}
    )
  `)
}

initDrizzle(url)
try {
  console.log('🌱 Seeding demo store...')
  await seedDrizzle()

  const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env
  if (ADMIN_EMAIL && ADMIN_PASSWORD) {
    await seedAdmin(ADMIN_EMAIL, ADMIN_PASSWORD)
    console.log(`✅ Seed complete (org: ${DEMO_ORG_ID}, admin: ${ADMIN_EMAIL})`)
  } else {
    console.log(`✅ Seed complete (org: ${DEMO_ORG_ID}; ADMIN_EMAIL / ADMIN_PASSWORD not set, no admin user)`)
  }
} finally {
  await closeDrizzle()
}
