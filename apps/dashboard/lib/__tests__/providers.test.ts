import { describe, expect, it } from "vitest"
import {
  connectedMessage,
  credentialErrorMessage,
  getProvider,
  providerDisplaced,
  providerInCharge,
  type ProviderMeta,
} from "../providers"

const provider = (id: string) => getProvider(id) as ProviderMeta
const stripe = provider("stripe")
const easypay = provider("easypay")
const ifthenpay = provider("ifthenpay")

describe("provider registry", () => {
  it("requires what taking a payment depends on", () => {
    const required = (meta: ProviderMeta, key: string) =>
      meta.fields.find((field) => field.key === key)?.required
    expect(required(stripe, "webhookSecret")).toBe(true)
    expect(required(ifthenpay, "mbKey")).toBe(true)
  })

  it.each(["stripe", "easypay", "ifthenpay"])("guides %s from nothing to a test", (id) => {
    const { guide, fields } = provider(id)
    expect(guide.need.length).toBeGreaterThan(0)
    expect(guide.steps.filter((step) => step.webhook)).toHaveLength(1)
    expect(guide.test.length).toBeGreaterThan(0)
    const inSteps = guide.steps.flatMap((step) => step.fields ?? [])
    expect(fields.filter((field) => field.required && !inSteps.includes(field.key))).toEqual([])
  })

  it("tells each provider's settings the way that provider names them", () => {
    const easypayWebhook = easypay.guide.steps.find((step) => step.webhook)
    const stripeWebhook = stripe.guide.steps.find((step) => step.webhook)
    expect(easypayWebhook?.body).toContain("Generic URL")
    expect(stripeWebhook?.body).toContain("Choose Snapshot, select these events, then paste this address.")
    expect(stripe.guide.test.at(-1)).toContain("its own destination and signing secret")
    expect(ifthenpay.guide.steps[0].body).toContain("set when the callback is activated")
  })

  it("leaves nothing on the page a merchant has to decode", () => {
    expect(stripe.description).not.toContain("Payment Element")
    expect(easypay.fields.some((field) => field.label.includes("API base URL"))).toBe(false)
    expect(easypay.guide.steps.flatMap((step) => step.fields ?? [])).not.toContain("baseUrl")
  })

  it("gives Ifthenpay the placeholders its callback needs", () => {
    for (const placeholder of ["key=[ANTI_PHISHING_KEY]", "orderId=[ORDER_ID]", "amount=[AMOUNT]"]) {
      expect(ifthenpay.webhook.query).toContain(placeholder)
    }
  })
})

describe("credentialErrorMessage", () => {
  it("says what happened, why and what to do", () => {
    expect(credentialErrorMessage(stripe, { ok: false, reason: "rejected", field: "secretKey" })).toBe(
      "We couldn't connect to Stripe. It didn't accept that secret key. Copy it again from your Stripe account and try again."
    )
  })

  it("keeps acronyms capitalized", () => {
    expect(credentialErrorMessage(easypay, { ok: false, reason: "rejected", field: "apiKey" })).toContain(
      "It didn't accept that API key."
    )
  })

  it("doesn't blame the key for an outage", () => {
    expect(credentialErrorMessage(stripe, { ok: false, reason: "unreachable" })).toBe(
      "We couldn't reach Stripe, so nothing was saved. Try again in a minute."
    )
  })

  it("explains mixed test and live keys", () => {
    expect(credentialErrorMessage(stripe, { ok: false, reason: "mismatched", field: "publishableKey" })).toContain(
      "different modes"
    )
  })
})

describe("connectedMessage", () => {
  it("tells the merchant they can sell", () => {
    expect(connectedMessage(stripe, {}, true)).toBe("Stripe connected. Your store can take card payments.")
  })

  it("names only the methods the keys unlock, and says Ifthenpay wasn't tested", () => {
    expect(connectedMessage(ifthenpay, { mbKey: "a" }, true)).toBe(
      "Ifthenpay connected. Your store can take Multibanco payments. Ifthenpay can't test keys, so place a small order to check them."
    )
    expect(connectedMessage(ifthenpay, { mbKey: "a", mbWayKey: "b", ccKey: "c" }, true)).toContain(
      "Multibanco, MB WAY and card payments"
    )
  })

  it("doesn't promise Easypay's methods work, only that they're offered", () => {
    expect(connectedMessage(easypay, {}, true)).toBe(
      "Easypay connected. Your store offers Multibanco, MB WAY and card. Each one works only if it's turned on in your Easypay account."
    )
  })

  it("doesn't claim anything when turned off", () => {
    expect(connectedMessage(stripe, {}, false)).toContain("turned off")
  })
})

describe("one provider at a time", () => {
  it("finds the provider standing in front", () => {
    expect(providerInCharge("easypay", ["stripe", "easypay"])?.id).toBe("stripe")
    expect(providerInCharge("ifthenpay", ["easypay", "ifthenpay"])?.id).toBe("easypay")
    expect(providerInCharge("easypay", ["easypay", "ifthenpay"])).toBeUndefined()
    expect(providerInCharge("stripe", ["stripe", "easypay"])).toBeUndefined()
  })

  it("doesn't promise Multibanco while Stripe is on", () => {
    expect(connectedMessage(easypay, {}, true, stripe)).toBe(
      "Easypay saved. Stripe is on, so checkout stays on Stripe. Turn Stripe off to use Easypay."
    )
    expect(connectedMessage(ifthenpay, { mbWayKey: "x" }, true, stripe)).toBe(
      "Ifthenpay saved. Stripe is on, so checkout stays on Stripe. Turn Stripe off to use Ifthenpay."
    )
  })

  it("says what Stripe takes over from", () => {
    expect(providerDisplaced("stripe", ["stripe", "easypay"])?.id).toBe("easypay")
    expect(connectedMessage(stripe, {}, true, undefined, { meta: easypay, config: {} })).toBe(
      "Stripe connected. Checkout now runs on Stripe, so Easypay stops taking Multibanco and MB WAY."
    )
  })
})
