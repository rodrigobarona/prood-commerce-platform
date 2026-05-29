import { defineConfig } from "drizzle-kit"

// Schema for the Better Auth tables shared with the storefront, plus the
// organization/member/invitation tables that model each tenant (store).
// Run `pnpm --filter dashboard db:push` to sync them in the Neon database.
export default defineConfig({
  schema: "./lib/auth/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
