import { authRateLimitStorage } from "./rate-limit-storage"

/**
 * The two instances that sign people in, apps/api and the storefront, share
 * these tables, so their password rules live here. Each reset still runs on
 * its own instance: what isn't set there doesn't happen.
 */
export const sharedEmailAndPassword = {
  enabled: true,
  // A reset is often someone locking a thief out, so it ends every other session.
  revokeSessionsOnPasswordReset: true,
} as const

/**
 * Serverless instances don't share memory, so the limits live in Redis, keyed
 * on `clientIpHeader`. Pass only a header the platform or the proxy guarantees.
 */
export function sharedAuthOptions(clientIpHeader: string) {
  return {
    rateLimit: { customStorage: authRateLimitStorage() },
    advanced: { ipAddress: { ipAddressHeaders: [clientIpHeader] } },
  }
}
