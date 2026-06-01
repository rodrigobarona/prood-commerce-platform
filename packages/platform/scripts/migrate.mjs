#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Standalone migration script — run before deploy, not at runtime
// ---------------------------------------------------------------------------
// Usage:
//   DATABASE_URL=... node scripts/migrate.mjs          # migrate only
//   DATABASE_URL=... node scripts/migrate.mjs --seed   # migrate + seed
// ---------------------------------------------------------------------------

import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// Load repo-root .env.local when DATABASE_URL is not already set (turbo does not inject it).
if (!process.env.DATABASE_URL) {
  const rootEnv = resolve(dirname(fileURLToPath(import.meta.url)), '../../../.env.local')
  if (existsSync(rootEnv)) {
    for (const line of readFileSync(rootEnv, 'utf8').split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      let value = trimmed.slice(eq + 1).trim()
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      if (!(key in process.env)) process.env[key] = value
    }
  }
}

// Import migration modules directly — avoid full barrel export (faster CLI startup).
import { migrateDrizzle } from '../dist/database/drizzle/migrate.js'
import { initDrizzle, getDb } from '../dist/database/drizzle/client.js'
import { seedDrizzle } from '../dist/database/drizzle/seed.js'

const url = process.env.DATABASE_URL
if (!url) {
  console.log('ℹ️  DATABASE_URL not set — skipping migrations')
  process.exit(0)
}

console.log('🔄 Running migrations...')
initDrizzle(url)
await migrateDrizzle(url)
console.log('✅ Migrations complete')

if (process.argv.includes('--seed')) {
  try {
    await seedDrizzle(getDb())
    console.log('✅ Seed complete')
  } catch (err) {
    // 23505 = PostgreSQL unique constraint violation (data already seeded)
    const code = err?.code ?? err?.cause?.code
    if (code === '23505') {
      console.log('ℹ️  Seed skipped — data already exists')
    } else {
      console.error('❌ Seed failed:', err?.message || err)
      process.exit(1)
    }
  }
}
