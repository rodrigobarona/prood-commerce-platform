import { after } from "next/server"
import { getMailer } from "../mailer"

/**
 * Sent after the response: awaiting here would let response times show which
 * addresses have accounts, and a bare promise can die with the function.
 */
export function sendPasswordResetEmail({ user, url }: { user: { id: string; email: string }; url: string }): void {
  after(async () => {
    try {
      await getMailer().send("email", {
        to: user.email,
        subject: "Reset your password",
        template: "password-reset",
        data: { companyName: "Prood", url },
      })
    } catch (err) {
      console.error(`[auth] password reset email for ${user.id} failed:`, err)
    }
  })
}
