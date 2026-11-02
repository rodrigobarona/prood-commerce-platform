// Provider registry — static metadata for the integrations a merchant can
// configure. Credentials are stored per organization (see lib/integrations.ts).

import type { CredentialCheck } from "@prood/types"

export type ProviderType = "payment" | "notification" | "analytics"

export interface ProviderField {
  key: string
  label: string
  type: "text" | "password"
  required: boolean
  placeholder?: string
  hint?: string
}

/** How a provider tells the store a payment arrived. Orders are only marked paid this way. */
export interface ProviderWebhook {
  /** Stripe events to subscribe to */
  events?: string[]
  /** Placeholders the provider fills in on each call */
  query?: string
}

/** One step of connecting a provider, written for someone with no developer. */
export interface ProviderStep {
  title: string
  body: string
  /** Keys of the fields filled in at this step. A field in no step goes under Advanced. */
  fields?: string[]
  /** Shows the address the provider sends payment updates to. */
  webhook?: boolean
}

export interface ProviderGuide {
  need: string[]
  steps: [ProviderStep, ProviderStep, ProviderStep]
  /** How to check it works, in order. */
  test: string[]
}

export interface ProviderMeta {
  id: string
  name: string
  type: ProviderType
  description: string
  docsUrl?: string
  fields: ProviderField[]
  webhook: ProviderWebhook
  guide: ProviderGuide
  /** Whether the provider has a read-only call to test credentials with */
  testable: boolean
  /** What the store can sell through these credentials, for the connected message */
  paymentLabel: (config: Record<string, string>) => string
  /** Says what a connection does and doesn't prove, where "can take" would promise too much */
  connectedNote?: string
  /** The local methods a store only gets once this provider is the one in charge. */
  localMethods?: (config: Record<string, string>) => string
}

function joinLabels(labels: string[]): string {
  const last = labels.at(-1) ?? ""
  return labels.length > 1 ? `${labels.slice(0, -1).join(", ")} and ${last}` : last
}

export const providerRegistry: ProviderMeta[] = [
  // Payment providers only — notifications/analytics ship when runtime exists.
  {
    id: "stripe",
    name: "Stripe",
    type: "payment",
    description: "Take card payments through your own Stripe account.",
    docsUrl: "https://stripe.com/docs",
    fields: [
      { key: "publishableKey", label: "Publishable key", type: "text", required: true, placeholder: "pk_live_..." },
      { key: "secretKey", label: "Secret key", type: "password", required: true, placeholder: "sk_live_..." },
      { key: "webhookSecret", label: "Signing secret", type: "password", required: true, placeholder: "whsec_..." },
    ],
    webhook: {
      events: [
        "checkout.session.completed",
        "checkout.session.async_payment_succeeded",
        "checkout.session.async_payment_failed",
        "checkout.session.expired",
        "charge.refunded",
      ],
    },
    guide: {
      need: ["A Stripe account. It's free to open at stripe.com.", "About 10 minutes."],
      steps: [
        {
          title: "Copy your keys from Stripe",
          body: "In your Stripe account, open Developers, then API keys. Paste your publishable key and your secret key here.",
          fields: ["publishableKey", "secretKey"],
        },
        {
          title: "Tell Stripe where to send payment updates",
          body: "This is how your store learns an order was paid. In Stripe, open Developers, then Webhooks, and add a destination. Choose Snapshot, select these events, then paste this address.",
          webhook: true,
        },
        {
          title: "Paste the signing secret and connect",
          body: "Stripe shows a signing secret on the destination you just added. Paste it here. We check your keys with Stripe before saving.",
          fields: ["webhookSecret"],
        },
      ],
      test: [
        "In Stripe, switch to test mode and repeat these steps with your test keys, which start with pk_test_ and sk_test_.",
        "Buy something from your store with the card 4242 4242 4242 4242, any future date and any security code. No real money moves.",
        "Check that the order shows as paid in Orders.",
        "Going live needs its own destination and signing secret. In live mode, repeat steps 1 to 3 with your live keys.",
      ],
    },
    testable: true,
    paymentLabel: () => "card",
  },
  {
    id: "easypay",
    name: "Easypay",
    type: "payment",
    description:
      "Multibanco, MB WAY and card payments through Easypay, for stores in Portugal.",
    docsUrl: "https://docs.easypay.pt",
    fields: [
      { key: "accountId", label: "Account ID", type: "text", required: true },
      { key: "apiKey", label: "API key", type: "password", required: true },
      {
        key: "baseUrl",
        label: "Easypay address",
        type: "text",
        required: false,
        placeholder: "https://api.prod.easypay.pt",
        hint: "Leave it empty to take real payments. Only change it to test.",
      },
    ],
    webhook: {},
    guide: {
      need: ["An Easypay account with Multibanco or MB WAY turned on.", "About 10 minutes."],
      steps: [
        {
          title: "Copy your keys from Easypay",
          body: "In your Easypay account, open Developers, then Configuration API 2.0. Paste your account ID and API key here.",
          fields: ["accountId", "apiKey"],
        },
        {
          title: "Tell Easypay where to send payment updates",
          body: "This is how your store learns an order was paid. In the same place, open Notifications and paste this address as the Generic URL.",
          webhook: true,
        },
        {
          title: "Connect Easypay",
          body: "We check your keys with Easypay before saving.",
        },
      ],
      test: [
        "Easypay gives test accounts their own keys. Paste those, and under Advanced set the Easypay address to https://api.test.easypay.pt.",
        "Buy something from your store and pay with the test details Easypay gives you. No real money moves.",
        "Check that the order shows as paid in Orders, then come back, connect your real keys and clear the address.",
      ],
    },
    testable: true,
    paymentLabel: () => "Multibanco, MB WAY and card",
    connectedNote: "Your store offers Multibanco, MB WAY and card. Each one works only if it's turned on in your Easypay account.",
    localMethods: () => "Multibanco and MB WAY",
  },
  {
    id: "ifthenpay",
    name: "Ifthenpay",
    type: "payment",
    description:
      "Multibanco, MB WAY and card payments through Ifthenpay, for stores in Portugal.",
    docsUrl: "https://www.ifthenpay.com",
    fields: [
      { key: "antiPhishingKey", label: "Anti-phishing key", type: "password", required: true },
      { key: "mbKey", label: "Multibanco key", type: "text", required: true },
      { key: "mbWayKey", label: "MB WAY key", type: "text", required: false },
      { key: "ccKey", label: "Credit card key", type: "text", required: false },
    ],
    webhook: {
      query: "?key=[ANTI_PHISHING_KEY]&orderId=[ORDER_ID]&amount=[AMOUNT]&requestId=[REQUEST_ID]",
    },
    guide: {
      need: ["An Ifthenpay contract with Multibanco. MB WAY and cards are optional extras.", "About 10 minutes."],
      steps: [
        {
          title: "Paste the keys Ifthenpay gave you",
          body: "They're in the details Ifthenpay sent when your contract started. The anti-phishing key is set when the callback is activated. Leave MB WAY and credit card empty if you don't have them.",
          fields: ["antiPhishingKey", "mbKey", "mbWayKey", "ccKey"],
        },
        {
          title: "Tell Ifthenpay where to send payment updates",
          body: "This is how your store learns an order was paid. Send this address to Ifthenpay as your callback URL, exactly as shown.",
          webhook: true,
        },
        {
          title: "Connect Ifthenpay",
          body: "Ifthenpay can't check keys in advance, so test with a small order next.",
        },
      ],
      test: [
        "We can't test Ifthenpay without a real payment, so add a product for a small amount.",
        "Buy it from your store and pay the Multibanco reference in your banking app.",
        "Check that the order shows as paid in Orders, then refund yourself and record it on the order.",
      ],
    },
    testable: false,
    paymentLabel: (config) =>
      joinLabels([
        "Multibanco",
        ...(config.mbWayKey ? ["MB WAY"] : []),
        ...(config.ccKey ? ["card"] : []),
      ]),
    localMethods: (config) => (config.mbWayKey ? "Multibanco and MB WAY" : "Multibanco"),
  },
]

