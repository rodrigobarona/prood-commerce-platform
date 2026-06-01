#!/usr/bin/env node
/**
 * Apply a drizzle-kit SQL file (statement-breakpoint separated) to Neon.
 * Usage: node --env-file=.env.local scripts/apply-sql-migration.mjs path/to/file.sql
 */
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
const require = createRequire(
  new URL("../packages/platform/package.json", import.meta.url)
)
const { neon } = require("@neondatabase/serverless")

const file = process.argv[2]
if (!file) {
  console.error("Usage: apply-sql-migration.mjs <file.sql>")
  process.exit(1)
}

const url = process.env.DATABASE_URL
if (!url) {
  console.error("DATABASE_URL is required")
  process.exit(1)
}

const raw = readFileSync(file, "utf8")
const statements = raw
  .split(/--> statement-breakpoint\n?/)
  .map((s) => s.trim())
  .filter(Boolean)

const sql = neon(url)

/** PostgreSQL codes / messages for idempotent re-runs. */
function isAlreadyExistsError(err) {
  const code = err?.code
  return (
    code === "42P07" || // duplicate_table
    code === "42710" || // duplicate_object (constraint, index)
    code === "42P16" || // invalid_table_definition (column exists)
    err?.message?.includes("already exists")
  )
}

for (const statement of statements) {
  console.log(`→ ${statement.slice(0, 60).replace(/\s+/g, " ")}…`)
  try {
    await sql.query(statement)
  } catch (err) {
    if (isAlreadyExistsError(err)) {
      console.log("  skipped (already exists)")
      continue
    }
    throw err
  }
}
console.log(`Applied ${statements.length} statements from ${file}`)
