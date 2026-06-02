import { existsSync, readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "drizzle-kit"

function loadEnvFile(path: string) {
  if (!existsSync(path)) return
  const content = readFileSync(path, "utf-8")
  for (const line of content.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eqIdx = trimmed.indexOf("=")
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    let value = trimmed.slice(eqIdx + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  }
}

const appDir = dirname(fileURLToPath(import.meta.url))
const root = resolve(appDir, "../..")
loadEnvFile(resolve(appDir, ".env.local"))
loadEnvFile(resolve(root, ".env.local"))
loadEnvFile(resolve(appDir, ".env"))
loadEnvFile(resolve(root, ".env"))

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is required. Set it in apps/dashboard/.env.local or the repo root .env.local.",
  )
}

// Schema for the Better Auth tables shared with the storefront, plus the
// organization/member/invitation tables that model each tenant (store).
// Run `pnpm --filter dashboard db:push` to sync them in the Neon database.
export default defineConfig({
  schema: "./lib/auth/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
})
