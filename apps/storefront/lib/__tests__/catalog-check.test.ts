import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ GET: vi.fn(), lookupTenantByHost: vi.fn() }))

vi.mock("@prood/api-client", () => ({ createCommerceApiClient: () => ({ GET: mocks.GET }) }))
vi.mock("@prood/platform", () => ({ DEMO_ORG_ID: "org_demo", lookupTenantByHost: mocks.lookupTenantByHost }))

async function load() {
  vi.resetModules()
  return (await import("../catalog-check")).isMissingCatalogPage
}

async function loadPolicyCheck() {
  vi.resetModules()
  return (await import("../catalog-check")).isMissingPolicyPage
}

beforeEach(() => {
  mocks.GET.mockReset()
  mocks.lookupTenantByHost.mockReset()
  vi.stubEnv("COMMERCE_API_URL", "http://api.test")
  vi.stubEnv("NEXT_PUBLIC_PLATFORM_DOMAIN", "store.test")
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllEnvs()
})

describe("isMissingCatalogPage", () => {
  it("leaves other pages alone", async () => {
    const check = await load()
    expect(await check("/cart", "store.test")).toBe(false)
    expect(mocks.GET).not.toHaveBeenCalled()
  })

  it("asks with a deadline", async () => {
    mocks.GET.mockResolvedValue({ response: new Response(null, { status: 200 }) })
    const check = await load()
    await check("/products/mug", "store.test")
    expect(mocks.GET.mock.lastCall?.[1].signal).toBeInstanceOf(AbortSignal)
  })

  it("reports a product the API can't find", async () => {
    mocks.GET.mockResolvedValue({ response: new Response(null, { status: 404 }) })
    const check = await load()
    expect(await check("/products/gone", "store.test")).toBe(true)
  })

  it("fails open when the API stalls or errors, and asks again next time", async () => {
    mocks.GET.mockRejectedValueOnce(new DOMException("Timed out", "TimeoutError"))
    mocks.GET.mockResolvedValueOnce({ response: new Response(null, { status: 500 }) })
    mocks.GET.mockResolvedValueOnce({ response: new Response(null, { status: 404 }) })
    const check = await load()
    expect(await check("/products/mug", "store.test")).toBe(false)
    expect(await check("/products/mug", "store.test")).toBe(false)
    expect(await check("/products/mug", "store.test")).toBe(true)
  })

  it("remembers an answer briefly, for each store apart", async () => {
    vi.useFakeTimers()
    mocks.GET.mockImplementation(async () => ({ response: new Response(null, { status: 200 }) }))
    const check = await load()
    await check("/products/mug", "a.test")
    await check("/products/mug", "a.test")
    expect(mocks.GET).toHaveBeenCalledTimes(1)
    await check("/products/mug", "b.test")
    expect(mocks.GET).toHaveBeenCalledTimes(2)
    vi.advanceTimersByTime(31_000)
    await check("/products/mug", "a.test")
    expect(mocks.GET).toHaveBeenCalledTimes(3)
  })

  it("answers for every category from one lookup", async () => {
    mocks.GET.mockResolvedValue({ data: [{ slug: "linen" }, { slug: "living" }] })
    const check = await load()
    expect(await check("/categories/linen", "store.test")).toBe(false)
    expect(await check("/categories/nope", "store.test")).toBe(true)
    expect(mocks.GET).toHaveBeenCalledTimes(1)
  })

  it("says nothing about a category when the list can't be read", async () => {
    mocks.GET.mockResolvedValue({ data: undefined })
    const check = await load()
    expect(await check("/categories/linen", "store.test")).toBe(false)
  })
})

describe("isMissingPolicyPage", () => {
  it("leaves other pages alone", async () => {
    const check = await loadPolicyCheck()
    expect(await check("/products/mug", "a.store.test")).toBe(false)
    expect(mocks.lookupTenantByHost).not.toHaveBeenCalled()
  })

  it("needs no lookup for a policy that doesn't exist anywhere", async () => {
    const check = await loadPolicyCheck()
    expect(await check("/policies/nope", "a.store.test")).toBe(true)
    expect(mocks.lookupTenantByHost).not.toHaveBeenCalled()
  })

  it("keeps the demo's policies to the demo", async () => {
    mocks.lookupTenantByHost.mockImplementation(async (host: string) => (host === "demo.store.test" ? "org_demo" : "org_real"))
    const check = await loadPolicyCheck()
    expect(await check("/policies/terms", "demo.store.test")).toBe(false)
    expect(await check("/policies/terms", "real.store.test")).toBe(true)
  })

  it("leaves an unknown host to the page, which sends it to the marketing site", async () => {
    mocks.lookupTenantByHost.mockResolvedValue(null)
    const check = await loadPolicyCheck()
    expect(await check("/policies/terms", "nobody.store.test")).toBe(false)
  })

  it("fails open when the lookup breaks or stalls, and asks again next time", async () => {
    vi.useFakeTimers()
    mocks.lookupTenantByHost.mockRejectedValueOnce(new Error("connect ECONNREFUSED"))
    mocks.lookupTenantByHost.mockReturnValueOnce(new Promise(() => {}))
    mocks.lookupTenantByHost.mockResolvedValue("org_real")
    const check = await loadPolicyCheck()
    expect(await check("/policies/terms", "real.store.test")).toBe(false)

    const stalled = check("/policies/terms", "real.store.test")
    await vi.advanceTimersByTimeAsync(2000)
    expect(await stalled).toBe(false)

    expect(await check("/policies/terms", "real.store.test")).toBe(true)
  })

  it("remembers a store briefly", async () => {
    mocks.lookupTenantByHost.mockResolvedValue("org_real")
    const check = await loadPolicyCheck()
    await check("/policies/terms", "real.store.test")
    await check("/policies/privacy", "real.store.test")
    expect(mocks.lookupTenantByHost).toHaveBeenCalledTimes(1)
  })
})
