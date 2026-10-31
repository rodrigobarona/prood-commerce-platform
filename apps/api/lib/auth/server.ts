import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { nextCookies } from "better-auth/next-js"
import { APIError, createAuthMiddleware } from "better-auth/api"
import { admin, organization } from "better-auth/plugins"
import { agentAuth } from "@better-auth/agent-auth"
import {
  resolveBetterAuthEnv,
  resolveBetterAuthTrustedOrigins,
  storeApiKey,
} from "@prood/auth/server"
import { storeAccess } from "@prood/auth/access"
import { authDb } from "@prood/auth/db"
import * as schema from "@prood/auth/schema"
import { autoLinkGuestCustomers } from "@prood/platform"
import { organizationHooks } from "./organization-hooks"
import { getAgentAuthOpenAPIOptions } from "./agent-config"
import { requiredEnv } from "@prood/types"
import { getMailer } from "../mailer"

/**
 * Agents are approved in the dashboard, which checks the approver's role in the
 * store. These plugin routes would grant capabilities with only a session.
 */
const DASHBOARD_ONLY_PATHS = new Set(["/agent/approve-capability", "/agent/grant-capability"])

/**
 * Better Auth for the API app — uses shared env/origin helpers from
 * `@prood/auth` and adds Agent Auth (typed plugin APIs require a local
 * `betterAuth()` call here).
 */
function createAuth() {
  const { secret, baseURL } = resolveBetterAuthEnv()
  const cookieDomain = process.env.AUTH_COOKIE_DOMAIN?.trim()
  const dashboardUrl = requiredEnv(process.env.NEXT_PUBLIC_DASHBOARD_URL, "NEXT_PUBLIC_DASHBOARD_URL")

  return betterAuth({
    database: drizzleAdapter(authDb, { provider: "pg", schema }),
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (DASHBOARD_ONLY_PATHS.has(ctx.path)) {
          throw new APIError("FORBIDDEN", { message: "Approve agents in your dashboard." })
        }
      }),
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
    // Signing in doesn't need a verified email, only claiming guest orders does.
    emailVerification: {
      sendOnSignUp: true,
      sendVerificationEmail: async ({ user, url }) => {
        // Sign-up waits for this, and has to work where email isn't configured.
        try {
          await getMailer().send("email", {
            to: user.email,
            subject: "Confirm your email address",
            template: "activation",
            data: { companyName: "Prood", url },
          })
        } catch (err) {
          console.error(`[auth] verification email for ${user.id} failed:`, err)
        }
      },
      afterEmailVerification: async (user) => {
        try {
          const linked = await autoLinkGuestCustomers(user.id, user.email)
          if (linked > 0) {
            console.log(`[auth] Auto-linked ${linked} guest customer(s) for ${user.id}`)
          }
        } catch (err) {
          console.error("[auth] Guest auto-link failed:", err)
        }
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
        ...storeAccess,
        organizationHooks,
        async sendInvitationEmail(data) {
          const inviteLink = `${dashboardUrl}/invite/${data.id}`
          await getMailer().send("email", {
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
      storeApiKey(),
      admin({ defaultRole: "user" }),
      agentAuth({
        modes: ["delegated", "autonomous"],
        // The approval UI lives in the dashboard, not on the API origin.
        deviceAuthorizationPage: `${dashboardUrl}/device/capabilities`,
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
