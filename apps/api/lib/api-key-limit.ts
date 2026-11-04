import "server-only"
import { defaultKeyHasher } from "@better-auth/api-key"
import { apikey } from "@prood/auth/schema"
import { authRateLimitStorage } from "@prood/auth/rate-limit-storage"
import { CommerceError } from "@prood/types"
import { eq, sql } from "drizzle-orm"
import { after } from "next/server"
import { authDb } from "@/lib/auth/db"

/** Requests each API key may make in a minute. Documented in the OpenAPI spec. */
export const API_KEY_REQUESTS_PER_MINUTE = 600
const WINDOW_S = 60
/** How often an instance writes what it has counted. A key's row changes twice a minute at most. */
const FLUSH_EVERY_MS = 30_000
const KEY_PLACE = "Create a new one in your dashboard, under API keys."

interface KeyLimiter {
  consume(key: string, rule: { window: number; max: number }): Promise<{ allowed: boolean; retryAfter: number | null }>
}

/** Local development has no Redis, and one process, so counting here is enough. */
function memoryLimiter(): KeyLimiter {
  const windows = new Map<string, { count: number; endsAt: number }>()
  return {
    async consume(key, { window, max }) {
      const now = Date.now()
      const current = windows.get(key)
      if (!current || current.endsAt <= now) {
        windows.set(key, { count: 1, endsAt: now + window * 1000 })
        return { allowed: true, retryAfter: null }
      }
      current.count += 1
      if (current.count <= max) return { allowed: true, retryAfter: null }
      return { allowed: false, retryAfter: Math.ceil((current.endsAt - now) / 1000) }
    },
  }
}

let limiter: KeyLimiter | undefined

/**
 * Read only, because this runs on every request. The plugin's `verifyApiKey`
 * writes the key's row twice each time, and `deferUpdates` doesn't change that
 * on database storage. Reading it here also leaves an expired key in place, but
 * the plugin still sweeps those when keys are listed or created, so "expired"
 * is best effort and the invalid message has to cover it too.
 */
export async function readApiKey(rawKey: string) {
  const [key] = await authDb
    .select({
      id: apikey.id,
      referenceId: apikey.referenceId,
      enabled: apikey.enabled,
      expiresAt: apikey.expiresAt,
      metadata: apikey.metadata,
    })
    .from(apikey)
    .where(eq(apikey.key, await defaultKeyHasher(rawKey)))
    .limit(1)

  if (!key) {
    throw new CommerceError(`Invalid API key. It may be mistyped, or it may have expired. ${KEY_PLACE}`, "UNAUTHORIZED")
  }
  if (!key.enabled) throw new CommerceError(`This API key was revoked. ${KEY_PLACE}`, "UNAUTHORIZED")
  if (key.expiresAt && key.expiresAt.getTime() < Date.now()) {
    throw new CommerceError(`This API key has expired. ${KEY_PLACE}`, "UNAUTHORIZED")
  }
  return key
}

export function rateLimitError(retryAfter: number): CommerceError {
  const wait = `${retryAfter} ${retryAfter === 1 ? "second" : "seconds"}`
  return new CommerceError(
    `This API key has reached its limit of ${API_KEY_REQUESTS_PER_MINUTE} requests a minute. Wait ${wait} and try again.`,
    "RATE_LIMIT",
    429,
    undefined,
    retryAfter
  )
}

/** Our own limit, so a key answers 429 and not "invalid", and the limit is one number for every key. */
export async function assertApiKeyRate(keyId: string): Promise<void> {
  limiter ??= authRateLimitStorage() ?? memoryLimiter()
  const { allowed, retryAfter } = await limiter.consume(`api-key|${keyId}`, {
    window: WINDOW_S,
    max: API_KEY_REQUESTS_PER_MINUTE,
  })
  if (!allowed) throw rateLimitError(retryAfter ?? WINDOW_S)
}

/**
 * Agents don't use a key, so their calls share one allowance per store, the
 * same size as a key's. Without it only the per-IP limit on the execute route
 * would cap them.
 */
export async function assertAgentRate(orgId: string): Promise<void> {
  limiter ??= authRateLimitStorage() ?? memoryLimiter()
  const { allowed, retryAfter } = await limiter.consume(`agent|${orgId}`, {
    window: WINDOW_S,
    max: API_KEY_REQUESTS_PER_MINUTE,
  })
  if (!allowed) {
    const wait = retryAfter ?? WINDOW_S
    throw new CommerceError(
      `This store's AI agents have reached their limit of ${API_KEY_REQUESTS_PER_MINUTE} requests a minute. Wait ${wait} ${wait === 1 ? "second" : "seconds"} and try again.`,
      "RATE_LIMIT",
      429,
      undefined,
      wait
    )
  }
}

const unwritten = new Map<string, { requests: number; lastRequest: Date }>()
/** Each key's own clock, so a busy key can't hold back another key's first count. */
const nextFlushAt = new Map<string, number>()

async function flushApiKeyUsage(): Promise<void> {
  const now = Date.now()
  for (const [keyId, at] of nextFlushAt) {
    if (at <= now) nextFlushAt.delete(keyId)
  }
  const due = [...unwritten].filter(([keyId]) => !nextFlushAt.has(keyId))
  for (const [keyId] of due) {
    unwritten.delete(keyId)
    nextFlushAt.set(keyId, now + FLUSH_EVERY_MS)
  }
  await Promise.all(
    due.map(([keyId, { requests, lastRequest }]) =>
      authDb
        .update(apikey)
        .set({ requestCount: sql`${apikey.requestCount} + ${requests}`, lastRequest })
        .where(eq(apikey.id, keyId))
        .catch((err: unknown) => {
          console.error("[api] couldn't write API key usage:", err instanceof Error ? err.name : "unknown")
        })
    )
  )
}

/**
 * The dashboard's Requests and Last used. A key's first request writes after the
 * response. Later ones add up here and go out with the first request past the
 * interval, so a busy key costs each instance two row writes a minute and not one
 * for each request. It's a display number: a quiet instance holds its last 30
 * seconds of counts until its next API key request, and one that stops loses them.
 */
export function countApiKeyRequest(keyId: string): void {
  const now = new Date()
  unwritten.set(keyId, { requests: (unwritten.get(keyId)?.requests ?? 0) + 1, lastRequest: now })
  if (now.getTime() < (nextFlushAt.get(keyId) ?? 0)) return
  after(flushApiKeyUsage)
}
