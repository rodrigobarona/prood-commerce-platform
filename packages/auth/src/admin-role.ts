import { sql } from "drizzle-orm"
import { authDb } from "./db"
import { user } from "./schema"

/**
 * Takes the admin role away, unless nobody who can sign in would be left with
 * it. One statement, so two admins demoting each other can't both pass: it locks
 * every admin in the same order, and the second sees what the first changed.
 * Returns false when it refused. A user who isn't an admin is left as they are.
 */
export async function demoteAdmin(userId: string): Promise<boolean> {
  const demoted = await authDb.execute(sql`
    UPDATE "user" SET role = 'user', updated_at = now()
    WHERE id = ${userId} AND role = 'admin' AND (
      SELECT count(*) FILTER (WHERE admins.id <> ${userId}) FROM (
        SELECT id FROM "user"
        WHERE role = 'admin' AND banned IS NOT TRUE
        ORDER BY id
        FOR UPDATE
      ) admins
    ) > 0
    RETURNING id
  `)
  if (demoted.rows.length > 0) return true
  const [target] = await authDb.select({ role: user.role }).from(user).where(sql`${user.id} = ${userId}`).limit(1)
  return target?.role !== "admin"
}
