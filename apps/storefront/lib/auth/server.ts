import { after } from "next/server"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { nextCookies } from "better-auth/next-js"
import { autoLinkGuestCustomers, getStorefrontIdentity, lookupTenantByHost } from "@prood/platform"
import { resolveTenantId } from "../tenant"
import { authDb } from "./db"
import * as schema from "@prood/auth/schema"
import { getMailer } from "../mailer"

/** Name and origin of the store serving the current request. */
async function currentStore() {
  const storefrontUrl = process.env.NEXT_PUBLIC_STOREFRONT_URL
  if (!storefrontUrl) throw new Error("NEXT_PUBLIC_STOREFRONT_URL is required")
  return getStorefrontIdentity(await resolveTenantId(), storefrontUrl)
}

/** Send a shopper email branded as the current store, after the response. */
function sendStoreEmail(
  to: string,
  build: (store: { name: string; origin: string }) => {
    subject: string
    template: string
    data: Record<string, unknown>
  },
) {
  after(async () => {
    try {
      const store = await currentStore()
      await getMailer().send("email", { to, ...build(store) })
    } catch (err) {
      console.error(`[storefront-auth] email to ${to} failed`, err)
    }
  })
}

/** Better Auth builds links from the request URL; send shoppers to their store. */
function onStoreOrigin(url: string, store: { origin: string }) {
  const { pathname, search } = new URL(url)
  return `${store.origin}${pathname}${search}`
}

/**
 * Shopper auth (email/password on Neon via Drizzle). It serves every store
 * origin, so `baseURL` is inferred per request — do not set BETTER_AUTH_URL
 * for the storefront.
 */
function createAuth() {
  const secret = process.env.BETTER_AUTH_SECRET?.trim()
  if (!secret) throw new Error("BETTER_AUTH_SECRET is required")
  return betterAuth({
    database: drizzleAdapter(authDb, { provider: "pg", schema }),
    // Trust an Origin only when it resolves to a store (slug subdomain or
    // verified custom domain).
    trustedOrigins: async (request) => {
      const origin = request?.headers.get("origin")
      const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN
      if (!origin || !platformDomain || !URL.canParse(origin)) return []
      const { hostname } = new URL(origin)
      return (await lookupTenantByHost(hostname, platformDomain)) ? [origin] : []
    },
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            if (user.email) {
              sendStoreEmail(user.email, (store) => ({
                subject: `Welcome to ${store.name}`,
                template: "welcome",
                data: {
                  companyName: store.name,
                  name: user.name ?? user.email.split("@")[0],
                  dashboardUrl: `${store.origin}/account`,
                },
              }))
            }
          },
        },
      },
    },
    emailAndPassword: {
      enabled: true,
      sendResetPassword: async ({ user, url }) => {
        sendStoreEmail(user.email, (store) => ({
          subject: `Reset your ${store.name} password`,
          template: "password-reset",
          data: { companyName: store.name, url: onStoreOrigin(url, store) },
        }))
      },
    },
    // Signing in doesn't need a verified email, only claiming guest orders does.
    emailVerification: {
      sendOnSignUp: true,
      sendVerificationEmail: async ({ user, url }) => {
        sendStoreEmail(user.email, (store) => ({
          subject: `Confirm your email for ${store.name}`,
          template: "activation",
          data: { companyName: store.name, url: onStoreOrigin(url, store) },
        }))
      },
      afterEmailVerification: async (user) => {
        // The email is already verified here, so a failed link must not fail
        // the request. Guest orders can be linked later.
        await autoLinkGuestCustomers(user.id, user.email).catch((err) =>
          console.error(`[storefront-auth] guest link for ${user.id} failed`, err)
        )
      },
    },
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
