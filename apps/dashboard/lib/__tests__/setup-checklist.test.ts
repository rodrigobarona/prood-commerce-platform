import { describe, expect, it } from "vitest"
import { setupChecklist, type SetupProgress } from "../setup-checklist"

const STORE_URL = "https://loja-da-ana.prood.app"
const fresh: SetupProgress = {
  totalProducts: 0,
  activeProducts: 0,
  paidOrders: 0,
  canTakeOrders: false,
  hasContactEmail: false,
}

const item = (progress: SetupProgress, id: string) => {
  const found = setupChecklist(progress, STORE_URL).find((entry) => entry.id === id)
  if (!found) throw new Error(`no ${id} item`)
  return found
}

describe("setupChecklist", () => {
  it("starts a new store with everything to do", () => {
    expect(setupChecklist(fresh, STORE_URL).map((entry) => entry.done)).toEqual([
      false,
      false,
      false,
      false,
    ])
  })

  it("has no shipping step, since shipping isn't configurable yet", () => {
    expect(setupChecklist(fresh, STORE_URL).map((entry) => entry.id)).toEqual([
      "product",
      "payment",
      "contact-email",
      "test-order",
    ])
  })

  it("sends a store with no products to add one", () => {
    expect(item(fresh, "product").href).toBe("/products/new")
  })

  it("doesn't count a draft, which shoppers can't buy", () => {
    const product = item({ ...fresh, totalProducts: 2 }, "product")
    expect(product.done).toBe(false)
    expect(product.href).toBe("/products")
  })

  it("counts a published product", () => {
    expect(item({ ...fresh, totalProducts: 1, activeProducts: 1 }, "product").done).toBe(true)
  })

  it("follows the store's payment connection, so losing it reopens the step", () => {
    expect(item({ ...fresh, canTakeOrders: true }, "payment").done).toBe(true)
    expect(item({ ...fresh, paidOrders: 3 }, "payment").done).toBe(false)
    expect(item(fresh, "payment").href).toBe("/integrations")
  })

  it("asks for a contact email, so customers have a way to reach the store", () => {
    expect(item(fresh, "contact-email")).toMatchObject({ done: false, href: "/settings" })
    expect(item({ ...fresh, hasContactEmail: true }, "contact-email").done).toBe(true)
  })

  it("sends the merchant to their real store for a test order", () => {
    const ready = { ...fresh, activeProducts: 1, canTakeOrders: true }
    expect(item(ready, "test-order")).toMatchObject({ href: STORE_URL, external: true, blocked: false })
  })

  it("only ticks the test order once an order reached paid", () => {
    expect(item({ ...fresh, paidOrders: 0 }, "test-order").done).toBe(false)
    expect(item({ ...fresh, paidOrders: 1 }, "test-order").done).toBe(true)
  })

  it.each([
    ["no product", { canTakeOrders: true }],
    ["only drafts", { totalProducts: 2, canTakeOrders: true }],
    ["no provider", { activeProducts: 1 }],
  ])("doesn't offer a test order with %s", (_, progress) => {
    const testOrder = item({ ...fresh, ...progress }, "test-order")
    expect(testOrder.blocked).toBe(true)
    expect(testOrder.description).toBe("Publish a product and connect a payment provider first.")
  })
})
