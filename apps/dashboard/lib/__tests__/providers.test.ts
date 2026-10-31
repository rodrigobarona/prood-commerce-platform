import { describe, expect, it } from "vitest"
import { connectedMessage, credentialErrorMessage, getProvider, type ProviderMeta } from "../providers"

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

  it("tells every provider how to reach the store", () => {
    for (const meta of [stripe, easypay, ifthenpay]) {
      expect(meta.webhook.instructions).toBeTruthy()
    }
    expect(stripe.webhook.instructions).toBe(
      "Add this URL in your Stripe dashboard, then paste the signing secret here."
    )
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
      "We couldn't connect to Stripe. The secret key looks incomplete. Paste the full key from your Stripe dashboard and try again."
    )
  })

  it("keeps acronyms capitalized", () => {
    expect(credentialErrorMessage(easypay, { ok: false, reason: "rejected", field: "apiKey" })).toContain(
      "The API key looks incomplete."
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
      "IfThenPay connected. Your store can take Multibanco payments. IfThenPay can't test keys, so place a small order to check them."
    )
    expect(connectedMessage(ifthenpay, { mbKey: "a", mbWayKey: "b", ccKey: "c" }, true)).toContain(
      "Multibanco, MB WAY and card payments"
    )
  })

  it("doesn't claim anything when turned off", () => {
    expect(connectedMessage(stripe, {}, false)).toContain("turned off")
  })
})
