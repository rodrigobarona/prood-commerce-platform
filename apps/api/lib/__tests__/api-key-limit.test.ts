import { beforeEach, describe, expect, it, vi } from "vitest"
import { CommerceError, toErrorResponse } from "@prood/types"

const mocks = vi.hoisted(() => ({
  update: vi.fn(),
  set: vi.fn(),
  rows: vi.fn(),
  after: vi.fn(),
}))

vi.mock("server-only", () => ({}))
vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  after: mocks.after,
}))
vi.mock("@prood/auth/rate-limit-storage", () => ({ authRateLimitStorage: () => undefined }))
vi.mock("@/lib/auth/db", () => ({
  authDb: {
    select: () => ({ from: () => ({ where: () => ({ limit: mocks.rows }) }) }),
    update: () => ({
      set: (values: unknown) => {
        mocks.set(values)
        return { where: mocks.update }
      },
    }),
  },
}))

import {
  API_KEY_REQUESTS_PER_MINUTE,
  assertApiKeyRate,
  countApiKeyRequest,
  rateLimitError,
  readApiKey,
} from "../api-key-limit"
import { errorResponse } from "../api"

const refusal = (keyId: string) =>
  assertApiKeyRate(keyId).then(
    () => null,
    (err: unknown) => err as CommerceError
  )

describe("assertApiKeyRate", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.update.mockResolvedValue(undefined)
  })

  it("goes well past the plugin's old 10 requests", async () => {
    for (let i = 0; i < 50; i += 1) await expect(refusal("key-busy")).resolves.toBeNull()
  })

  it("answers 429 with Retry-After once a key goes over, never 401", async () => {
    for (let i = 0; i < API_KEY_REQUESTS_PER_MINUTE; i += 1) await assertApiKeyRate("key-limit")

    const err = await refusal("key-limit")
    expect(err?.code).toBe("RATE_LIMIT")
    expect(toErrorResponse(err).status).toBe(429)

    const response = errorResponse(err)
    expect(response.status).toBe(429)
    expect(Number(response.headers.get("Retry-After"))).toBeGreaterThan(0)
    expect((await response.json()).message).toContain("600 requests a minute")
  })

  it("counts each key on its own", async () => {
    for (let i = 0; i < API_KEY_REQUESTS_PER_MINUTE; i += 1) await assertApiKeyRate("key-a")

    await expect(refusal("key-b")).resolves.toBeNull()
  })

  it("keeps Retry-After and the wording right at one second", () => {
    expect(errorResponse(rateLimitError(1)).headers.get("Retry-After")).toBe("1")
    expect(rateLimitError(1).message).toContain("Wait 1 second and")
  })
})

describe("readApiKey", () => {
  const key = { id: "key-1", referenceId: "org-1", enabled: true, expiresAt: null, metadata: null }

  beforeEach(() => vi.clearAllMocks())

  it("returns a good key without writing anything", async () => {
    mocks.rows.mockResolvedValue([key])

    await expect(readApiKey("pk_good")).resolves.toEqual(key)
    expect(mocks.set).not.toHaveBeenCalled()
  })

  it.each([
    ["an unknown key", [], "Invalid API key"],
    ["a revoked key", [{ ...key, enabled: false }], "revoked"],
    ["an expired key", [{ ...key, expiresAt: new Date(Date.now() - 1000) }], "has expired"],
  ])("refuses %s and says why", async (_, rows, message) => {
    mocks.rows.mockResolvedValue(rows)

    const err = await readApiKey("pk_bad").catch((caught: unknown) => caught as CommerceError)
    expect(err).toMatchObject({ code: "UNAUTHORIZED" })
    expect((err as CommerceError).message).toContain(message)
  })

  it("keeps a key that hasn't expired yet", async () => {
    mocks.rows.mockResolvedValue([{ ...key, expiresAt: new Date(Date.now() + 60_000) }])

    await expect(readApiKey("pk_good")).resolves.toMatchObject({ id: "key-1" })
  })
})

describe("countApiKeyRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    mocks.update.mockResolvedValue(undefined)
  })

  /** Runs what `after()` was given, as Next does once the response has gone. */
  async function flush() {
    for (const [task] of mocks.after.mock.calls) await (task as () => Promise<void>)()
    mocks.after.mockClear()
  }

  it("writes a burst once, then again only when the interval has passed", async () => {
    vi.setSystemTime(new Date("2026-11-02T10:00:00Z"))
    countApiKeyRequest("key-1")
    await flush()
    expect(mocks.set).toHaveBeenCalledTimes(1)

    for (let i = 0; i < 500; i += 1) countApiKeyRequest("key-1")
    expect(mocks.after).not.toHaveBeenCalled()

    vi.setSystemTime(new Date("2026-11-02T10:00:31Z"))
    countApiKeyRequest("key-1")
    await flush()
    expect(mocks.set).toHaveBeenCalledTimes(2)
    expect(mocks.set.mock.calls[1]?.[0]).toMatchObject({ lastRequest: new Date("2026-11-02T10:00:31Z") })
  })

  it("doesn't let a busy key hold back another key's first count", async () => {
    vi.setSystemTime(new Date("2026-11-02T10:30:00Z"))
    countApiKeyRequest("key-busy")
    await flush()
    mocks.set.mockClear()

    countApiKeyRequest("key-busy")
    expect(mocks.after).not.toHaveBeenCalled()

    countApiKeyRequest("key-new")
    await flush()
    expect(mocks.set).toHaveBeenCalledTimes(1)
  })

  it("doesn't fail a request over the Requests column", async () => {
    vi.setSystemTime(new Date("2026-11-02T11:00:00Z"))
    vi.spyOn(console, "error").mockImplementation(() => {})
    mocks.update.mockRejectedValue(new TypeError("https://token@db refused"))

    countApiKeyRequest("key-1")
    await flush()
    expect(console.error).toHaveBeenCalledWith(expect.any(String), "TypeError")
  })
})
