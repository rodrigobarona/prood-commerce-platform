import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const redis = vi.hoisted(() => ({ eval: vi.fn(), config: {} as { retry?: boolean; signal: () => AbortSignal } }))

vi.mock("@upstash/redis", () => ({
  Redis: class {
    eval = redis.eval
    constructor(config: typeof redis.config) {
      redis.config = config
    }
  },
}))

import { authRateLimitStorage, warnWithoutSharedLimits } from "@prood/auth/rate-limit-storage"

const rule = { window: 60, max: 3 }

describe("authRateLimitStorage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv("KV_REST_API_URL", "https://kv.test")
    vi.stubEnv("KV_REST_API_TOKEN", "token")
    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it("leaves Better Auth to count in memory without Redis", () => {
    vi.stubEnv("KV_REST_API_URL", "")
    expect(authRateLimitStorage()).toBeUndefined()
  })

  it("warns at startup in production without Redis, and only then", () => {
    vi.stubEnv("NODE_ENV", "production")
    warnWithoutSharedLimits()
    expect(console.error).not.toHaveBeenCalled()

    vi.stubEnv("KV_REST_API_URL", "")
    vi.stubEnv("NODE_ENV", "development")
    warnWithoutSharedLimits()
    expect(console.error).not.toHaveBeenCalled()

    vi.stubEnv("NODE_ENV", "production")
    warnWithoutSharedLimits()
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining("per instance"))
  })

  it("counts in Redis, under its own prefix", async () => {
    redis.eval.mockResolvedValue(-1)

    await expect(authRateLimitStorage()?.consume("1.2.3.4/sign-in", rule)).resolves.toEqual({
      allowed: true,
      retryAfter: null,
    })
    expect(redis.eval).toHaveBeenCalledWith(expect.any(String), ["auth:rate-limit:1.2.3.4/sign-in"], [60, 3])
  })

  it("says how long to wait once the limit is reached", async () => {
    redis.eval.mockResolvedValue(42)

    await expect(authRateLimitStorage()?.consume("key", rule)).resolves.toEqual({ allowed: false, retryAfter: 42 })
  })

  it("never tells anyone to wait 0 seconds", async () => {
    redis.eval.mockResolvedValue(-1)

    await authRateLimitStorage()?.consume("key", rule)
    expect(redis.eval.mock.calls[0]?.[0]).toContain("math.max(redis.call('ttl', KEYS[1]), 1)")
  })

  it("doesn't lock anyone out when Redis is down, and logs only the error's name", async () => {
    redis.eval.mockRejectedValue(new TypeError("https://token@kv.test refused"))

    await expect(authRateLimitStorage()?.consume("key", rule)).resolves.toEqual({ allowed: true, retryAfter: null })
    expect(console.error).toHaveBeenCalledWith(expect.any(String), "TypeError")
  })

  it("doesn't retry or wait on a slow Redis", () => {
    authRateLimitStorage()

    expect(redis.config).toMatchObject({ retry: false })
    expect(redis.config.signal()).toBeInstanceOf(AbortSignal)
  })

  it("doesn't count everyone with no address in one bucket", async () => {
    await expect(authRateLimitStorage()?.consume("no-trusted-ip|/sign-in/email", rule)).resolves.toEqual({
      allowed: true,
      retryAfter: null,
    })
    expect(redis.eval).not.toHaveBeenCalled()
  })
})
