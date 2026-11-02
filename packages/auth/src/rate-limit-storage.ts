import { Redis } from "@upstash/redis"

const PREFIX = "auth:rate-limit:"
/** Better Auth's key when it couldn't find an address: `no-trusted-ip|/sign-in/email`. */
const NO_ADDRESS = "no-trusted-ip|"
/** A sign-in shouldn't wait on the limiter for longer than this. */
const TIMEOUT_MS = 500

/**
 * One step, so simultaneous requests can't all pass a stale count. -1 means
 * allowed. A refusal is at least 1 second: a TTL rounded to 0 would tell the
 * caller to wait 0 seconds and drop `Retry-After`.
 */
const CONSUME = `
local count = redis.call('incr', KEYS[1])
if count == 1 then redis.call('expire', KEYS[1], ARGV[1]) end
if count > tonumber(ARGV[2]) then return math.max(redis.call('ttl', KEYS[1]), 1) end
return -1
`

const ALLOWED = { allowed: true, retryAfter: null }

/**
 * For an app's `instrumentation.ts`, which runs once per server. Without Redis
 * each instance counts on its own, so the real limit is the limit times however
 * many are running.
 */
export function warnWithoutSharedLimits() {
  if (process.env.NODE_ENV !== "production") return
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) return
  console.error(
    "[auth] KV_REST_API_URL and KV_REST_API_TOKEN aren't set. Rate limits are per instance until they are, so sign-in and API key limits don't hold."
  )
}

/**
 * Where Better Auth counts requests. Without Redis (local development) it
 * returns nothing and Better Auth counts in memory. A Redis outage lets requests
 * through, quickly, rather than locking everyone out of signing in. So does a
 * request with no address: counting those together would be one shared bucket.
 */
export function authRateLimitStorage() {
  const url = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN
  if (!url || !token) return undefined
  const redis = new Redis({ url, token, retry: false, signal: () => AbortSignal.timeout(TIMEOUT_MS) })

  return {
    async consume(key: string, rule: { window: number; max: number }) {
      if (key.startsWith(NO_ADDRESS)) return ALLOWED
      try {
        const retryAfter = await redis.eval<[number, number], number>(CONSUME, [`${PREFIX}${key}`], [rule.window, rule.max])
        return retryAfter < 0 ? ALLOWED : { allowed: false, retryAfter }
      } catch (err) {
        console.error("[auth] rate limit check failed:", err instanceof Error ? err.name : "unknown")
        return ALLOWED
      }
    },
  }
}
