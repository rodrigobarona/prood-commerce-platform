import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  purge: vi.fn(),
  getSession: vi.fn(),
  exportAccount: vi.fn(),
  requireCaller: vi.fn(),
  exportStore: vi.fn(),
}))

vi.mock("@prood/auth/retention", () => ({ purgeExpiredAuthData: mocks.purge }))
vi.mock("@/lib/auth", () => ({ getSession: mocks.getSession }))
vi.mock("@prood/auth/data-export", () => ({ exportAccountData: mocks.exportAccount }))
vi.mock("@/lib/auth-tenant", () => ({ requireCaller: mocks.requireCaller }))
vi.mock("@prood/commerce/store-data", () => ({ exportStoreData: mocks.exportStore }))

import { GET as retention } from "../../app/internal/retention/route"
import { GET as accountExport } from "../../app/api/account/export/route"
import { GET as storeExport } from "../../app/api/store/export/route"

afterEach(() => {
  vi.unstubAllEnvs()
  vi.clearAllMocks()
})

describe("retention job", () => {
  beforeEach(() => mocks.purge.mockResolvedValue({ sessions: 2 }))
  const call = (authorization?: string) =>
    retention(new Request("https://api.prood.com/internal/retention", { headers: authorization ? { authorization } : {} }))

  it("refuses every call until CRON_SECRET is set", async () => {
    expect((await call("Bearer anything")).status).toBe(401)
    expect(mocks.purge).not.toHaveBeenCalled()
  })

  it("refuses a wrong secret", async () => {
    vi.stubEnv("CRON_SECRET", "right")
    expect((await call("Bearer wrong")).status).toBe(401)
    expect((await call()).status).toBe(401)
    expect(mocks.purge).not.toHaveBeenCalled()
  })

  it("runs for the cron's secret and reports what it deleted", async () => {
    vi.stubEnv("CRON_SECRET", "right")
    const res = await call("Bearer right")
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ deleted: { sessions: 2 } })
  })
})

describe("account export", () => {
  it("needs a signed-in session", async () => {
    mocks.getSession.mockResolvedValue(null)
    expect((await accountExport()).status).toBe(401)
    expect(mocks.exportAccount).not.toHaveBeenCalled()
  })

  it("downloads only the signed-in person's own data, as a file", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "u1" } })
    mocks.exportAccount.mockResolvedValue({ profile: { id: "u1" } })
    const res = await accountExport()
    expect(mocks.exportAccount).toHaveBeenCalledWith("u1")
    expect(res.headers.get("content-disposition")).toContain("attachment")
    expect(res.headers.get("cache-control")).toBe("no-store")
    expect(JSON.parse(await res.text())).toMatchObject({ profile: { id: "u1" } })
  })
})

describe("store export", () => {
  it("is not available to an API key or an agent", async () => {
    mocks.requireCaller.mockResolvedValue({ orgId: "o1", via: "api-key" })
    expect((await storeExport()).status).toBe(403)
    mocks.requireCaller.mockResolvedValue({ orgId: "o1", via: "agent" })
    expect((await storeExport()).status).toBe(403)
    expect(mocks.exportStore).not.toHaveBeenCalled()
  })

  it("asks for the admin scope, and exports the caller's own store from a session", async () => {
    mocks.requireCaller.mockResolvedValue({ orgId: "o1", via: "session" })
    mocks.exportStore.mockResolvedValue({ products: [{ id: "p1" }] })
    const res = await storeExport()
    expect(mocks.requireCaller).toHaveBeenCalledWith("admin")
    expect(mocks.exportStore).toHaveBeenCalledWith("o1")
    expect(JSON.parse(await res.text())).toMatchObject({ products: [{ id: "p1" }] })
  })
})