/**
 * Checkout uses one provider at a time: the first one turned on, in registry
 * order. This is the one standing in front of `id`, if any.
 */
export function providerInCharge(id: string, enabledIds: string[]): ProviderMeta | undefined {
  return providerRegistry
    .slice(0, providerRegistry.findIndex((provider) => provider.id === id))
    .find((provider) => enabledIds.includes(provider.id))
}

/** The provider this one takes over from: the first turned on behind it. */
export function providerDisplaced(id: string, enabledIds: string[]): ProviderMeta | undefined {
  return providerRegistry
    .slice(providerRegistry.findIndex((provider) => provider.id === id) + 1)
    .find((provider) => enabledIds.includes(provider.id))
}

/** Why this provider isn't taking payments yet, and what would change that. */
export function checkoutRule(meta: ProviderMeta, inCharge: ProviderMeta): string {
  return `${inCharge.name} is on, so checkout stays on ${inCharge.name}. Turn ${inCharge.name} off to use ${meta.name}.`
}

export function getProvider(id: string): ProviderMeta | undefined {
  return providerRegistry.find((provider) => provider.id === id)
}

/** The field's label mid-sentence: "Secret key" becomes "secret key", "API key" and "MB WAY key" stay. */
export function inSentence(label: string): string {
  return /^(Multibanco|Stripe|Easypay)\b/.test(label) ? label : label.replace(/^[A-Z](?=[a-z])/, (letter) => letter.toLowerCase())
}

/** What happened, why, and what to do about credentials that failed their test. */
export function credentialErrorMessage(
  meta: ProviderMeta,
  check: Exclude<CredentialCheck, { ok: true }>,
): string {
  if (check.reason === "unreachable") {
    return `We couldn't reach ${meta.name}, so nothing was saved. Try again in a minute.`
  }
  if (check.reason === "mismatched") {
    return `We couldn't connect to ${meta.name}. These keys come from different modes. Use two test keys or two live keys and try again.`
  }
  const field = meta.fields.find((candidate) => candidate.key === check.field)
  const name = field ? inSentence(field.label) : "key"
  return `We couldn't connect to ${meta.name}. It didn't accept that ${name}. Copy it again from your ${meta.name} account and try again.`
}

/** The message a merchant sees after saving a provider. */
export function connectedMessage(
  meta: ProviderMeta,
  config: Record<string, string>,
  enabled: boolean,
  inCharge?: ProviderMeta,
  displaced?: { meta: ProviderMeta; config: Record<string, string> },
): string {
  if (!enabled) return `${meta.name} saved and turned off. Your store won't take payments through it.`
  if (inCharge) return `${meta.name} saved. ${checkoutRule(meta, inCharge)}`
  if (displaced) {
    const methods = displaced.meta.localMethods?.(displaced.config) ?? displaced.meta.paymentLabel(displaced.config)
    return `${meta.name} connected. Checkout now runs on ${meta.name}, so ${displaced.meta.name} stops taking ${methods}.`
  }
  const connected = `${meta.name} connected. ${meta.connectedNote ?? `Your store can take ${meta.paymentLabel(config)} payments.`}`
  return meta.testable
    ? connected
    : `${connected} ${meta.name} can't test keys, so place a small order to check them.`
}

export const providerTypeLabels: Record<ProviderType, string> = {
  payment: "Payment",
  notification: "Notification",
  analytics: "Analytics",
}
