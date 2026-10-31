import { describe, expect, it, vi } from "vitest"

vi.mock("next/headers", () => ({ headers: vi.fn() }))
vi.mock("@/lib/cart-cookie", () => ({ getCartId: async () => undefined, clearCartId: vi.fn() }))
vi.mock("@/lib/commerce-api", () => ({ getCommerceApi: vi.fn() }))
vi.mock("@/lib/commerce-data", () => ({ fetchStoreInfo: vi.fn() }))
vi.mock("@/lib/tenant", () => ({ resolveTenantId: vi.fn() }))

import { startCheckout } from "../actions"

describe("startCheckout", () => {
  it("tells a shopper with no cart that it's empty", async () => {
    expect(await startCheckout({})).toEqual({ ok: false, error: "Your cart is empty." })
  })
})
