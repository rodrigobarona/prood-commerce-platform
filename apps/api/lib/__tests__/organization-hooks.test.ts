import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ limits: vi.fn(), seats: vi.fn(), livePlan: vi.fn(), deleteData: vi.fn(), deleteKeys: vi.fn() }))

vi.mock("server-only", () => ({}))
vi.mock("@prood/auth/db", () => ({
  authDb: {
    select: () => ({ from: () => ({ where: () => ({ limit: mocks.livePlan }) }) }),
    delete: () => ({ where: mocks.deleteKeys }),
  },
}))
vi.mock("@prood/commerce/store-data", () => ({ deleteStoreData: mocks.deleteData }))
vi.mock("@prood/commerce/tenant-store", () => ({ provisionOrganizationStore: vi.fn() }))
vi.mock("@/lib/org-plan", () => ({ getOrganizationLimits: mocks.limits }))
vi.mock("@prood/auth/membership", () => ({ countTeamSeats: mocks.seats }))

import { assertSeatAvailable, assertStoreSlug, membershipLimit, organizationHooks } from "../auth/organization-hooks"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("changing a store", () => {
  it("refuses a new address, through any route", async () => {
    await expect(organizationHooks.beforeUpdateOrganization({ organization: { slug: "api" } })).rejects.toThrow(
      "We can't change a store's address"
    )
  })

  it("lets everything else change", async () => {
    await expect(organizationHooks.beforeUpdateOrganization({ organization: {} })).resolves.toBeUndefined()
  })
})

describe("assertStoreSlug", () => {
  it.each(["gres", "casa-exemplo", "loja2"])("takes %s", (slug) => {
    expect(() => assertStoreSlug(slug)).not.toThrow()
  })

  it.each(["api", "www", "GRES", "gr-és", "-gres", "gres-", "a--b", "a b", "", undefined, "a".repeat(64)])(
    "refuses %s",
    (slug) => {
      expect(() => assertStoreSlug(slug)).toThrow("We can't use that store address.")
    }
  )
})

describe("seats", () => {
  it("refuses an invitation past the plan's seats", async () => {
    mocks.limits.mockResolvedValue({ maxTeamSeats: 3 })
    mocks.seats.mockResolvedValue(3)

    await expect(assertSeatAvailable("org-1")).rejects.toThrow("Every team seat on your plan is taken.")
  })

  it("says invites start on Grow on a one-seat plan", async () => {
    mocks.limits.mockResolvedValue({ maxTeamSeats: 1 })
    mocks.seats.mockResolvedValue(1)

    await expect(assertSeatAvailable("org-1")).rejects.toThrow("Team invites start on Grow.")
  })

  it("lets one through under the limit, and on unlimited plans", async () => {
    mocks.limits.mockResolvedValue({ maxTeamSeats: 3 })
    mocks.seats.mockResolvedValue(2)
    await expect(assertSeatAvailable("org-1")).resolves.toBeUndefined()

    mocks.limits.mockResolvedValue({ maxTeamSeats: null })
    await expect(assertSeatAvailable("org-1")).resolves.toBeUndefined()
  })

  it("stops membership at the plan's seats, or Better Auth's 100", async () => {
    mocks.limits.mockResolvedValue({ maxTeamSeats: 3 })
    await expect(membershipLimit(null, { id: "org-1" })).resolves.toBe(3)

    mocks.limits.mockResolvedValue({ maxTeamSeats: null })
    await expect(membershipLimit(null, { id: "org-1" })).resolves.toBe(100)
  })
})

describe("deleting a store", () => {
  it("deletes everything the store owns first", async () => {
    mocks.livePlan.mockResolvedValue([])
    await organizationHooks.beforeDeleteOrganization({ organization: { id: "org-1" } })
    expect(mocks.deleteData).toHaveBeenCalledWith("org-1")
    expect(mocks.deleteKeys).toHaveBeenCalled()
  })

  it("keeps a store that still has a live plan, so it isn't billed after it is gone", async () => {
    mocks.livePlan.mockResolvedValue([{ id: "sub-1" }])
    await expect(organizationHooks.beforeDeleteOrganization({ organization: { id: "org-1" } })).rejects.toThrow(
      "Cancel this store's plan"
    )
    expect(mocks.deleteData).not.toHaveBeenCalled()
  })
})
