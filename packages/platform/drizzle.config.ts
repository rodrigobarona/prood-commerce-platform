import { existsSync } from 'node:fs'
import { defineConfig } from 'drizzle-kit'

// One migrations folder for the whole database: the commerce schema owned by
// this package plus the Better Auth tables in @prood/auth. Commands run from
// packages/platform, so the repo-root .env.local supplies DATABASE_URL locally.
const rootEnv = '../../.env.local'
if (!process.env.DATABASE_URL && existsSync(rootEnv)) process.loadEnvFile(rootEnv)

export default defineConfig({
  schema: ['./src/database/drizzle/schema/index.ts', '../auth/src/schema.ts'],
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
