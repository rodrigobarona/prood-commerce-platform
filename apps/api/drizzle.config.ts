import { defineConfig } from "drizzle-kit"

// Better Auth tables shared with dashboard/storefront, plus `apikey` and Agent
// Auth tables (`agentHost`, `agent`, `agentCapabilityGrant`, `approvalRequest`).
// Run
// `pnpm --filter api db:push` to sync them in the Neon database.
export default defineConfig({
  schema: "./lib/auth/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
