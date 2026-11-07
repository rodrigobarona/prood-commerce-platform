import { APIError } from "better-auth/api"
import { isTwoFactorEnabledForEmail } from "@prood/auth/two-factor"

/**
 * Stores and the dashboard share one user table and one signing secret, so a session from
 * either is good at both. The dashboard asks for a second factor and a store doesn't, which
 * would let a password alone get around it. An account with two-factor on signs in from the
 * dashboard, never from a store.
 */
export async function refuseTwoFactorPasswordSignIn(ctx: { path: string; body?: unknown }): Promise<void> {
  if (ctx.path !== "/sign-in/email") return
  const email = (ctx.body as { email?: unknown } | undefined)?.email
  if (typeof email !== "string") return
  if (await isTwoFactorEnabledForEmail(email)) {
    throw new APIError("FORBIDDEN", {
      message: "This account uses two-factor sign-in. Sign in from the Prood dashboard.",
    })
  }
}
