import { describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ getCartId: vi.fn(async () => undefined as string | undefined), getCommerceApi: vi.fn() }))

vi.mock("next/headers", () => ({ headers: vi.fn() }))
vi.mock("@/lib/cart-cookie", () => ({ getCartId: mocks.getCartId, clearCartId: vi.fn() }))
vi.mock("@/lib/commerce-api", () => ({ getCommerceApi: mocks.getCommerceApi }))
vi.mock("@/lib/catalog", () => ({ getStore: vi.fn() }))
vi.mock("@/lib/store-host", () => ({ requestHost: vi.fn() }))
vi.mock("@/lib/tenant", () => ({ resolveRequestTenantId: vi.fn() }))

import { startCheckout } from "../actions"

const address = {
  firstName: "Ana",
  lastName: "Silva",
  street: "Rua das Flores 1",
  city: "Lisboa",
  postalCode: "1200-195",
  country: "PT",
}

describe("startCheckout", () => {
  it("tells a shopper with no cart that it's empty", async () => {
    expect(await startCheckout({})).toEqual({ ok: false, error: "Your cart is empty." })
  })

  it("refuses what the form would have refused, before touching the cart", async () => {
    mocks.getCartId.mockResolvedValue("cart-1")
    const refused = { ok: false, error: "Check your details and try again." }
    expect(await startCheckout({ email: "not an email", address })).toEqual(refused)
    expect(await startCheckout({ address: { ...address, postalCode: "1200" } })).toEqual(refused)
    expect(await startCheckout({ address: { ...address, firstName: "" } })).toEqual(refused)
    expect(mocks.getCommerceApi).not.toHaveBeenCalled()
  })
})
