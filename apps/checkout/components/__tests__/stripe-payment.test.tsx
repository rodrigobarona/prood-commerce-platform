import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  state: { type: "error", error: { message: "Invalid API Key provided: pk_test_qa" } } as unknown,
  provider: vi.fn(),
  theme: "light",
  changeAppearance: vi.fn(),
}))

vi.mock("@stripe/stripe-js", () => ({ loadStripe: () => Promise.resolve(null) }))
vi.mock("next-themes", () => ({ useTheme: () => ({ resolvedTheme: mocks.theme }) }))
vi.mock("@stripe/react-stripe-js/checkout", () => ({
  CheckoutElementsProvider: ({ options, children }: { options: unknown; children: React.ReactNode }) => {
    mocks.provider(options)
    return children
  },
  PaymentElement: () => <p>Card fields</p>,
  useCheckoutElements: () => mocks.state,
}))

import { CARD_UNAVAILABLE, StripePayment } from "../stripe-payment"

const props = { clientSecret: "secret", publishableKey: "pk_test" }

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {})
  mocks.theme = "light"
  mocks.state = { type: "error", error: { message: "Invalid API Key provided: pk_test_qa" } }
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe("StripePayment", () => {
  it("keeps Stripe's error from the shopper, and logs it", () => {
    render(<StripePayment {...props} />)
    expect(screen.getByRole("alert").textContent).toBe(CARD_UNAVAILABLE)
    expect(document.body.textContent).not.toContain("pk_test_qa")
    expect(console.error).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ message: expect.stringContaining("pk_test_qa") }),
    )
  })

  it("offers a retry and the store when there's nothing else to pay with", () => {
    render(<StripePayment {...props} storeHref="https://store.example/" />)
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy()
    expect(screen.getByRole("link", { name: "Back to the store" }).getAttribute("href")).toBe("https://store.example/")
    expect(screen.queryByRole("button", { name: "Choose another way to pay" })).toBeNull()
  })

  it("offers another way to pay when there is one", () => {
    render(<StripePayment {...props} onChooseAnother={() => {}} />)
    expect(screen.getByRole("button", { name: "Choose another way to pay" })).toBeTruthy()
  })

  it("starts Stripe in the shopper's theme", () => {
    mocks.theme = "dark"
    render(<StripePayment {...props} />)
    expect(mocks.provider).toHaveBeenCalledWith(
      expect.objectContaining({ elementsOptions: { appearance: expect.objectContaining({ theme: "night" }) } }),
    )
  })

  it("follows the theme once the form is up", () => {
    mocks.theme = "dark"
    mocks.state = {
      type: "success",
      checkout: { total: { total: { amount: "€1.00" } }, canConfirm: true, changeAppearance: mocks.changeAppearance },
    }
    render(<StripePayment {...props} />)
    expect(screen.getByText("Card fields")).toBeTruthy()
    expect(mocks.changeAppearance).toHaveBeenCalledWith(expect.objectContaining({ theme: "night" }))
  })
})
