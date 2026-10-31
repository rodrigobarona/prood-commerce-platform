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
}

/** How a provider tells the store a payment arrived. Orders are only marked paid this way. */
export interface ProviderWebhook {
  instructions: string
  /** Stripe events to subscribe to */
  events?: string[]
  /** Placeholders the provider fills in on each call */
  query?: string
}

export interface ProviderMeta {
  id: string
  name: string
  type: ProviderType
  description: string
  docsUrl?: string
  fields: ProviderField[]
  webhook: ProviderWebhook
  /** Whether the provider has a read-only call to test credentials with */
  testable: boolean
  /** What the store can sell through these credentials, for the connected message */
  paymentLabel: (config: Record<string, string>) => string
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
    description:
      "Accept cards, wallets, and local payment methods worldwide with the Stripe Payment Element.",
    docsUrl: "https://stripe.com/docs",
    fields: [
      { key: "publishableKey", label: "Publishable key", type: "text", required: true, placeholder: "pk_live_..." },
      { key: "secretKey", label: "Secret key", type: "password", required: true, placeholder: "sk_live_..." },
      { key: "webhookSecret", label: "Webhook signing secret", type: "password", required: true, placeholder: "whsec_..." },
    ],
    webhook: {
      instructions: "Add this URL in your Stripe dashboard, then paste the signing secret here.",
      events: [
        "checkout.session.completed",
        "checkout.session.async_payment_succeeded",
        "checkout.session.async_payment_failed",
        "checkout.session.expired",
        "charge.refunded",
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
      "Portuguese payments — Multibanco, MB WAY, and card payments via Easypay.",
    docsUrl: "https://docs.easypay.pt",
    fields: [
      { key: "accountId", label: "Account ID", type: "text", required: true },
      { key: "apiKey", label: "API key", type: "password", required: true },
      { key: "baseUrl", label: "API base URL", type: "text", required: false, placeholder: "https://api.prod.easypay.pt" },
    ],
    webhook: {
      instructions:
        "Add this URL in your Easypay account as the Payment URL, under Developers, Configuration API 2.0, Notifications.",
    },
    testable: true,
    paymentLabel: () => "Multibanco, MB WAY and card",
  },
  {
    id: "ifthenpay",
    name: "Ifthenpay",
    type: "payment",
    description:
      "Portuguese payments — Multibanco, MB WAY, and card payments via Ifthenpay.",
    docsUrl: "https://www.ifthenpay.com",
    fields: [
      { key: "antiPhishingKey", label: "Anti-phishing key", type: "password", required: true },
      { key: "mbKey", label: "Multibanco key", type: "text", required: true },
      { key: "mbWayKey", label: "MB WAY key", type: "text", required: false },
      { key: "ccKey", label: "Credit card key", type: "text", required: false },
    ],
    webhook: {
      instructions:
        "Send this URL to Ifthenpay as your callback URL, exactly as shown, with your anti-phishing key.",
      query: "?key=[ANTI_PHISHING_KEY]&orderId=[ORDER_ID]&amount=[AMOUNT]&requestId=[REQUEST_ID]",
    },
    testable: false,
    paymentLabel: (config) =>
      joinLabels([
        "Multibanco",
        ...(config.mbWayKey ? ["MB WAY"] : []),
        ...(config.ccKey ? ["card"] : []),
      ]),
  },
]

export function getProvider(id: string): ProviderMeta | undefined {
  return providerRegistry.find((provider) => provider.id === id)
}

/** The field's label mid-sentence: "Secret key" becomes "secret key", "API key" stays. */
function inSentence(label: string): string {
  return label.replace(/^[A-Z](?=[a-z])/, (letter) => letter.toLowerCase())
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
): string {
  if (!enabled) return `${meta.name} saved and turned off. Your store won't take payments through it.`
  const connected = `${meta.name} connected. Your store can take ${meta.paymentLabel(config)} payments.`
  return meta.testable
    ? connected
    : `${connected} ${meta.name} can't test keys, so place a small order to check them.`
}

export const providerTypeLabels: Record<ProviderType, string> = {
  payment: "Payment",
  notification: "Notification",
  analytics: "Analytics",
}
