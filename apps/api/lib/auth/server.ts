import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { nextCookies } from "better-auth/next-js"
import { admin, organization } from "better-auth/plugins"
import { apiKey } from "@better-auth/api-key"
import { agentAuth } from "@better-auth/agent-auth"
import {
  resolveBetterAuthEnv,
  resolveBetterAuthTrustedOrigins,
} from "@prood/auth/server"
import { authDb } from "@prood/auth/db"
import * as schema from "@prood/auth/schema"
import { autoLinkGuestCustomers } from "@prood/platform"
import { organizationHooks } from "./organization-hooks"
import { getAgentAuthOpenAPIOptions } from "./agent-config"
import { getMailer } from "../mailer"

/**
 * Better Auth for the API app — uses shared env/origin helpers from
 * `@prood/auth` and adds Agent Auth (typed plugin APIs require a local
 * `betterAuth()` call here).
 */
function createAuth() {
  const { secret } = resolveBetterAuthEnv("http://localhost:3005")
  const baseURL =
    process.env.API_PUBLIC_URL?.trim() ??
    process.env.BETTER_AUTH_URL?.trim() ??
    "http://localhost:3005"
  const cookieDomain = process.env.AUTH_COOKIE_DOMAIN?.trim()
  const dashboardUrl =
    process.env.NEXT_PUBLIC_DASHBOARD_URL?.trim() ?? "http://localhost:3002"

  return betterAuth({
    database: drizzleAdapter(authDb, { provider: "pg", schema }),
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            if (user.email) {
              try {
                const linked = await autoLinkGuestCustomers(user.id, user.email)
                if (linked > 0) {
                  console.log(`[auth] Auto-linked ${linked} guest customer(s) for ${user.email}`)
                }
              } catch (err) {
                console.error("[auth] Guest auto-link failed:", err)
              }
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
    trustedOrigins: resolveBetterAuthTrustedOrigins,
    advanced: cookieDomain
      ? {
          crossSubDomainCookies: {
            enabled: true,
            domain: cookieDomain,
          },
        }
      : undefined,
    plugins: [
      organization({
        organizationHooks,
        async sendInvitationEmail(data) {
          const inviteLink = `${dashboardUrl}/invite/${data.id}`
          void getMailer().send("email", {
            to: data.email,
            subject: `Join ${data.organization.name} on Prood`,
            template: "team-invite",
            data: {
              companyName: data.organization.name,
              inviterName: data.inviter.user.name ?? data.inviter.user.email,
              inviteUrl: inviteLink,
              role: data.role,
            },
          })
        },
      }),
      apiKey(),
      admin({
        defaultRole: "user",
        adminUserIds: (process.env.ADMIN_USER_IDS ?? "")
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean),
      }),
      agentAuth({
        modes: ["delegated", "autonomous"],
        deviceAuthorizationPage:
          process.env.AGENT_DEVICE_AUTH_PAGE ?? "/device/capabilities",
        trustProxy: process.env.TRUST_PROXY === "true",
        ...getAgentAuthOpenAPIOptions(),
      }),
      nextCookies(),
    ],
  })
}

let instance: ReturnType<typeof createAuth> | null = null

/** The shared Better Auth instance for the API app (includes Agent Auth). */
export function getAuth(): ReturnType<typeof createAuth> {
  return (instance ??= createAuth())
}

export type Session = ReturnType<typeof createAuth>["$Infer"]["Session"]
export type SessionUser = Session["user"]
