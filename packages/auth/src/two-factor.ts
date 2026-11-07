import { and, eq, like } from "drizzle-orm"
import { authDb } from "./db"
import { session, twoFactor, user, verification } from "./schema"

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

/**
 * Turns two-factor off for someone who can no longer get in: lost phone and no backup codes.
 * Only for an administrator who has checked who is asking. It removes the secret and backup
 * codes, forgets every trusted device, and signs the person out everywhere, so a session an
 * attacker holds dies with it. The person signs in with their password and can turn it on again.
 * It runs as separate statements, in an order that is safe to run again if one fails.
 */
export async function resetTwoFactor(userId: string): Promise<void> {
  await authDb.delete(twoFactor).where(eq(twoFactor.userId, userId))
  await authDb.update(user).set({ twoFactorEnabled: false, updatedAt: new Date() }).where(eq(user.id, userId))
  await authDb
    .delete(verification)
    .where(and(eq(verification.value, userId), like(verification.identifier, "trust-device-%")))
  await authDb.delete(session).where(eq(session.userId, userId))
}
