import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "./schema"

// A placeholder keeps module evaluation safe during build when DATABASE_URL is
// not present; the real connection string is used at runtime on Vercel.
const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://placeholder:placeholder@localhost:5432/placeholder"

const sql = neon(connectionString)

/** Drizzle client scoped to the Better Auth tables (shares the Neon database). */
export const authDb = drizzle(sql, { schema })
