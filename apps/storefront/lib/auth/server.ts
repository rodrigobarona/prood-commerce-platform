import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { nextCookies } from "better-auth/next-js"
import { autoLinkGuestCustomers } from "@prood/platform"
import { authDb } from "./db"
import * as schema from "./schema"
import { getMailer } from "../mailer"

function resolveBetterAuthEnv(defaultBaseUrl: string) {
  const secret = process.env.BETTER_AUTH_SECRET?.trim()
  const baseURL = process.env.BETTER_AUTH_URL?.trim()

  return { baseURL: baseURL ?? defaultBaseUrl, secret }
}

/**
 * Better Auth instance — email/password on Neon Postgres via Drizzle.
 */
function createAuth() {
  const { baseURL, secret } = resolveBetterAuthEnv("http://localhost:3000")
  return betterAuth({
    database: drizzleAdapter(authDb, { provider: "pg", schema }),
    trustedOrigins: (request) => {
      const origin = request?.headers.get("origin")
      if (!origin) return []
      try {
        const { hostname } = new URL(origin)
        if (hostname === "localhost") return [origin]
        if (hostname.endsWith(".prood.app")) return [origin]
        if (hostname.endsWith(".vercel.app")) return [origin]
        return []
      } catch {
        return []
      }
    },
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            if (user.email) {
              try {
                await autoLinkGuestCustomers(user.id, user.email)
              } catch {
                // non-critical — linking can be retried on next login
              }
              void getMailer().send("email", {
                to: user.email,
                subject: "Welcome!",
                template: "welcome",
                data: {
                  companyName: "Prood",
                  name: user.name ?? user.email.split("@")[0],
                  dashboardUrl: `${baseURL}/account`,
                },
              })
            }
          },
        },
      },
    },
    emailAndPassword: {
      enabled: true,
      sendResetPassword: async ({ user, url }) => {
        void getMailer().send("email", {
          to: user.email,
          subject: "Reset your password",
          template: "password-reset",
          data: { companyName: "Prood", url },
        })
      },
    },
    emailVerification: {
      sendVerificationEmail: async ({ user, url }) => {
        void getMailer().send("email", {
          to: user.email,
          subject: "Confirm your email address",
          template: "activation",
          data: { companyName: "Prood", url },
        })
      },
    },
    baseURL,
    secret,
    plugins: [nextCookies()],
  })
}

let instance: ReturnType<typeof createAuth> | null = null

export function getAuth(): ReturnType<typeof createAuth> {
  return (instance ??= createAuth())
}

export type Session = ReturnType<typeof createAuth>["$Infer"]["Session"]
export type SessionUser = Session["user"]
