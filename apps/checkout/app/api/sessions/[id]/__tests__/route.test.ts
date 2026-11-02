import { describe, expect, it, vi } from "vitest"

vi.mock("@prood/checkout-host", () => ({
  loadSession: async () => ({
    meta: { providerId: "easypay", kind: "pl", storeName: "Loja da Ana", returnUrl: null, methods: ["card"] },
    snapshot: { state: "info", amount: 66, currency: "EUR", orderId: null, paymentSession: null },
  }),
  loadSessionOrder: async () => null,
  loadStoreEmail: async () => "ola@lojadaana.pt",
}))

import { GET } from "../route"

describe("GET /api/sessions/[id]", () => {
  it("is never stored, because it says how a payment stands right now", async () => {
    const response = await GET(new Request("http://checkout.test"), { params: Promise.resolve({ id: "s1" }) })
    expect(response.headers.get("cache-control")).toBe("no-store")
    expect(await response.json()).toMatchObject({ storeName: "Loja da Ana", storeEmail: "ola@lojadaana.pt" })
  })
})
