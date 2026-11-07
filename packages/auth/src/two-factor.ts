import { eq } from "drizzle-orm"
import { authDb } from "./db"
import { user } from "./schema"

/**
 * Whether a person has confirmed an authenticator app. Read from the table on
 * each call, so turning it on or off shows on the next page load. Auth tables
 * are private to this connection, so call it outside `withTenant()`.
 */
export async function isTwoFactorEnabled(userId: string): Promise<boolean> {
  const [row] = await authDb
    .select({ enabled: user.twoFactorEnabled })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1)
  return row?.enabled === true
}

/** The same, for someone about to sign in: they are known by their address, not yet by id. */
export async function isTwoFactorEnabledForEmail(email: string): Promise<boolean> {
  const [row] = await authDb
    .select({ enabled: user.twoFactorEnabled })
    .from(user)
    .where(eq(user.email, email.trim().toLowerCase()))
    .limit(1)
  return row?.enabled === true
}
