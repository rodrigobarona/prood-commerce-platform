import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ countOrders: vi.fn(), limits: vi.fn() }))

vi.mock("server-only", () => ({}))
vi.mock("@prood/platform", () => ({ countOrdersThisMonth: mocks.countOrders, countProducts: vi.fn() }))
vi.mock("@/lib/org-plan", () => ({ getOrganizationLimits: mocks.limits }))
vi.mock("@prood/commerce", async () => {
  const { CommerceError } = await import("@prood/types")
  return {
    assertFeature: vi.fn(),
    assertLimit: (current: number, max: number | null, message: string, code = "FORBIDDEN") => {
      if (max !== null && current >= max) throw new CommerceError(message, code as "FORBIDDEN")
    },
    withTenant: (_org: string, fn: () => unknown) => fn(),
  }
})

import { assertCanPlaceOrder } from "../enforcement"

beforeEach(() => {
  mocks.limits.mockResolvedValue({ maxOrdersPerMonth: 50 })
})

describe("assertCanPlaceOrder", () => {
  it("tells callers the store can't take the order, so shoppers aren't told to upgrade", async () => {
    mocks.countOrders.mockResolvedValue(50)
    await expect(assertCanPlaceOrder("org-1")).rejects.toMatchObject({ code: "ORDERS_UNAVAILABLE" })
  })

  it("allows orders under the limit", async () => {
    mocks.countOrders.mockResolvedValue(49)
    await expect(assertCanPlaceOrder("org-1")).resolves.toBeUndefined()
  })
})
