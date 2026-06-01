#!/usr/bin/env node
/**
 * Seed Better Auth demo org + admin user (idempotent).
 * Requires auth tables from db:auth and ADMIN_EMAIL / ADMIN_PASSWORD in env.
 *
 * Usage: node --env-file=.env.local scripts/seed-auth.mjs
 */
import { createRequire } from 'node:module'
import { randomBytes, scrypt } from 'node:crypto'

const require = createRequire(new URL('../apps/dashboard/package.json', import.meta.url))
const { neon } = require('@neondatabase/serverless')

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

const DEMO_ORG_ID = 'org_demo'
const DEMO_USER_ID = 'user_demo_admin'
const DEMO_ACCOUNT_ID = 'account_demo_admin'
const DEMO_MEMBER_ID = 'member_demo_admin'

const url = process.env.DATABASE_URL
const email = process.env.ADMIN_EMAIL
const password = process.env.ADMIN_PASSWORD

if (!url) {
  console.error('DATABASE_URL is required')
  process.exit(1)
}

if (!email || !password) {
  console.log('ℹ️  ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping auth seed')
  process.exit(0)
}

const sql = neon(url)

async function upsertOrganization() {
  await sql`
    INSERT INTO "organization" ("id", "name", "slug", "plan_id", "plan_status")
    VALUES (${DEMO_ORG_ID}, 'Prood Demo Store', 'prood-demo', 'free', 'active')
    ON CONFLICT ("id") DO NOTHING
  `
}

async function upsertUser() {
  await sql`
    INSERT INTO "user" ("id", "name", "email", "email_verified")
    VALUES (${DEMO_USER_ID}, 'Demo Admin', ${email}, true)
    ON CONFLICT ("email") DO NOTHING
  `
}

async function upsertAccount(hashedPassword) {
  await sql`
    INSERT INTO "account" (
      "id", "account_id", "provider_id", "user_id", "password"
    )
    VALUES (
      ${DEMO_ACCOUNT_ID},
      ${DEMO_USER_ID},
      'credential',
      ${DEMO_USER_ID},
      ${hashedPassword}
    )
    ON CONFLICT ("id") DO NOTHING
  `
}

async function upsertMember() {
  await sql`
    INSERT INTO "member" ("id", "organization_id", "user_id", "role")
    VALUES (${DEMO_MEMBER_ID}, ${DEMO_ORG_ID}, ${DEMO_USER_ID}, 'owner')
    ON CONFLICT ("id") DO NOTHING
  `
}

console.log('🌱 Seeding auth demo org + admin user...')
await upsertOrganization()
await upsertUser()
await upsertAccount(await hashPassword(password))
await upsertMember()
console.log(`✅ Auth seed complete (org: ${DEMO_ORG_ID}, user: ${email})`)
