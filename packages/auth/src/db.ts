import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "./schema"

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://placeholder:placeholder@localhost:5432/placeholder"

const sql = neon(connectionString)

/** Drizzle client scoped to the Better Auth tables (shares the Neon database). */
export const authDb = drizzle(sql, { schema })
