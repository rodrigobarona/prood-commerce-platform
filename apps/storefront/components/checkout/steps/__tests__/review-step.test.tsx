import { cleanup, render, screen } from "@testing-library/react"
import type { Cart } from "@prood/types"
import { afterEach, describe, expect, it, vi } from "vitest"
import { ReviewStep } from "../review-step"

const price = (amount: number) => ({ amount, currency: "EUR", formatted: "" })

const cart = {
  items: [{ id: "i1", name: { en: "Mug" }, quantity: 1, totalPrice: price(29), price: price(29) }],
  shippingMethod: null,
  totals: { total: price(29), tax: null },
} as unknown as Cart

const open = (props: Partial<Parameters<typeof ReviewStep>[0]> = {}) =>
  render(<ReviewStep demo={false} cart={cart} onSubmit={vi.fn()} onBack={vi.fn()} {...props} />)

afterEach(cleanup)

describe("ReviewStep", () => {
  it("says what's next, from how the store takes payment", () => {
    open({ paymentMethods: ["multibanco", "mbway", "card"] })
    expect(screen.getByText("Next: pay by Multibanco, MB WAY or card on a secure page.")).toBeTruthy()
  })

  it("doesn't invent methods it wasn't told about", () => {
    open()
    expect(screen.getByText("Next: choose how to pay on a secure page.")).toBeTruthy()
  })

  it("keeps the order lines off the page where the summary sits beside them", () => {
    open()
    expect(screen.getByText("Mug").closest(".lg\\:hidden")).toBeTruthy()
  })

  it("is plain about the demo, and offers a store of your own", () => {
    open({ demo: true, signUpUrl: "https://dashboard.example/register", paymentMethods: ["card"] })
    expect(screen.getByText(/your order stops here and nothing is charged/)).toBeTruthy()
    expect(screen.getByRole("link", { name: "Start your own store" }).getAttribute("href")).toBe(
      "https://dashboard.example/register",
    )
    expect((screen.getByRole("button", { name: "Continue to payment" }) as HTMLButtonElement).disabled).toBe(true)
  })

  it("keeps that offer to the demo", () => {
    open({ signUpUrl: "https://dashboard.example/register" })
    expect(screen.queryByRole("link", { name: "Start your own store" })).toBeNull()
  })
})
